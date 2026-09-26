/**
 * DARE Authentication Service for AssetFlow
 * Handles JWT token storage, login, admin register, Google OAuth, and auth state.
 * Connected to the Express backend — no mock fallbacks.
 */

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = rawApiUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
const TOKEN_KEY = "dare_token";
const USER_KEY = "dare_user";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  role?: "Employee" | "Department Head" | "Asset Manager" | "Administrator";
  department?: string | null;
  departmentId?: string | null;
  provider?: string;
  organizationId?: string | null;
  isOrganizationOwner?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: string;
  forcePasswordChange?: boolean;
  organization?: {
    id: string;
    name: string;
    slug?: string;
    logo?: string;
    industry?: string;
    companySize?: string;
    country?: string;
    timezone?: string;
    currency?: string;
    onboardingStep?: string;
    onboardingCompleted?: boolean;
  } | null;
}

// ─── Token Storage ──────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// ─── Cached User ────────────────────────────────────────────────────────────

export function getCachedUser(): UserResponse | null {
  const data = localStorage.getItem(USER_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

export function cacheUser(user: UserResponse): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── API Calls (Real Backend) ───────────────────────────────────────────────

/**
 * Company Admin Registration — creates Organization + Admin User
 */
export async function adminRegister(
  companyName: string,
  adminName: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE}/api/auth/admin-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ companyName, adminName, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.detail || `Registration failed (${response.status})`);
  }

  const result = data.data || data;
  setToken(result.access_token);

  if (result.user) {
    cacheUser(result.user);
  } else {
    try {
      const user = await getCurrentUser();
      cacheUser(user);
    } catch {
      // Non-critical
    }
  }

  return {
    access_token: result.access_token,
    token_type: result.token_type || "bearer",
  };
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.detail || `Login failed (${response.status})`);
  }

  // The backend returns { success, data: { token || access_token, user } }
  const result = data.data || data;
  const token = result.token || result.access_token;
  if (token) {
    setToken(token);
  }

  if (result.user) {
    const formattedUser: UserResponse = {
      id: result.user.id || result.user._id,
      email: result.user.email,
      username: result.user.name || result.user.username || email.split('@')[0],
      name: result.user.name || email.split('@')[0],
      role: result.user.role || 'Inventory Manager',
      is_active: result.user.isActive ?? true,
      created_at: result.user.createdAt || new Date().toISOString(),
    };
    cacheUser(formattedUser);
  } else {
    try {
      const user = await getCurrentUser();
      cacheUser(user);
    } catch {
      // Non-critical — we have the token
    }
  }

  return {
    access_token: token,
    token_type: result.token_type || "bearer",
  };
}

/**
 * Public User Registration
 * POST /api/auth/register
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'INVENTORY_MANAGER',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.detail || `Registration failed (${response.status})`);
  }

  const result = data.data || data;
  const token = result.token || result.access_token;
  if (token) {
    setToken(token);
  }

  if (result.user) {
    const formattedUser: UserResponse = {
      id: result.user.id || result.user._id,
      email: result.user.email,
      username: result.user.name || result.user.username || name,
      name: result.user.name || name,
      role: result.user.role || 'Inventory Manager',
      is_active: result.user.isActive ?? true,
      created_at: result.user.createdAt || new Date().toISOString(),
    };
    cacheUser(formattedUser);
  }

  return {
    access_token: token,
    token_type: result.token_type || "bearer",
  };
}

/**
 * Request Password Reset OTP
 * POST /api/auth/forgot-password
 */
export async function requestPasswordResetOtp(email: string): Promise<{
  success: boolean;
  message: string;
  data?: { email: string; name: string; otp?: string };
}> {
  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email: email.toLowerCase().trim() }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to request password reset OTP');
  }

  return data;
}

/**
 * Verify 6-digit Password Reset OTP
 * POST /api/auth/verify-otp
 */
export async function verifyResetOtp(
  email: string,
  otp: string
): Promise<{ success: boolean; message: string; resetToken: string }> {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'OTP verification failed');
  }

  const resetToken = data.data?.resetToken || data.resetToken;
  return {
    success: true,
    message: data.message || 'OTP verified successfully',
    resetToken,
  };
}

/**
 * Reset Password with Verified Token
 * POST /api/auth/reset-password
 */
export async function resetPasswordWithToken(payload: {
  email: string;
  resetToken: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: payload.email.toLowerCase().trim(),
      resetToken: payload.resetToken,
      newPassword: payload.newPassword,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Password reset failed');
  }

  return {
    success: true,
    message: data.message || 'Password updated successfully. Please sign in.',
  };
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
    }
    throw new Error("Failed to fetch user profile");
  }

  const data = await response.json();
  // Backend wraps in { success, data: user }
  return data.data || data;
}

export function logout(): void {
  // Fire-and-forget backend logout to clear refresh cookie
  fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    credentials: "include",
  }).catch(() => {});
  clearToken();
}


// ─── Google OAuth ───────────────────────────────────────────────────────────

/**
 * Returns the URL to redirect the browser to for Google OAuth consent.
 * This hits the backend endpoint which constructs the Google URL and redirects.
 */
export function getGoogleAuthUrl(): string {
  return `${API_BASE}/api/auth/google`;
}

/**
 * Handle the token received from Google OAuth callback redirect.
 * Stores the token and fetches the user profile.
 */
export async function handleGoogleCallback(token: string): Promise<UserResponse> {
  setToken(token);

  const user = await getCurrentUser();
  cacheUser(user);

  return user;
}

export const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  requestPasswordResetOtp: async (email: string) => {
    const res = await requestPasswordResetOtp(email);
    return {
      email: res.data?.email || (res as any).email || email,
      name: res.data?.name || (res as any).name || 'Valued User',
      otp: res.data?.otp || (res as any).otp || '',
    };
  },
  verifyResetOtp,
  resetPasswordWithToken: async (email: string, resetToken: string, newPassword: string) => {
    return resetPasswordWithToken({ email, resetToken, newPassword });
  },
};

