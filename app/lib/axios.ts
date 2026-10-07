import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/app/types/api";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    if (response.status === 204 || !response.data) {
      return response;
    }
    const res = response.data as ApiResponse<unknown>;
    if (res && typeof res === "object" && "success" in res) {
      if (res.success) {
        response.data = res.data;
      } else {
        return Promise.reject({
          code: res.error.code || "UNKNOWN_ERROR",
          message: res.error.message || "An error occurred",
        });
      }
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.data && typeof error.response.data === "object" && "success" in error.response.data) {
      const errRes = error.response.data as ApiResponse<unknown>;
      if (!errRes.success && errRes.error) {
        return Promise.reject({
          code: errRes.error.code || "HTTP_ERROR",
          message: errRes.error.message || error.message || "Request failed",
        });
      }
    }
    return Promise.reject({
      code: error.code || "NETWORK_ERROR",
      message: error.message || "Network request failed",
    });
  }
);

export default api;
