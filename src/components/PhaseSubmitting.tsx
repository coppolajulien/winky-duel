export function PhaseSubmitting() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-wink-pink border-t-transparent" />
      <div className="mt-4 text-sm text-wink-text-dim">
        Submitting...
      </div>
    </div>
  );
}
