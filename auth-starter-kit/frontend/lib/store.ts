import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "./api";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  roles: Array<{ name: string }>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

// Helper function to extract error message from various error formats
const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;

  const anyError = error as any;

  if (anyError.response) {
    // Handle validation errors (422)
    if (anyError.response.status === 422 && anyError.response.data?.detail) {
      if (Array.isArray(anyError.response.data.detail)) {
        // Get a readable message from validation errors
        return anyError.response.data.detail
          .map((err: any) => `${err.msg} for ${err.loc[1]}`)
          .join(", ");
      }
    }

    if (typeof anyError.response.data === "string") {
      return anyError.response.data;
    } else if (anyError.response.data?.detail) {
      if (typeof anyError.response.data.detail === "string") {
        return anyError.response.data.detail;
      } else {
        return JSON.stringify(anyError.response.data.detail);
      }
    } else if (anyError.response.data?.message) {
      return anyError.response.data.message;
    }
  }

  if (anyError.message) return anyError.message;

  return "An unknown error occurred";
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          // First step: Login to get the token
          const loginResponse = await api.login(email, password);
          console.log("Login successful, response:", {
            status: loginResponse.status,
            data: loginResponse.data ? "Present" : "Missing",
            cookies: document.cookie
              ? document.cookie.substring(0, 40) + "..."
              : "None",
          });

          // Add a small delay to ensure cookies are properly set
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Check cookie state after login
          console.log(
            "Cookies after login delay:",
            document.cookie ? document.cookie.substring(0, 40) + "..." : "None"
          );

          try {
            // Second step: Get user data with the token
            const { data: userData } = await api.getCurrentUser();
            console.log("User data fetched successfully:", userData?.email);

            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (userError) {
            console.error("Error fetching user data:", userError);

            // If we can't get user data, still consider login successful but with limited data
            if (loginResponse?.data?.user_id) {
              const partialUserData: User = {
                id: loginResponse.data.user_id,
                email: loginResponse.data.email || email,
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
              });
            } else {
              throw userError; // Re-throw if we can't even get minimal user data
            }
          }
        } catch (loginError) {
          console.error("Login process failed:", loginError);
          set({
            error: extractErrorMessage(loginError),
            isLoading: false,
            user: null,
            isAuthenticated: false,
          });
          // Re-throw the error so the component can catch it
          throw loginError;
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
        } catch (error: any) {
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
        } catch (error: any) {
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

        // Don't fetch if already loading or already authenticated with user data
        if (
          currentState.isLoading ||
          (currentState.isAuthenticated && currentState.user)
        ) {
          console.log("Skipping fetchUser - already loading or authenticated", {
            isLoading: currentState.isLoading,
            isAuthenticated: currentState.isAuthenticated,
            hasUser: !!currentState.user,
          });
          return;
        }

        try {
          set({ isLoading: true });
          console.log(
            "Fetching current user, cookies:",
            document.cookie ? document.cookie.substring(0, 40) + "..." : "None"
          );

          const { data: userData } = await api.getCurrentUser();
          console.log("User data fetched successfully:", userData?.email);

          set({
            user: userData,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to fetch user:", error);

          // Only try to refresh if there's some authentication (cookies or token)
          if (
            document.cookie.includes("access_token") ||
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

              set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            } catch (refreshError) {
              console.error("Token refresh failed:", refreshError);
            }
          } else {
            console.log(
              "No authentication tokens found, not attempting refresh"
            );
          }

          // If we get here, both attempts failed
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
