interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'coach' | 'client';
  firstName?: string;
  lastName?: string;
  gymId?: string;
  gymName?: string;
}

export function redirectToMobileApp(
  tokens: { accessToken: string; refreshToken: string },
  user: User
): void {
  // Default to localhost:3002 for local development if env var not set
  const mobileAppUrl = import.meta.env.VITE_MOBILE_APP_URL || 'http://localhost:3002';

  // Encode tokens and user data as base64
  const authData = btoa(JSON.stringify({ tokens, user }));

  // Redirect with hash fragment (not sent to server)
  window.location.href = `${mobileAppUrl}#auth=${authData}`;
}

export function shouldRedirectToMobile(user: User | null): boolean {
  return user?.role === 'client';
}
