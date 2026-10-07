"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
} from "react";
import { authClient } from "@/app/lib/auth-client";
import { authService } from "@/app/lib/auth-service";
import { UserRole } from "@/app/types/auth";
import type { AuthContextType, User } from "@/app/types/auth";

// ── Context ────────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data, isPending, refetch } = authClient.useSession();

    // Clean up Facebook OAuth hash artifact (#_=_)
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash === "#_=_") {
            if (window.history.replaceState) {
                window.history.replaceState(null, "", window.location.href.split("#")[0]);
            } else {
                window.location.hash = "";
            }
        }
    }, []);

    // Safely cast to access the custom role field without using any
    const rawUser = data?.user as {
        id: string;
        email: string;
        name: string;
        image?: string | null;
        role?: string;
    } | undefined;

    const user: User | null = rawUser
        ? {
              id: rawUser.id,
              name: rawUser.name,
              email: rawUser.email,
              image: rawUser.image || undefined,
              role: rawUser.role === "ADMIN" ? UserRole.ADMIN : UserRole.USER,
          }
        : null;

    const login = useCallback(async (provider: "Google" | "Facebook", callbackURL?: string): Promise<void> => {
        if (provider === "Google") {
            await authService.loginWithGoogle(callbackURL);
        } else {
            await authService.loginWithFacebook(callbackURL);
        }
    }, []);

    const loginWithEmail = useCallback(async (email: string, password: string, callbackURL?: string): Promise<void> => {
        await authService.loginWithEmail(email, password, callbackURL);
        await refetch();
    }, [refetch]);

    const logout = useCallback(async (redirectTo?: string | unknown): Promise<void> => {
        await authService.logout(redirectTo);
    }, []);

    const refreshSession = useCallback(async (): Promise<void> => {
        await refetch();
    }, [refetch]);

    const value: AuthContextType = {
        user,
        loading: isPending,
        isAuthenticated: user !== null,
        login,
        loginWithEmail,
        logout,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────────
export function useAuthContext(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used inside <AuthProvider>");
    }
    return context;
}
