/**
 * VAPI assistant id from the environment. Call this only where you actually
 * need the id (e.g. starting a session), so importing `lib/constants` for
 * unrelated data does not crash the app when the var is unset.
 */
export function getAssistantId(): string {
  const raw = process.env.NEXT_PUBLIC_ASSISTANT_ID;
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new Error(
      'NEXT_PUBLIC_ASSISTANT_ID is not set. Add it to .env.local, e.g. NEXT_PUBLIC_ASSISTANT_ID="your_vapi_assistant_id"',
    );
  }
  return raw.trim();
}
