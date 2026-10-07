import { createAuthClient } from "better-auth/react";

// Point directly at the backend where better-auth is hosted.
// Using window.location.origin would route through Next.js rewrites (localhost:3000 → backend),
// which fails when the Cloud Run backend is cold-starting (returns 503).
const backendURL = process.env.NEXT_PUBLIC_AUTH_URL


export const authClient = createAuthClient({
    baseURL: backendURL,
    fetchOptions: {
        credentials: "include",
    },
});
