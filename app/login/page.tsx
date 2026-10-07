"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/app/hooks/useAuth";
import Header from "@/components/home/Header";

type OAuthProvider = "Google" | "Facebook";

interface LoginState {
    redirectingTo: OAuthProvider | null;
    error: string | null;
}

// ── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// ── Google Icon ────────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
    );
}

// ── Facebook Icon ──────────────────────────────────────────────────────────────
function FacebookIcon() {
    return (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

// ── SocialButton ───────────────────────────────────────────────────────────────
interface SocialButtonProps {
    provider: OAuthProvider;
    isRedirecting: boolean;
    redirectingTo: OAuthProvider | null;
    onClick: (provider: OAuthProvider) => void;
}

function SocialButton({ provider, isRedirecting, redirectingTo, onClick }: SocialButtonProps) {
    const isThisLoading = redirectingTo === provider;
    const isDisabled = isRedirecting;

    const baseClass =
        "w-full h-14 rounded-2xl border-2 border-[#914A8C]/30 flex items-center justify-center gap-3 font-bold text-base transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#914A8C]/30 focus-visible:ring-offset-2";

    const googleClass = `${baseClass} bg-white text-gray-800 shadow-md
        ${!isDisabled
            ? "cursor-pointer hover:shadow-lg hover:border-[#914A8C]/50 active:translate-y-[1px] active:shadow-md"
            : "cursor-not-allowed opacity-70"
        }`;

    const facebookClass = `${baseClass} bg-[#1877F2] text-white shadow-md
        ${!isDisabled
            ? "cursor-pointer hover:shadow-lg hover:border-[#914A8C]/50 active:translate-y-[1px] active:shadow-md"
            : "cursor-not-allowed opacity-70"
        }`;

    return (
        <button
            id={`btn-login-${provider.toLowerCase()}`}
            type="button"
            onClick={() => onClick(provider)}
            disabled={isDisabled}
            aria-label={`Continue with ${provider}`}
            aria-busy={isThisLoading}
            aria-disabled={isDisabled}
            className={provider === "Google" ? googleClass : facebookClass}
        >
            {isThisLoading ? (
                <Spinner />
            ) : provider === "Google" ? (
                <GoogleIcon />
            ) : (
                <FacebookIcon />
            )}
            <span>
                {isThisLoading ? `Redirecting to ${provider}…` : `Continue with ${provider}`}
            </span>
        </button>
    );
}

// ── LoginPage ─────────────────────────────────────────────────────────────────
export default function LoginPage() {
    const { user, isAuthenticated, loading, login } = useAuth();
    const router = useRouter();
    const [state, setState] = useState<LoginState>({
        redirectingTo: null,
        error: null,
    });

    const isRedirecting = state.redirectingTo !== null;

    useEffect(() => {
        if (!loading && isAuthenticated && user) {
            router.replace("/");
        }
    }, [loading, isAuthenticated, user, router]);

    async function handleLogin(provider: OAuthProvider): Promise<void> {
        if (isRedirecting) return;

        setState({ redirectingTo: provider, error: null });

        try {
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const callbackURL = `${origin}/login`;
            await login(provider, callbackURL);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unable to initiate login. Please try again.";
            setState({
                redirectingTo: null,
                error: errorMessage,
            });
        }
    }

    if (loading || isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#F8E7D2] flex items-center justify-center font-poppins">
                <div className="flex flex-col items-center gap-4">
                    <svg
                        className="animate-spin h-10 w-10 text-[#914A8C]"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-label="Loading"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-[#914A8C] font-bold text-lg">Loading session…</p>
                </div>
            </div>
        );
    }

    return (
        <main
            className="min-h-screen flex flex-col bg-[#F8E7D2] relative overflow-hidden font-poppins select-none pt-[86px]"
            role="main"
        >
            <Header hideBulbForced />

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center p-6 z-10">
                <div
                    className="bg-white rounded-3xl p-8 md:p-12 w-[90%] max-w-[460px] border-2 border-[#914A8C]/20 shadow-xl"
                    role="region"
                    aria-label="Login options"
                >
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <Image
                            src="/assets/login_page/UnilakeLogo.png"
                            alt="UniLake"
                            width={200}
                            height={60}
                            style={{ width: "200px", height: "auto" }}
                            priority
                        />
                    </div>

                    {/* Heading */}
                    <div className="text-center space-y-2 mb-8">
                        <h1 className="text-2xl font-black text-[#914A8C] tracking-wide uppercase">
                            Welcome to UniLake
                        </h1>
                        <p className="text-gray-600 text-sm font-semibold">
                            Choose a login method to start creating personalized storybooks!
                        </p>
                    </div>

                    {/* Error Message */}
                    {state.error && (
                        <div
                            role="alert"
                            className="mb-6 px-4 py-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold text-center"
                        >
                            {state.error}
                        </div>
                    )}

                    {/* Auth Buttons */}
                    <div className="flex flex-col gap-4" role="group" aria-label="Sign-in options">
                        <SocialButton
                            provider="Google"
                            isRedirecting={isRedirecting}
                            redirectingTo={state.redirectingTo}
                            onClick={handleLogin}
                        />
                        <SocialButton
                            provider="Facebook"
                            isRedirecting={isRedirecting}
                            redirectingTo={state.redirectingTo}
                            onClick={handleLogin}
                        />
                    </div>

                    {/* Redirect notice */}
                    {isRedirecting && (
                        <p
                            className="mt-5 text-center text-xs text-gray-400 font-medium animate-pulse"
                            aria-live="polite"
                        >
                            You will be redirected to complete sign-in…
                        </p>
                    )}

                    {/* Terms */}
                    <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
                        By signing in you agree to our{" "}
                        <a href="/terms" className="underline hover:text-[#914A8C] transition-colors">
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" className="underline hover:text-[#914A8C] transition-colors">
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>
            </div>
        </main>
    );
}
