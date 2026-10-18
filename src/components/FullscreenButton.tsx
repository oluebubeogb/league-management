"use client";

export function FullscreenButton() {
  return (
    <button
      type="button"
      aria-label="Toggle fullscreen"
      className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 sm:inline-flex"
      onClick={() => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
      </svg>
    </button>
  );
}
