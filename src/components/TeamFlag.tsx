/** Small 3-stripe team flag (admin-editable colors). */
export function TeamFlag({
  color1 = "#16a34a",
  color2 = "#ffffff",
  color3 = "#0f172a",
  size = "md",
  title,
}: {
  color1?: string | null;
  color2?: string | null;
  color3?: string | null;
  size?: "sm" | "md" | "lg";
  title?: string;
}) {
  const dims =
    size === "sm"
      ? "h-6 w-4"
      : size === "lg"
        ? "h-10 w-7"
        : "h-8 w-5";

  return (
    <span
      className={`inline-flex ${dims} shrink-0 flex-col overflow-hidden rounded-[3px] border border-slate-300 shadow-sm`}
      title={title}
      aria-hidden={!title}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <span className="flex-1" style={{ backgroundColor: color1 || "#16a34a" }} />
      <span className="flex-1" style={{ backgroundColor: color2 || "#ffffff" }} />
      <span className="flex-1" style={{ backgroundColor: color3 || "#0f172a" }} />
    </span>
  );
}
