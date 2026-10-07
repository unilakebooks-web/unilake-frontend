import { authClient } from "./auth-client";
import { UserRole } from "@/app/types/auth";
import type { Session } from "@/app/types/auth";

/** Cloud Run cold-start returns 503 with a specific message. Surface that nicely. */
function friendlyErrorMessage(raw: string | undefined, fallback: string): string {
    if (!raw) return fallback;
    const lower = raw.toLowerCase();
    if (lower.includes("not available yet") || lower.includes("503") || lower.includes("service unavailable")) {
        return "The server is warming up — please wait a few seconds and try again.";
    }
    return raw || fallback;
}

export const authService = {
    async loginWithGoogle(callbackURL?: string): Promise<void> {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await authClient.signIn.social({
            provider: "google",
            callbackURL: callbackURL || `${origin}/`,
        }, {
            onError: (ctx) => {
                throw new Error(friendlyErrorMessage(ctx.error.message, "Failed to login with Google"));
            }
        });
        if (res && 'error' in res && res.error) {
            throw new Error(friendlyErrorMessage(res.error.message, "Failed to login with Google"));
        }
    },

    async loginWithFacebook(callbackURL?: string): Promise<void> {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await authClient.signIn.social({
            provider: "facebook",
            callbackURL: callbackURL || `${origin}/`,
        }, {
            onError: (ctx) => {
                throw new Error(friendlyErrorMessage(ctx.error.message, "Failed to login with Facebook"));
            }
        });
        if (res && 'error' in res && res.error) {
            throw new Error(friendlyErrorMessage(res.error.message, "Failed to login with Facebook"));
        }
    },

    async loginWithEmail(email: string, password: string, callbackURL?: string): Promise<void> {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const res = await authClient.signIn.email({
            email,
            password,
            callbackURL: callbackURL || `${origin}/`,
        }, {
            onError: (ctx) => {
                throw new Error(friendlyErrorMessage(ctx.error.message, "Invalid credentials"));
            }
        });
        if (res && 'error' in res && res.error) {
            throw new Error(friendlyErrorMessage(res.error.message, "Invalid credentials"));
        }
    },

    async logout(redirectTo?: string | unknown): Promise<void> {
        const redirectPath = typeof redirectTo === "string" ? redirectTo : "/login";
        try {
            await authClient.signOut();
        } finally {
            window.location.href = redirectPath;
        }
    },

    async getSession(): Promise<Session | null> {
        try {
            const { data } = await authClient.getSession();
            if (!data?.user) return null;

            const rawUser = data.user as {
                id: string;
                email: string;
                name: string;
                image?: string | null;
                role?: string;
            };

            return {
                user: {
                    id: rawUser.id,
                    name: rawUser.name,
                    email: rawUser.email,
                    image: rawUser.image || undefined,
                    role: rawUser.role === "ADMIN" ? UserRole.ADMIN : UserRole.USER,
                },
                expiresAt: data.session.expiresAt.toString(),
            };
        } catch {
            return null;
        }
    },
};