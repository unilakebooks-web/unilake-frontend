import axios, { AxiosError } from "axios";
import type { ApiResponse } from "@/app/types/api";

const baseURL = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8080";

// Calls made while a page is built on the server must not hang it for ever (before this a stuck backend call kept
// the page waiting until the hosting platform cut it off). Longer than the slowest backend wake-up seen in a week of
// logs (14 s), so a slow but real answer is still used. The browser keeps no limit: uploads and the admin restart
// are slow on purpose. Nor does `next build`: pages that swallow a failed fetch would otherwise be built empty and
// stay that way until the next deploy, so the build keeps waiting for the backend as it always did.
const SERVER_REQUEST_TIMEOUT_MS = 20000;
const isServerRequestWithLimit = typeof window === "undefined" && process.env.NEXT_PHASE !== "phase-production-build";

/** The same limit in milliseconds for a server-side call that does not go through `api` (0 = none), such as a bare fetch. */
export const SERVER_REQUEST_TIMEOUT = isServerRequestWithLimit ? SERVER_REQUEST_TIMEOUT_MS : 0;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: SERVER_REQUEST_TIMEOUT,
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
      // A request that ran into its time limit (only the server-side client has one) has this code, and its own text
      // ("timeout of 20000ms exceeded") reaches customers. A request the browser aborted has it too, but no limit.
      message:
        error.code === "ECONNABORTED" && error.config?.timeout
          ? "The server took too long to answer."
          : error.message || "Network request failed",
    });
  }
);

export default api;
