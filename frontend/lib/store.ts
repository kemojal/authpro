import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  is_2fa_enabled?: boolean;
  oauth_provider?: string;
  roles: Array<{ name: string }>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginVerificationRequired: boolean;
  pendingUserId: string | null;
  login: (email: string, password: string) => Promise<void>;
  verify2FALogin: (code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

// Helper function to extract error message from various error formats
const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;

  // Define a type for common error shapes
  interface ErrorWithResponse {
    response?: {
      status?: number;
      data?: {
        detail?: string | Array<{ msg: string; loc: string[] }>;
        message?: string;
      };
      statusText?: string;
    };
    message?: string;
  }

  const errorObj = error as ErrorWithResponse;

  if (errorObj.response) {
    // Handle validation errors (422)
    if (errorObj.response.status === 422 && errorObj.response.data?.detail) {
      if (Array.isArray(errorObj.response.data.detail)) {
        // Get a readable message from validation errors
        return errorObj.response.data.detail
          .map((err) => `${err.msg} for ${err.loc[1]}`)
          .join(", ");
      }
    }

    if (typeof errorObj.response.data === "string") {
      return errorObj.response.data;
    } else if (errorObj.response.data?.detail) {
      if (typeof errorObj.response.data.detail === "string") {
        return errorObj.response.data.detail;
      } else {
        return JSON.stringify(errorObj.response.data.detail);
      }
    } else if (errorObj.response.data?.message) {
      return errorObj.response.data.message;
    }
  }

  if (errorObj.message) return errorObj.message;

  return "An unknown error occurred";
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      loginVerificationRequired: false,
      pendingUserId: null,

      login: async (email: string, password: string) => {
        // Clear state before starting
        set({
          isLoading: true,
          error: null,
          loginVerificationRequired: false,
          pendingUserId: null,
        });

        // Set a login timeout to prevent hanging
        const loginTimeout = setTimeout(() => {
          console.error("Login timed out");
          set({
            error: "Login request timed out. Please try again.",
            isLoading: false,
            user: null,
            isAuthenticated: false,
            loginVerificationRequired: false,
            pendingUserId: null,
          });
        }, 10000); // 10 second timeout as a fallback safety

        try {
          console.log(`Attempting login with email: ${email} to API server`);

          // First step: Login to get the token
          const loginResponse = await api.login(email, password);

          // Properly type the response
          interface LoginResponse {
            status: number;
            statusText: string;
            data?: {
              access_token?: string;
              user_id?: string;
              email?: string;
              requires_2fa?: boolean;
            };
          }

          const typedResponse = loginResponse as LoginResponse;

          console.log("Login response received:", {
            status: typedResponse.status,
            statusText: typedResponse.statusText,
            hasData: !!typedResponse.data,
            accessToken: typedResponse.data?.access_token
              ? "Present"
              : "Missing",
            requires2FA: typedResponse.data?.requires_2fa,
            cookies: document.cookie
              ? document.cookie.substring(0, 60) + "..."
              : "None",
          });

          // Clear the timeout since we got a response
          clearTimeout(loginTimeout);

          // Check if 2FA is required
          if (typedResponse.data?.requires_2fa && typedResponse.data?.user_id) {
            set({
              isLoading: false,
              loginVerificationRequired: true,
              pendingUserId: typedResponse.data.user_id,
            });
            return; // Stop the login process here and wait for 2FA verification
          }

          // Add a small delay to ensure cookies are properly set
          await new Promise((resolve) => setTimeout(resolve, 800));

          // Check cookie state after login
          console.log(
            "Cookies after login delay:",
            document.cookie ? document.cookie.substring(0, 60) + "..." : "None"
          );

          // If we don't have an access token in the response or cookies, throw an error
          if (
            !typedResponse.data?.access_token &&
            !document.cookie.includes("access_token") &&
            !document.cookie.includes("token_debug")
          ) {
            throw new Error("No access token received from server");
          }

          try {
            // Second step: Get user data with the token
            console.log("Fetching user data with token");
            const { data: userData } = await api.getCurrentUser();
            console.log("User data fetched successfully:", userData?.email);

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              loginVerificationRequired: false,
              pendingUserId: null,
            });
          } catch (userError: unknown) {
            console.error("Error fetching user data:", userError);

            // If we can't get user data, still consider login successful but with limited data
            if (typedResponse.data?.user_id) {
              const partialUserData: User = {
                id: typedResponse.data.user_id,
                email: typedResponse.data.email || email,
                is_verified: false,
                roles: [],
              };

              console.log(
                "Using partial user data from login response:",
                partialUserData
              );

              set({
                user: partialUserData,
                isAuthenticated: true,
                isLoading: false,
                loginVerificationRequired: false,
                pendingUserId: null,
              });
            } else {
              throw userError; // Re-throw if we can't even get minimal user data
            }
          }
        } catch (error: unknown) {
          // Clear the timeout if there's an error
          clearTimeout(loginTimeout);

          console.error("Login process failed:", error);

          // Extract a more detailed error message
          let errorMessage = "Login failed";
          if (error instanceof Error) {
            errorMessage = error.message;

            // Check for network errors
            if (
              error.message.includes("Network Error") ||
              error.message.includes("Failed to fetch")
            ) {
              errorMessage =
                "Cannot connect to the server. Is the backend API running?";
            }
          }

          set({
            error: errorMessage,
            isLoading: false,
            user: null,
            isAuthenticated: false,
            loginVerificationRequired: false,
            pendingUserId: null,
          });
          throw error;
        }
      },

      verify2FALogin: async (code: string) => {
        const { pendingUserId } = get();

        if (!pendingUserId) {
          set({
            error: "No pending login to verify",
            isLoading: false,
          });
          throw new Error("No pending login to verify");
        }

        set({ isLoading: true, error: null });

        try {
          // Verify the 2FA code
          await api.verify2FALogin(pendingUserId, code);

          // If verification is successful, fetch user data
          const { data: userData } = await api.getCurrentUser();

          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
            loginVerificationRequired: false,
            pendingUserId: null,
          });
        } catch (error: unknown) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await api.loginWithGoogle();
          // Redirect to Google's auth page
          if (data?.redirect_url && typeof window !== "undefined") {
            window.location.href = data.redirect_url;
          }
        } catch (error: unknown) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          // Re-throw the error so the component can catch it
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await api.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          // Re-throw the error so the component can catch it
          throw error;
        }
      },

      fetchUser: async () => {
        const currentState = get();

        // Don't fetch if already loading
        if (currentState.isLoading) {
          console.log("Skipping fetchUser - already loading", {
            isLoading: currentState.isLoading,
          });
          return;
        }

        // Skip fetching if we already have a valid user with ID
        if (currentState.isAuthenticated && currentState.user?.id) {
          const lastFetchTime = parseInt(
            localStorage.getItem("auth_last_fetch_time") || "0"
          );
          const currentTime = Date.now();
          const MAX_CACHE_AGE = 5 * 60 * 1000; // 5 minutes cache validity

          // If we have a fairly recent user fetch, don't fetch again
          if (lastFetchTime && currentTime - lastFetchTime < MAX_CACHE_AGE) {
            console.log("Using cached user data - skipping fetch");
            return;
          }
        }

        // Check for stored last failure time to prevent excessive retries
        const lastFailureTime = localStorage.getItem("auth_last_failure_time");
        const currentTime = Date.now();
        const MIN_RETRY_INTERVAL = 10000; // 10 seconds between retry attempts

        if (
          lastFailureTime &&
          currentTime - parseInt(lastFailureTime) < MIN_RETRY_INTERVAL
        ) {
          console.log("Skipping fetchUser - too soon after last failure");
          throw new Error("Too many auth attempts in short time");
        }

        try {
          set({ isLoading: true });
          console.log(
            "Fetching current user, cookies:",
            document.cookie ? document.cookie.substring(0, 40) + "..." : "None"
          );

          try {
            // First attempt: directly get user data
            const { data: userData } = await api.getCurrentUser();
            console.log("User data fetched successfully:", userData?.email);

            // Clear any stored error markers on success
            localStorage.removeItem("auth_last_failure_time");
            localStorage.removeItem("auth_failure_count");

            // Record fetch time for caching
            localStorage.setItem("auth_last_fetch_time", Date.now().toString());

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (initialError) {
            console.error("Initial user fetch failed:", initialError);

            // Increment failure counter
            const failureCount = parseInt(
              localStorage.getItem("auth_failure_count") || "0"
            );
            localStorage.setItem(
              "auth_failure_count",
              (failureCount + 1).toString()
            );
            localStorage.setItem(
              "auth_last_failure_time",
              currentTime.toString()
            );

            // If too many failures, reset auth state to prevent loop
            if (failureCount >= 3) {
              console.error("Too many auth failures, resetting state");
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              throw initialError;
            }

            // Attempt token refresh if we have any auth artifacts
            if (
              document.cookie.includes("access_token") ||
              document.cookie.includes("refresh_token") ||
              document.cookie.includes("token_debug") ||
              localStorage.getItem("access_token")
            ) {
              try {
                console.log("Attempting to refresh token");
                await api.refreshToken();
                console.log("Token refreshed, trying to fetch user again");

                // Try again after refresh
                const { data: userData } = await api.getCurrentUser();
                console.log(
                  "User data fetched successfully after token refresh:",
                  userData?.email
                );

                // Clear failure markers on success
                localStorage.removeItem("auth_last_failure_time");
                localStorage.removeItem("auth_failure_count");

                // Record fetch time for caching
                localStorage.setItem(
                  "auth_last_fetch_time",
                  Date.now().toString()
                );

                set({
                  user: userData,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                // Record this failure too
                localStorage.setItem(
                  "auth_last_failure_time",
                  Date.now().toString()
                );
              }
            } else {
              console.log(
                "No authentication tokens found, not attempting refresh"
              );
            }

            // If all attempts failed
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            throw initialError;
          }
        } catch (error) {
          console.error("All fetchUser attempts failed:", error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => {
        set((state) => {
          if (state.error === null) return state;
          return { ...state, error: null };
        });
      },
    }),
    {
      name: "auth-storage",
      // Only persist non-sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);

// Helper hook to check if user has a specific role
export const useHasRole = (role: string) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return user.roles.some((r) => r.name === role);
};

// Check if user is admin
export const useIsAdmin = () => useHasRole("admin");
