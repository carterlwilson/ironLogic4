interface AuthData {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  user: {
    id: string;
    email: string;
    role: 'admin' | 'owner' | 'coach' | 'client';
    firstName?: string;
    lastName?: string;
    gymId?: string;
    gymName?: string;
  };
}

export function importAuthFromHash(): AuthData | null {
  try {
    const hash = window.location.hash;

    if (!hash || !hash.startsWith('#auth=')) {
      return null;
    }

    // Extract and decode auth data
    const authParam = hash.substring(6); // Remove '#auth='
    const decodedData = atob(authParam);
    const authData: AuthData = JSON.parse(decodedData);

    // Validate required fields
    if (!authData.tokens?.accessToken || !authData.user?.id) {
      console.error('Invalid auth data in hash');
      return null;
    }

    return authData;
  } catch (error) {
    console.error('Failed to import auth from hash:', error);
    return null;
  }
}

export function clearAuthHash(): void {
  // Remove hash fragment without triggering page reload
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}
