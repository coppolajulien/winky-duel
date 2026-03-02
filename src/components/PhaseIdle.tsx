export function PhaseIdle() {
  return (
    <div className="flex flex-1 animate-[fade-in_0.5s_ease] flex-col items-center justify-center">
      <div className="mb-3 text-[56px] opacity-40">👁️</div>
      <div className="text-lg font-bold text-wink-text">
        Select a duel to begin
      </div>
      <div className="mt-1.5 text-xs text-wink-text-dim">
        Create or challenge from the sidebar
      </div>
    </div>
  );
}
