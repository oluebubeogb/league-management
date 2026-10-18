"use client";

export function LogoutButton() {
  return (
    <button
      type="button"
      className="btn-secondary text-sm"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Log out
    </button>
  );
}
