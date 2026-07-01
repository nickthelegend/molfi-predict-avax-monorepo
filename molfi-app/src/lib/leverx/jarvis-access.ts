/** Client-side gate for enabling Jarvis (testing). */
export const JARVIS_ENABLE_PASSWORD = "SUI-OVERFLOW-2026";

export function isJarvisEnablePasswordValid(password: string): boolean {
  return password.trim() === JARVIS_ENABLE_PASSWORD;
}
