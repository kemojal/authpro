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
  timeout: 8000, // Add a global 8-second timeout to prevent hanging requests
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
        // Safely decode the cookie value
        const decodedValue = decodeURIComponent(value);
        console.log(
          `Found token in cookie: ${name}=${decodedValue.substring(0, 15)}...`
        );

        // Remove quotes if the value is wrapped in them
        let processedValue = decodedValue;
        if (processedValue.startsWith('"') && processedValue.endsWith('"')) {
          processedValue = processedValue.slice(1, -1);
        }

        // Ensure the Bearer prefix is properly applied
        token = processedValue.startsWith("Bearer ")
          ? processedValue
          : `Bearer ${processedValue}`;

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

      // Process localStorage token the same way
      let processedValue = localToken;
      if (processedValue.startsWith('"') && processedValue.endsWith('"')) {
        processedValue = processedValue.slice(1, -1);
      }

      token = processedValue.startsWith("Bearer ")
        ? processedValue
        : `Bearer ${processedValue}`;
    }
  }

  if (!token) {
    console.log("No token found in cookies or localStorage");
  } else {
    console.log("Final token value:", token.substring(0, 15) + "...");
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

// Client-side token refresh function
const performTokenRefresh = async () => {
  try {
    // Get refresh token from localStorage if available
    const refreshToken = localStorage.getItem("refresh_token");
    const requestBody = refreshToken ? { refresh_token: refreshToken } : {};

    // Ensure we're sending cookies with the request
    const response = await apiClient.post("/refresh-token", requestBody, {
      withCredentials: true, // This ensures cookies are sent with the request
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Token refreshed via function call", response.data);

    // Save new tokens if they're returned
    if (response.data?.access_token) {
      localStorage.setItem(
        "access_token",
        `Bearer ${response.data.access_token}`
      );
    }

    return true;
  } catch (error) {
    console.error("Token refresh function failed:", error);
    throw error;
  }
};

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
        console.log("Saving access token to localStorage from response data");
        localStorage.setItem(
          "access_token",
          `Bearer ${response.data.access_token}`
        );

        // Also save refresh token if available from cookies
        const cookies = document.cookie.split(";");
        const refreshTokenCookie = cookies.find((cookie) =>
          cookie.trim().startsWith("refresh_token=")
        );
        if (refreshTokenCookie) {
          const refreshToken = refreshTokenCookie.split("=")[1];
          if (refreshToken) {
            console.log("Saving refresh token to localStorage from cookies");
            localStorage.setItem("refresh_token", refreshToken);
          }
        }
      }
    }

    return response;
  },
  async (error) => {
    // Add a retry count to prevent infinite loops
    error.config = error.config || {};
    error.config.__retryCount = error.config.__retryCount || 0;

    // Handle 401 Unauthorized errors by refreshing the token
    if (error.response && error.response.status === 401) {
      console.log(`401 error with retry count: ${error.config.__retryCount}`);

      // Prevent infinite loops - only try refresh once
      if (error.config.__retryCount >= 1) {
        console.log("Maximum retry attempts reached, not attempting refresh");
        return Promise.reject(error);
      }

      // Check if we should attempt to refresh the token
      const shouldAttemptRefresh =
        // Only try if this wasn't already a refresh token request
        !error.config.url?.includes("/refresh-token") &&
        // And only if we have some sign of previous authentication
        (document.cookie.includes("refresh_token") ||
          document.cookie.includes("access_token") ||
          localStorage.getItem("access_token"));

      if (shouldAttemptRefresh) {
        try {
          console.log("Attempting to refresh token");
          await performTokenRefresh();

          // Increment retry counter
          error.config.__retryCount += 1;

          // Clone the original request
          const originalRequest = { ...error.config };

          // Make sure Authorization header is cleared so it will be re-added with the new token
          delete originalRequest.headers.Authorization;

          // Try the original request again with the new token
          console.log("Retrying original request after token refresh");
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

// Add function to check if server is running
const checkServerConnection = async (): Promise<boolean> => {
  try {
    // Try to reach the server's health check endpoint or just the root
    // Note: Using a controller with timeout since fetch doesn't support timeout directly
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      mode: "no-cors",
      cache: "no-cache",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 0; // status 0 can happen with no-cors
  } catch (error) {
    console.error("Server connection check failed:", error);
    return false;
  }
};

// Modify the API methods
const api = {
  // Server check
  checkConnection: checkServerConnection,

  // Auth
  login: (email: string, password: string) => {
    // Check server before attempting login
    return new Promise(async (resolve, reject) => {
      try {
        const serverOnline = await checkServerConnection();
        if (!serverOnline) {
          console.error("Server connection check failed before login attempt");
          reject(new Error("Cannot connect to server at " + API_URL));
          return;
        }

        console.log(`Attempting login with credentials - Email: ${email}`);

        // Create form data using username field for email
        const formData = new URLSearchParams();
        formData.append("username", email); // FastAPI OAuth2PasswordRequestForm expects 'username'
        formData.append("password", password);

        // Log the complete request configuration for debugging
        console.log("Login request configuration:", {
          url: `${API_URL}/token`,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          withCredentials: true,
          data: formData.toString(),
        });

        try {
          const response = await apiClient.post("/token", formData, {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          console.log("Login success response:", {
            status: response.status,
            statusText: response.statusText,
            data: response.data ? "Present" : "Missing",
          });

          resolve(response);
        } catch (error: any) {
          // Detailed error logging
          console.error("Login request failed:", {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          });

          if (error.response?.status === 401) {
            reject(new Error("Invalid email or password. Please try again."));
          } else if (error.response?.status === 422) {
            reject(new Error("Invalid form data. Please check your inputs."));
          } else {
            reject(error);
          }
        }
      } catch (error) {
        console.error("Login error in outer catch:", error);
        reject(error);
      }
    });
  },

  // ... keep the rest of the existing API methods
  loginWithGoogle: () => apiClient.get("/login/google"),
  logout: () => apiClient.post("/logout"),
  refreshToken: () => performTokenRefresh(),

  // User
  register: (data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => apiClient.post("/users/", data),

  getCurrentUser: () => apiClient.get("/users/me"),

  updateProfile: (data: ProfileUpdateData) =>
    apiClient.patch("/users/me", data, { withCredentials: true }),

  changePassword: (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => apiClient.post("/users/change-password", data),

  // Email verification
  verifyEmail: (token: string) =>
    apiClient.post("/users/verify-email", { token }),

  resendVerification: () => apiClient.post("/users/resend-verification"),

  // Protected routes example
  getProtectedData: () => apiClient.get("/protected"),

  getAdminData: () => apiClient.get("/admin"),
};

export default api;
