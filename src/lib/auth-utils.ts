// Get client key from cookies (client-side only)
export function getClientKeyFromCookie(): string | null {
  if (typeof window === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'xi-client-key') {
      return value;
    }
  }
  return null;
}

// Set client key as cookie (client-side only)
export function setClientKeyCookie(clientKey: string): void {
  if (typeof window === 'undefined') return;

  document.cookie = `xi-client-key=${clientKey}; path=/; max-age=${60 * 60 * 24 * 30}; secure; samesite=strict`;
}

// Remove client key cookie (client-side only)
export function removeClientKeyCookie(): void {
  if (typeof window === 'undefined') return;

  document.cookie = 'xi-client-key=; path=/; max-age=0; secure; samesite=strict';
}