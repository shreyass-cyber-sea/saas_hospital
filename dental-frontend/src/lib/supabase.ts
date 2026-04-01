type SupabaseAuthUser = {
  id: string;
  email?: string;
};

type SupabaseSession = {
  access_token: string;
  refresh_token?: string;
  user: SupabaseAuthUser;
};

type SupabaseAuthResponse = {
  user: SupabaseAuthUser | null;
  session: SupabaseSession | null;
};

type AuthCredentials = {
  email: string;
  password: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the frontend .env file.');
  }

  return {
    url: supabaseUrl.replace(/\/+$/, ''),
    anonKey: supabaseAnonKey,
  };
}

async function parseAuthResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.error_description ||
      data.msg ||
      data.message ||
      'Supabase authentication request failed.';
    throw new Error(message);
  }

  return data;
}

export async function signInWithSupabase(credentials: AuthCredentials): Promise<SupabaseSession> {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await parseAuthResponse(response);
  return data as SupabaseSession;
}

export async function signUpWithSupabase(credentials: AuthCredentials): Promise<SupabaseAuthResponse> {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await parseAuthResponse(response);
  return data as SupabaseAuthResponse;
}

export async function signOutFromSupabase(accessToken: string | null) {
  if (!accessToken) {
    return;
  }

  const { url, anonKey } = getSupabaseConfig();

  try {
    await fetch(`${url}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  } catch {
    // Local logout should still succeed even if the network call fails.
  }
}
