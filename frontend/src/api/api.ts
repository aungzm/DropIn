import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper functions to handle token storage
const getAccessToken = () => localStorage.getItem("accessToken");
const setAccessToken = (token: string) => localStorage.setItem("accessToken", token);
const getRefreshToken = () => localStorage.getItem("refreshToken");
const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// Helper function to check if a JWT token is valid
const isTokenValid = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    return payload.exp * 1000 > Date.now(); // Compare expiry time with current time
  } catch {
    return false; // Invalid token
  }
};

// Queue to handle multiple failed requests while refreshing the token
let isRefreshing = false;
let failedQueue: any[] = [];

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

// External navigation function (to be provided by React components)
let navigate: (path: string) => void = () => {
  console.error("Navigation function is not set. Ensure it is provided via setNavigateFunction.");
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

// Response interceptor to handle invalid access tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is due to an invalid access token
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === "Unauthorized: Invalid token" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // Prevent infinite retry loops
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;

          try {
            // Refresh the access token using the refresh token
            const response = await axios.post(
              "http://localhost:5000/api/auth/access-token",
              { refreshToken },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            const newAccessToken = response.data.accessToken;

            // Save the new access token
            setAccessToken(newAccessToken);
            processQueue(null, newAccessToken);

            isRefreshing = false;

            // Retry the original request with the new access token
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return api.request(originalRequest);
          } catch (refreshError) {
            // If refreshing fails, clear tokens and redirect to login
            processQueue(refreshError, null);
            removeTokens();
            navigate('/login');
            isRefreshing = false;
            return Promise.reject(refreshError);
          }
        }

        // Queue failed requests while the token is being refreshed
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
        // No refresh token available, redirect to login
        removeTokens();
        navigate('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
