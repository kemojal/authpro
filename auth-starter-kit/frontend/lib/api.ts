import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

console.log("API URL:", API_URL);

// Interface for profile data
interface ProfileUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This allows cookies to be sent with requests
});

// Check for token in cookies and add it to requests
const getTokenFromCookie = (): string | null => {
  // Browser-only code
  if (typeof document === "undefined") return null;

  let token: string | null = null;

  // First check cookies (preferred method)
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");

    if (name === "access_token" || name === "token_debug") {
      try {
        const decodedValue = decodeURIComponent(value);
        console.log(
          `Found token in cookie: ${name}=${decodedValue.substring(0, 15)}...`
        );
        token = decodedValue.startsWith("Bearer ")
          ? decodedValue
          : `Bearer ${decodedValue}`;
        break; // Stop once we find a valid token
      } catch (error) {
        console.log("Error decoding cookie value:", error);
      }
    }
  }

  // Fallback to localStorage if no cookie found
  if (!token) {
    const localToken = localStorage.getItem("access_token");
    if (localToken) {
      console.log(
        "Found token in localStorage:",
        localToken.substring(0, 15) + "..."
      );
      token = localToken.startsWith("Bearer ")
        ? localToken
        : `Bearer ${localToken}`;
    }
  }

  if (!token) {
    console.log("No token found in cookies or localStorage");
  }

  return token;
};

// Request interceptor for adding the access token and logging
apiClient.interceptors.request.use(
  (config) => {
    // Try to get token from cookies if we're in a browser
    const token = getTokenFromCookie();

    // If token exists and Authorization header is not already set, add it
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
      console.log(
        "Added token to Authorization header:",
        config.headers.Authorization.substring(0, 20) + "..."
      );
    } else {
      console.log("No token added to request headers");
    }

    console.log(`Request to ${config.url}`, {
      method: config.method,
      withCredentials: config.withCredentials,
      headers: Object.keys(config.headers),
    });
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, {
      status: response.status,
      cookies: document.cookie
        ? document.cookie.substring(0, 40) + "..."
        : "None",
    });

    // If this is the login response, store the token in localStorage as fallback
    if (
      response.config.url === "/token" ||
      response.config.url?.includes("/login/google")
    ) {
      console.log("Login response received, checking for token in response");
      if (response.data?.access_token) {
        console.log("Saving token to localStorage from response data");
        localStorage.setItem(
          "access_token",
          `Bearer ${response.data.access_token}`
        );
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error(`Error from ${originalRequest?.url}:`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      cookies: document.cookie
        ? document.cookie.substring(0, 40) + "..."
        : "None",
    });

    // If the error is 401 Unauthorized and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh token for login-related endpoints
      const isAuthEndpoint =
        originalRequest.url?.includes("/token") ||
        originalRequest.url?.includes("/login/google");

      if (!isAuthEndpoint) {
        originalRequest._retry = true;
        console.log("Attempting to refresh token...");

        try {
          // Call the refresh token endpoint
          await apiClient.post("/refresh-token");
          console.log("Token refreshed successfully");

          // Get the new token and add it to the retried request
          const newToken = getTokenFromCookie();
          if (newToken) {
            originalRequest.headers.Authorization = newToken;
          }

          // Retry the original request
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // If refresh token fails, redirect to login
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Auth
  login: (email: string, password: string) => {
    const formData = new URLSearchParams({
      username: email,
      password: password,
    });

    console.log("Login request data:", {
      url: `${API_URL}/token`,
      formData: formData.toString(),
    });

    return apiClient.post("/token", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      withCredentials: true,
    });
  },

  loginWithGoogle: () =>
    apiClient.get("/login/google", { withCredentials: true }),

  logout: () => apiClient.post("/logout", {}, { withCredentials: true }),

  refreshToken: () =>
    apiClient.post("/refresh-token", {}, { withCredentials: true }),

  // User
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => apiClient.post("/users/", data, { withCredentials: true }),

  getCurrentUser: () => apiClient.get("/users/me", { withCredentials: true }),

  updateProfile: (data: ProfileUpdateData) =>
    apiClient.patch("/users/me", data, { withCredentials: true }),

  // Protected routes example
  getProtectedData: () =>
    apiClient.get("/protected", { withCredentials: true }),

  getAdminData: () => apiClient.get("/admin", { withCredentials: true }),
};

export default api;
