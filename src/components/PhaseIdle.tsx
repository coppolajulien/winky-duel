export function PhaseIdle() {
  return (
    <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center justify-center gap-8">
      {/* Title */}
      <div className="text-center">
        <img
          src="/duel.svg"
          alt="Blinkit duel"
          className="mx-auto mb-2 h-14 w-14 dark:invert"
        />
        <h2 className="text-2xl font-extrabold text-wink-text">
          Blink the fastest. Win the pot.
        </h2>
        <p className="mt-2 max-w-sm text-sm text-wink-text-dim">
          Every blink is a transaction on MegaETH. Outblink your opponent to take it all.
        </p>
      </div>

      {/* Steps */}
      <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wink-pink/20 text-sm font-bold text-wink-pink">
            1
          </span>
          <p className="text-sm font-semibold text-wink-text">Activate your camera</p>
          <p className="text-xs text-wink-text-dim">
            No worries — your face stays private, nothing is shared or stored.
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wink-cyan/20 text-sm font-bold text-wink-cyan">
            2
          </span>
          <p className="text-sm font-semibold text-wink-text">Blink as fast as you can</p>
          <p className="text-xs text-wink-text-dim">
            After the 3-2-1 countdown, every blink counts. 30 seconds on the clock.
          </p>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wink-orange/20 text-sm font-bold text-wink-orange">
            3
          </span>
          <p className="text-sm font-semibold text-wink-text">Beat your opponent</p>
          <p className="text-xs text-wink-text-dim">
            Watch the live curve, outscore the target, and take the pot.
          </p>
        </div>
      </div>

      {/* CTA hint */}
      <p className="text-xs text-wink-text-dim">
        Pick a duel from the sidebar to start
      </p>
    </div>
  );
}
