import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions to handle token storage
const getAccessToken = () => localStorage.getItem("accessToken");
const setAccessToken = (token: string) => localStorage.setItem("accessToken", token);
const getRefreshToken = () => localStorage.getItem("refreshToken");
const setRefreshToken = (token: string) => localStorage.setItem("refreshToken", token);
const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// Helper function to check if a JWT token is valid
const isTokenValid = (token: string) => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Add some buffer time (e.g., 10 seconds) to prevent edge cases
    return payload.exp * 1000 > Date.now() + 10000;
  } catch {
    return false;
  }
};

// Queue to handle multiple failed requests while refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

let navigate: (path: string) => void = () => {
  console.error("Navigation function not set");
};

export const setNavigateFunction = (navFn: (path: string) => void) => {
  navigate = navFn;
};

// Request interceptor to attach the access token
api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken && isTokenValid(accessToken)) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for various 401 error conditions that might need token refresh
    const needsRefresh = error.response?.status === 401 && !originalRequest._retry;

    if (needsRefresh) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            // Match backend endpoint structure: using query parameter
            const response = await axios.get(
              `${api.defaults.baseURL}/auth/access-token?refreshToken=${refreshToken}`
            );
            console.log("Access token refreshed:", response.data.accessToken);
            const newAccessToken = response.data.accessToken;
            setAccessToken(newAccessToken);

            // Process queued requests
            processQueue(null, newAccessToken);
            isRefreshing = false;

            // Retry original request
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api.request(originalRequest);
          } catch (refreshError: any) {
            const errorMessage = refreshError.response?.data?.error;
            
            // Handle specific error messages from your backend
            if (
              errorMessage === "Invalid refresh token" ||
              errorMessage === "Refresh token has expired" ||
              errorMessage === "User not found"
            ) {
              removeTokens();
              navigate('/login');
            }

            processQueue(refreshError, null);
            isRefreshing = false;
            return Promise.reject(refreshError);
          }
        }

        // Queue failed requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(api.request(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      } else {
        // No refresh token available
        removeTokens();
        navigate('/login');
        return Promise.reject(new Error("No refresh token available"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;