"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Heart, Search, User, ShoppingBag, ChevronDown, Settings, LogOut, Loader2, Menu, X } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { UserRole } from "@/app/types/auth";
import { useCountryStore } from "@/stores/useCountryStore";
import { useCountryHydration } from "@/hooks/useCountryHydration";

interface HeaderProps {
  topOffset?: number;
  hideBulbForced?: boolean;
  flatBackground?: boolean;
  /**
   * When true, scrolling back up does NOT bring the header back — it only
   * reappears once the page is back near the top. Used on the comic preview
   * page, where the header sliding in over the pages on every small upward
   * scroll gets in the way of browsing variants.
   */
  showOnlyAtTop?: boolean;
}

export default function Header({ topOffset = 0, hideBulbForced = false, flatBackground = false, showOnlyAtTop = false }: HeaderProps = {}) {
  // Trigger fetch and store sync
  const { isLoading, isError } = useCountryHydration();
  
  const countries = useCountryStore((state) => state.countries);
  const selectedCountry = useCountryStore((state) => state.selectedCountry);
  const selectCountry = useCountryStore((state) => state.selectCountry);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [hideBulb, setHideBulb] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  {/* Hide bulb and header on scroll */ }
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setHideBulb(currentScrollY > 80);

      if (showOnlyAtTop) {
        // Direction is ignored: visible near the top, hidden everywhere else.
        setShowHeader(currentScrollY <= 80);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showOnlyAtTop]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav
      style={{
        top: topOffset,
        transform: showHeader ? "translateY(0)" : `translateY(calc(-100% - ${topOffset}px))`,
      }}
      className={`
        fixed
        left-0
        w-full
        h-[86px]
        z-50
        overflow-visible
        transition-transform
        duration-300
      `}
    >
      <div className="max-w-[1440px] mx-auto h-full px-5 sm:px-8 lg:px-12 flex lg:grid lg:grid-cols-[1fr_auto_1fr] items-center justify-between">
        {/* Zone 1 — Left: Logo & Mobile Menu Button */}
        <div className="flex items-center justify-start gap-4">
          {/* Mobile Left: Hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="lg:hidden text-white hover:text-[#FFD54A] transition-colors cursor-pointer p-1"
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/home_page/logoImg.png"
              alt="UniLake Logo"
              width={170}
              height={60}
              style={{ width: "auto", height: "auto" }}
              priority
              className="h-10 w-auto lg:h-[56px] xl:h-[60px]"
            />
          </Link>
        </div>

        {/* Zone 2 — Center: Main Navigation */}
        <ul className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 2xl:gap-10 text-white text-[15px] font-medium tracking-wide select-none whitespace-nowrap">
          {[
            { name: "Home", href: "/" },
            { name: "Our Books", href: "/comic" },
            { name: "How it works", href: "/how_it_work" },
            { name: "FAQ", href: "/#faq" },
            { name: "Blogs", href: "/blog" },
            { name: "Contact us", href: "/contact" }
          ].map((item) => (
            <li key={item.name} className={`${isActive(item.href) ? "text-[#FFD54A]" : "hover:text-[#FFD54A]"} cursor-pointer transition-colors duration-200`}>
              <Link href={item.href}>{item.name}</Link>
            </li>
          ))}
          {!loading && user?.role === UserRole.ADMIN && (
            <li className={`${isActive("/admin") ? "text-[#FFD54A]" : "hover:text-[#FFD54A]"} cursor-pointer transition-colors duration-200`}>
              <Link href="/admin">Dashboard</Link>
            </li>
          )}
        </ul>

        {/* Zone 3 — Right: Utility Controls */}
        <div className="flex items-center justify-end gap-4 sm:gap-5 lg:gap-6 text-white">
          {/* Desktop Only Icons */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-5">




            {/* Profile */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    setIsProfileOpen(!isProfileOpen);
                  } else {
                    router.push("/login");
                  }
                }}
                className="hover:text-[#FFD54A] transition-colors duration-200 cursor-pointer p-1"
                title="Profile"
              >
                <User size={20} strokeWidth={2} />
              </button>

              {isProfileOpen && isAuthenticated && user && (
                <div className="absolute right-0 mt-3.5 w-48 bg-[#914A8C] border border-white/20 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                  <div className="px-4 py-3 border-b border-white/10 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold truncate text-white">{user.name}</span>
                    <span className="text-xs text-white/60 truncate">{user.email}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                  >
                    <Settings size={16} />
                    <span className="font-medium flex-1">Dashboard</span>
                  </button>
                  
                  <div className="h-px bg-white/10 my-1 mx-2"></div>
                  
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span className="font-medium flex-1">Logout</span>
                  </button>
                </div>
              )}
            </div>


          </div>

          {/* Language Selector Dropdown (Visible on both mobile & desktop) */}
          <div className="relative" ref={dropdownRef}>
            <button
               onClick={() => !isLoading && !isError && countries.length > 0 && setIsOpen(!isOpen)}
               className={`flex items-center gap-2 border border-white/80 rounded-full px-2.5 sm:px-3 py-1 text-[13px] hover:bg-white/10 transition-all font-medium select-none ${isLoading || isError || countries.length === 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : selectedCountry ? (
                <>
                  <Image src={selectedCountry.flagUrl} alt="" width={20} height={14} className="rounded-[2px]" />
                  <span className="hidden sm:inline-block">{selectedCountry.code}</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </>
              ) : (
                <span className="hidden sm:inline-block">N/A</span>
              )}
            </button>

            {isOpen && countries.length > 0 && (
               <div className="absolute right-0 mt-3.5 w-44 bg-[#914A8C] border border-white/20 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                 {countries.map((country) => (
                   <button
                     key={country.code}
                     onClick={() => {
                       selectCountry(country.code);
                       setIsOpen(false);
                     }}
                     className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-white/15 transition-colors text-white cursor-pointer"
                   >
                     <Image src={country.flagUrl} alt="" width={20} height={14} className="rounded-[2px]" />
                     <span className="font-medium flex-1">{country.name}</span>
                     <span className="text-xs text-white/60 font-semibold">{country.code}</span>
                   </button>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Background shape */}
      {flatBackground ? (
        <div className="absolute inset-0 w-full h-full bg-[#914A8C] pointer-events-none -z-10 shadow-md" />
      ) : (
        <div className="absolute inset-0 w-full h-[138px] pointer-events-none -z-10 drop-shadow-md">
          <svg
            className="w-full h-full"
            viewBox="0 0 1728 205"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0H1728V205L1699.6 175.084C1670.8 144.755 1630.82 127.582 1589 127.582H1511.5H1436H1348.5H1280H1205H1128H1044.5H957H869H775.5H686.5H600H524H441H356.5H295.5H229H156.5C112.973 127.582 70.9127 143.315 38.0718 171.883L0 205V0Z"
              fill="#914A8C"
            />
          </svg>
        </div>
      )}

      {/* Hanging Bulb */}
      {/* <Image
        src="/assets/home_page/bulbImg.png"
        alt="Bulb"
        width={110}
        height={140}
        className={`
          absolute
          top-full
          left-8
          sm:left-10
          md:left-12
          lg:left-16
          xl:left-20

          -translate-y-5

          w-14
          sm:w-16
          md:w-20
          lg:w-24
          xl:w-28

          h-auto
          z-50
          pointer-events-none
          select-none

          transition-all
          duration-500

          invisible
          lg:visible

          ${(hideBulb || hideBulbForced)
            ? "opacity-0 -translate-y-16"
            : "opacity-100 -translate-y-5"
          }
        `}
      /> */}
    </nav>

    {/* Mobile Sidebar Overlay */}
    {isMobileMenuOpen && (
      <div 
        className="fixed inset-0 bg-black/60 z-[100] lg:hidden animate-in fade-in duration-300"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )}

    {/* Mobile Sidebar Menu */}
    <div 
      className={`fixed top-0 left-0 h-[100vh] w-[85%] max-w-[320px] bg-[#914A8C] z-[101] shadow-2xl transition-transform duration-300 flex flex-col lg:hidden ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/10 flex items-center justify-center shrink-0">
            <User size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate max-w-[150px]">Hi, {user?.name?.split(" ")[0] || "Guest"}</span>
            <span className="text-[11px] text-white/60">{isAuthenticated ? "Welcome back!" : "Please login"}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="text-white p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">


        {/* Main Links */}
        <div className="flex flex-col gap-1.5">
          {[
            { name: "Home", href: "/" },
            { name: "Our Books", href: "/comic" },
            { name: "How its works", href: "/how_it_work" },
            { name: "Faq", href: "/#faq" },
            { name: "Blogs", href: "/blog" },
            { name: "Team", href: "/team" }
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2.5 px-4 font-medium rounded-xl transition-colors text-sm ${isActive(item.href) ? "text-[#FFD54A] bg-white/10" : "text-white hover:bg-white/10"}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="h-px bg-white/10 my-1 mx-2" />

        {/* User actions */}
        <div className="flex flex-col gap-1.5 pb-8">


          {isAuthenticated ? (
            <>
              <Link 
                href="/dashboard" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3.5 py-3 px-4 text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <Settings size={18} strokeWidth={2.5} />
                <span className="font-medium text-sm">Dashboard</span>
              </Link>
              {user?.role === UserRole.ADMIN && (
                <Link 
                  href="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 py-3 px-4 text-[#FFD54A] hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Settings size={18} strokeWidth={2.5} />
                  <span className="font-medium text-sm">Admin Dashboard</span>
                </Link>
              )}
              <button 
                onClick={() => { logout(); setIsMobileMenuOpen(false); }} 
                className="flex items-center gap-3.5 py-3 px-4 mt-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-left w-full cursor-pointer"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span className="font-medium text-sm">Logout</span>
              </button>
            </>
          ) : (
            <button 
              onClick={() => { router.push("/login"); setIsMobileMenuOpen(false); }} 
              className="flex items-center justify-center gap-2.5 py-3.5 px-4 mt-2 text-[#914A8C] bg-white hover:bg-white/90 rounded-xl transition-all shadow-md font-bold text-left w-full cursor-pointer"
            >
              <User size={18} strokeWidth={2.5} />
              <span className="text-sm">Login / Signup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  </>
);
}
