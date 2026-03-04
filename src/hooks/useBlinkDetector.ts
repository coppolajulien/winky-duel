"use client";

import { useRef, useState, useCallback, useEffect, type MutableRefObject } from "react";
import { computeEAR } from "@/lib/blinkDetection";
import { drawMesh } from "@/lib/drawMesh";
import { L_EYE, R_EYE, EAR_THRESHOLD } from "@/lib/faceMeshData";
import { useThemeColors, type ThemeColors } from "@/lib/theme";

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
  const lastTimestampRef = useRef(0);
  const warmedUpRef = useRef(false);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "ready" | "denied">("idle");
  const themeColors = useThemeColors();
  const themeColorsRef = useRef<ThemeColors>(themeColors);
  themeColorsRef.current = themeColors;

  // Suppress TensorFlow Lite INFO logs that Next.js dev overlay treats as errors
  useEffect(() => {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("TensorFlow Lite")) return;
      orig.apply(console, args);
    };
    return () => { console.error = orig; };
  }, []);

  const safeDetect = useCallback(
    (fl: any, v: HTMLVideoElement, timestamp: number) => {
      // Returns landmarks or null, never throws
      try {
        const res = fl.detectForVideo(v, timestamp);
        if (res.faceLandmarks?.length > 0) {
          return res.faceLandmarks[0];
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
      const now = performance.now();
      if (now <= lastTimestampRef.current) {
        animRef.current = requestAnimationFrame(detect);
        return;
      }
      lastTimestampRef.current = now;

      // Skip detection until warmup is done
      if (!warmedUpRef.current) {
        drawMesh(ctx, null, cv.width, cv.height, 0, themeColorsRef.current);
        animRef.current = requestAnimationFrame(detect);
        return;
      }

      const landmarks = safeDetect(fl, v, now);

      if (landmarks) {
        const le = computeEAR(L_EYE, landmarks);
        const re = computeEAR(R_EYE, landmarks);
        const avg = (le + re) / 2;

        if (avg < EAR_THRESHOLD) {
          frameCtRef.current++;
        } else {
          if (frameCtRef.current >= 2) {
            const t = Date.now();
            if (t - lastBlinkRef.current > 250) {
              lastBlinkRef.current = t;
              flashRef.current = 10; // Visual flash on mesh (works in ALL phases)
              onBlinkRef.current?.(); // Score callback (only counts during playing)
            }
          }
          frameCtRef.current = 0;
        }

        if (flashRef.current > 0) flashRef.current--;
        drawMesh(ctx, landmarks, cv.width, cv.height, flashRef.current / 10, themeColorsRef.current);
      } else {
        drawMesh(ctx, null, cv.width, cv.height, 0, themeColorsRef.current);
      }

      animRef.current = requestAnimationFrame(detect);
    };
    detect();
  }, [onBlinkRef, safeDetect]);

  const initCamera = useCallback(async (): Promise<boolean> => {
    if (cameraReady.current) return true;
    setCameraStatus("loading");
    try {
      console.log("[Winky] Loading MediaPipe...");
      const { FaceLandmarker, FilesetResolver } = await import(
        "@mediapipe/tasks-vision"
      );
      const fs = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
      );
      console.log("[Winky] MediaPipe WASM loaded");

      const MODEL_URL =
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

      try {
        flRef.current = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        console.log("[Winky] FaceLandmarker created (GPU)");
      } catch (gpuErr) {
        console.warn("[Winky] GPU failed, falling back to CPU:", gpuErr);
        flRef.current = await FaceLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        console.log("[Winky] FaceLandmarker created (CPU)");
      }

      console.log("[Winky] Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      console.log("[Winky] Camera stream obtained");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise<void>((r) => {
          if (videoRef.current) videoRef.current.onloadeddata = () => r();
        });

        if (canvasRef.current) {
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
        }

        await new Promise<void>((r) => setTimeout(r, 300));
        warmedUpRef.current = true;

        cameraReady.current = true;
        setCameraStatus("ready");
        detectLoop();
        console.log("[Winky] Blink detection started");
        return true;
      }
      setCameraStatus("denied");
      return false;
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("[Winky] Camera init failed:", err, e);
      setCameraStatus("denied");
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
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, []);

  const isCameraReady = useCallback(() => cameraReady.current, []);

  return { videoRef, canvasRef, initCamera, triggerFlash, cameraStatus, isCameraReady };
}
