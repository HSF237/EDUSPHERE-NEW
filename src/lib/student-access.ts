/** Student accounts have a small, explicit workspace. Never inherit staff pages/actions. */
export function studentPageAllowed(path: string) {
  return ["/dashboard", "/homework", "/copilot", "/settings", "/notifications"].includes(path);
}
