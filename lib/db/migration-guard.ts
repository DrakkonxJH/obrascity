/**
 * Returns true when a Supabase/PostgREST error indicates a table (or column)
 * does not exist yet — i.e., the migration hasn't been applied in production.
 *
 * Use this to add graceful fallbacks so the app runs without crashing while
 * pending migrations are queued.
 */
export function isMissingRelation(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return (
    (msg.includes("could not find the table") && msg.includes("schema cache")) ||
    msg.includes("relation") && msg.includes("does not exist") ||
    msg.includes("column") && msg.includes("does not exist") ||
    msg.includes("table") && msg.includes("does not exist")
  );
}
