"use client";

import { useRef, useState, useCallback, useEffect, type MutableRefObject } from "react";
import { drawMesh } from "@/lib/drawMesh";
import { useThemeColors, type ThemeColors } from "@/lib/theme";

// ── Blendshape blink detection constants ──
const BLINK_THRESHOLD = 0.35; // blendshape score 0→1 (eyes closed > threshold = blink)
const BLINK_COOLDOWN = 180;   // ms between registered blinks

interface UseBlinkDetectorOptions {
  onBlinkRef: MutableRefObject<(() => void) | null>;
}

export function useBlinkDetector({ onBlinkRef }: UseBlinkDetectorOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flRef = useRef<any>(null);
  const frameCtRef = useRef(0);
  const lastBlinkRef = useRef(0);
  const animRef = useRef<number>(0);
  const flashRef = useRef(0);
  const cameraReady = useRef(false);
  const initializingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lastTimestampRef = useRef(0);
  const warmedUpRef = useRef(false);
  const drawTickRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "ready" | "denied">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const themeColors = useThemeColors();
  const themeColorsRef = useRef<ThemeColors>(themeColors);
  themeColorsRef.current = themeColors;

  // Suppress TensorFlow Lite INFO logs that Next.js dev overlay treats as errors
  useEffect(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && (args[0].includes("TensorFlow Lite") || args[0].includes("isActive"))) return;
      orig.apply(console, args);
    };
    return () => { console.error = orig; };
  }, []);

  const safeDetect = useCallback(
    (fl: any, v: HTMLVideoElement, timestamp: number): { landmarks: any; blinkScore: number } | null => {
      try {
        const res = fl.detectForVideo(v, timestamp);
        if (res.faceLandmarks?.length > 0) {
          // Extract blendshape blink scores
          let blinkScore = 0;
          const shapes = res.faceBlendshapes?.[0]?.categories;
          if (shapes) {
            const blinkL = shapes.find((c: any) => c.categoryName === "eyeBlinkLeft");
            const blinkR = shapes.find((c: any) => c.categoryName === "eyeBlinkRight");
            const left = blinkL?.score ?? 0;
            const right = blinkR?.score ?? 0;
            blinkScore = (left + right) / 2;
          }
          return { landmarks: res.faceLandmarks[0], blinkScore };
        }
      } catch {
        // Swallow - can fail during warmup
      }
      return null;
    },
    []
  );

  const detectLoop = useCallback(() => {
    const detect = () => {
      const v = videoRef.current;
      const cv = canvasRef.current;
      const fl = flRef.current;

      // All three must be ready — detection pauses when canvas is absent (saves GPU)
      if (
        !v ||
        !cv ||
        !fl ||
        v.paused ||
        v.readyState < 4 ||
        v.videoWidth === 0 ||
        v.videoHeight === 0
      ) {
        animRef.current = requestAnimationFrame(detect);
        return;
      }

      const ctx = cv.getContext("2d");
      if (!ctx) {
        animRef.current = requestAnimationFrame(detect);
        return;
      }

      // Ensure timestamps are monotonically increasing (MediaPipe requirement)
      const rawNow = performance.now();
      const now = rawNow > lastTimestampRef.current ? rawNow : lastTimestampRef.current + 1;
      lastTimestampRef.current = now;

      // Skip detection until warmup is done
      if (!warmedUpRef.current) {
        drawMesh(ctx, null, cv.width, cv.height, 0, themeColorsRef.current);
        animRef.current = requestAnimationFrame(detect);
        return;
      }

      const result = safeDetect(fl, v, now);

      if (result) {
        const { landmarks, blinkScore } = result;

        // Blendshape-based detection: score rises when eyes close
        if (blinkScore >= BLINK_THRESHOLD) {
          frameCtRef.current++; // eyes closing
        } else {
          // Eyes opened back up — check if we had a blink
          if (frameCtRef.current >= 1) {
            const t = Date.now();
            if (t - lastBlinkRef.current > BLINK_COOLDOWN) {
              lastBlinkRef.current = t;
              flashRef.current = 10;
              onBlinkRef.current?.();
            }
          }
          frameCtRef.current = 0;
        }

        if (flashRef.current > 0) flashRef.current--;

        // Throttle rendering: draw every 2nd frame to keep detection fast
        drawTickRef.current++;
        if (drawTickRef.current % 2 === 0 || flashRef.current > 0) {
          drawMesh(ctx, landmarks, cv.width, cv.height, flashRef.current / 10, themeColorsRef.current);
        }
      } else {
        drawMesh(ctx, null, cv.width, cv.height, 0, themeColorsRef.current);
      }

      animRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, [onBlinkRef, safeDetect]);

  const initCamera = useCallback(async (): Promise<boolean> => {
    if (cameraReady.current) return true;
    if (initializingRef.current) return false; // Prevent concurrent calls
    initializingRef.current = true;
    setCameraStatus("loading");
    setCameraError(null);

    // ── Check browser support ──
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("[Blinkit] getUserMedia not available");
      setCameraError("Your browser doesn't support camera access. Use Chrome or Firefox on HTTPS.");
      setCameraStatus("denied");
      initializingRef.current = false;
      return false;
    }

    try {
      // ── Load MediaPipe ──
      console.log("[Blinkit] Loading MediaPipe...");
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const fs = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
      );
      console.log("[Blinkit] MediaPipe WASM loaded");

      const MODEL_URL =
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

      try {
        flRef.current = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        console.log("[Blinkit] FaceLandmarker created (GPU + blendshapes)");
      } catch (gpuErr) {
        console.warn("[Blinkit] GPU failed, falling back to CPU:", gpuErr);
        flRef.current = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        console.log("[Blinkit] FaceLandmarker created (CPU + blendshapes)");
      }

      // ── Request camera ──
      console.log("[Blinkit] Requesting camera access...");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
        });
      } catch (firstErr) {
        console.warn("[Blinkit] Retrying with minimal video constraints...", firstErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (secondErr) {
          // Specific error messages based on error type
          const name = secondErr instanceof DOMException ? secondErr.name : "";
          if (name === "NotAllowedError") {
            setCameraError("Camera permission denied. Click the camera icon in your browser's address bar to allow access, then reload.");
          } else if (name === "NotFoundError") {
            setCameraError("No camera found. Please connect a webcam and reload the page.");
          } else if (name === "NotReadableError") {
            setCameraError("Camera is already in use by another app (Zoom, Teams, etc.). Close it and reload.");
          } else {
            setCameraError(`Camera error: ${secondErr instanceof Error ? secondErr.message : String(secondErr)}`);
          }
          console.error("[Blinkit] Camera access failed:", secondErr);
          setCameraStatus("denied");
          initializingRef.current = false;
          return false;
        }
      }
      console.log("[Blinkit] Camera stream obtained");
      streamRef.current = stream;

      // ── Attach stream to video element with timeout ──
      if (!videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraError("Video element not found. Try reloading the page.");
        setCameraStatus("denied");
        initializingRef.current = false;
        return false;
      }

      videoRef.current.srcObject = stream;

      // Wait for video data with a 10s timeout
      const videoLoaded = await Promise.race([
        new Promise<true>((resolve) => {
          const v = videoRef.current!;
          if (v.readyState >= 4) return resolve(true);
          v.onloadeddata = () => resolve(true);
        }),
        new Promise<false>((resolve) =>
          setTimeout(() => resolve(false), 10000)
        ),
      ]);

      if (!videoLoaded) {
        setCameraError("Camera stream timed out. Your webcam may be unresponsive. Try unplugging and reconnecting it.");
        setCameraStatus("denied");
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        initializingRef.current = false;
        return false;
      }

      if (canvasRef.current) {
        canvasRef.current.width = 320;
        canvasRef.current.height = 240;
      }

      await new Promise<void>((r) => setTimeout(r, 300));
      warmedUpRef.current = true;

      cameraReady.current = true;
      setCameraStatus("ready");
      detectLoop();
      console.log("[Blinkit] Blink detection started");
      return true;
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[Blinkit] Camera init failed:", err, e);
      // Stop any stream that was acquired before the error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraError(`Initialization failed: ${err}`);
      setCameraStatus("denied");
      initializingRef.current = false;
      return false;
    }
  }, [detectLoop]);

  const triggerFlash = useCallback(() => {
    flashRef.current = 10;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      // Close FaceLandmarker to free GPU/WASM memory
      if (flRef.current?.close) {
        flRef.current.close();
        flRef.current = null;
      }
    };
  }, []);

  const isCameraReady = useCallback(() => cameraReady.current, []);

  return { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus, cameraError, isCameraReady };
}
