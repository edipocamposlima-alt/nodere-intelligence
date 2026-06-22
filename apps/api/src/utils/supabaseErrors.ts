export function isMissingSupabaseSchema(error: unknown) {
  const source = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = String(source?.code || "");
  const text = `${String(source?.message || "")} ${String(source?.details || "")}`;
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "42703" ||
    text.includes("Could not find the table") ||
    text.includes("schema cache") ||
    text.includes("column") && text.includes("does not exist")
  );
}
