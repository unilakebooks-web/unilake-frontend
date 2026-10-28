"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import Header from "@/components/home/Header";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: 1,
        },
    },
});

function LoadingScreen() {
    return (
        <div className="min-h-screen bg-[#F8E7D2] flex items-center justify-center">
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
                <p className="text-[#914A8C] font-bold text-lg">Loading your dashboard…</p>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            router.replace("/login");
        } else {
            setIsAuthorized(true);
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthorized) {
        return <LoadingScreen />;
    }

    return (
        <QueryClientProvider client={queryClient}>
            {/* The site header, flat like the admin panel's so it sits cleanly
                above the sidebar. It is fixed and 86px tall: the wrapper below
                is padded by that much, and DashboardSidebar is offset to match.
                Its logo and links are the way back to the storefront. */}
            <Header hideBulbForced={true} flatBackground={true} />
            <SidebarProvider>
            <div className="flex min-h-screen w-full bg-[#F8E7D2] font-poppins selection:bg-[#914A8C] selection:text-white pt-[86px]">
                <DashboardSidebar />
                <div className="flex-1 flex flex-col h-[calc(100vh-86px)] overflow-hidden">
                    <div className="h-14 border-b border-[#914A8C]/20 flex items-center px-4 bg-white/50 backdrop-blur-sm shrink-0">
                        <SidebarTrigger className="text-[#914A8C] hover:bg-[#914A8C]/10 cursor-pointer" />
                    </div>
                    <main className="flex-1 overflow-y-auto p-6 md:p-8">
                        <div className="mx-auto max-w-6xl">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
            </SidebarProvider>
        </QueryClientProvider>
    );
}
