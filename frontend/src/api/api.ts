import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to handle invalid access tokens
interface ErrorResponse {
    response?: {
        status: number;
        data?: {
            error?: string;
        };
    };
    config: any;
}

interface RefreshTokenResponse {
    data: {
        accessToken: string;
    };
}

api.interceptors.response.use(
    (response: any) => response,
    async (error: ErrorResponse) => {
        if (
            error.response?.status === 401 && 
            error.response?.data?.error === "Unauthorized: Invalid token"
        ) {
            // Attempt to refresh the token
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const response: RefreshTokenResponse = await axios.get(`http://localhost:5000/api/auth/access-token?refreshToken=${refreshToken}`, {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });

                    const newAccessToken = response.data.accessToken;

                    // Store the new accessToken and retry the failed request
                    localStorage.setItem("accessToken", newAccessToken);
                    error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
                    return api.request(error.config);
                } catch (refreshError: any) {
                    if (refreshError.response?.data?.error === "Invalid token") {
                        // Refresh token is invalid; redirect to login
                        localStorage.removeItem("accessToken");
                        localStorage.removeItem("refreshToken");
                        window.location.href = "/login"; // Redirect to login page
                    }
                }
            } else {
                // No refreshToken; redirect to login
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
