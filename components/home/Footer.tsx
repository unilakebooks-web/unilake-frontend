"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { hankenGrotesk } from "@/app/fonts";
import { usePublicSiteSetting } from "@/hooks/useSiteSettings";

// Used until an admin saves settings, and whenever a field is left blank.
// The footer is on every page, so it must render something sensible even if
// the settings request fails outright.
const FALLBACK_DESCRIPTION =
  "Creating magical personalized stories that spark imagination and create lasting memories for children and families.";
const FALLBACK_INSTAGRAM = "https://instagram.com";
const FALLBACK_EMAIL = "contact@unilake.com";

export default function Footer() {
  // Deliberately no loading state: the fallbacks render immediately and are
  // swapped once the query resolves. A skeleton in the footer would be more
  // distracting than a brief default.
  const { data: setting } = usePublicSiteSetting();

  const brandDescription = setting?.brandDescription || FALLBACK_DESCRIPTION;
  const instagramUrl = setting?.instagramUrl || FALLBACK_INSTAGRAM;
  const email = setting?.email || FALLBACK_EMAIL;

  return (
    <footer className="relative w-full overflow-visible mt-20 lg:mt-32">
      {/* ===== Symmetrical/Organic Double Wave Cloud Border ===== */}
      <div className="w-full overflow-visible leading-[0] relative z-20">
        <svg
          viewBox="0 0 1728 220"
          className="w-full h-[80px] sm:h-[120px] md:h-[160px] lg:h-[220px] block"
          preserveAspectRatio="none"
        >
          <g filter="url(#filter0_d_1788_3069)">
            <path d="M-2 132.757L-0.233254 926L1730 925.34V70.0114L1690.54 101.054L1683.31 96.8122C1648.59 76.4607 1604.14 96.0477 1595.73 135.399C1578.03 117.287 1548.38 119.089 1533 139.212L1530.36 142.665L1501.18 131.41C1462.97 116.671 1419.64 126.718 1391.82 156.768L1390.2 158.516L1384.97 157.94C1365.24 155.764 1345.43 161.164 1329.54 173.047L1328.38 172.323C1319.61 166.811 1309.2 164.5 1298.91 165.782C1298.91 139.796 1274.26 120.889 1249.16 127.633L1242.38 129.455L1239.18 123.84C1209.98 72.6157 1135.08 75.883 1110.46 129.455L1107.87 126.859C1088.2 107.163 1054.5 117.87 1049.8 145.307L1049.05 144.298C1026.2 113.732 979.581 116.343 960.288 149.27L958.312 146.043C935.297 108.447 880.094 110.252 859.583 149.27L849.701 144.59C827.355 134.009 800.906 146.446 794.802 170.405C787.713 142.578 754.027 131.102 731.789 149.27C704.855 120.861 659.363 121.021 632.262 149.27L630.935 147.92C606.985 123.567 568.097 122.414 542.747 145.307L542.284 140.478C539.046 106.687 492.421 100.38 480.322 132.097L472.308 118.976C442.611 70.3545 370.039 76.9417 349.582 130.116C328.666 115.379 299.576 128.085 296.172 153.444L295.402 159.177L294.484 156.343C286.5 131.719 250.999 133.791 245.933 159.177L245.624 158.519C237.041 140.28 210.959 140.682 202.943 159.177L195.278 141.462C171.023 85.4013 92.7353 82.181 63.9585 136.06L58.0465 132.799C39.3615 122.493 16.6993 122.477 -2 132.757Z" fill="#FDC700"/>
          </g>
          <path d="M-2 171.611L-0.233254 958L1730 957.345V109.407L1690.54 140.181L1682.88 135.727C1648.29 115.625 1604.16 135.123 1595.73 174.23C1577.97 156.221 1548.41 158.02 1532.97 178.048L1530.36 181.432L1500.76 170.113C1462.75 155.58 1419.73 165.523 1391.96 195.259L1390.2 197.147L1384.88 196.565C1365.2 194.414 1345.44 199.766 1329.54 211.552L1328.42 210.853C1319.62 205.374 1309.2 203.079 1298.91 204.349C1298.91 178.566 1274.48 159.786 1249.56 166.423L1242.38 168.337L1239.14 162.695C1209.82 111.707 1135.2 114.978 1110.46 168.337L1107.68 165.573C1088.01 146.052 1054.52 156.748 1049.8 184.051L1049.01 182.994C1026.09 152.603 979.655 155.212 960.288 187.98L958.287 184.739C935.182 147.324 880.183 149.13 859.583 187.98L849.419 183.209C827.175 172.766 800.918 185.133 794.802 208.933C787.657 181.127 754.099 169.912 731.789 187.98C704.783 159.741 659.434 159.902 632.262 187.98L630.957 186.665C606.937 162.451 568.158 161.302 542.747 184.051L542.297 179.404C539.035 145.654 492.499 139.31 480.322 170.956L472.217 157.801C442.416 109.431 370.137 116.026 349.582 168.991C328.607 154.341 299.562 167.078 296.129 192.432L295.402 197.802L294.469 194.947C286.437 170.391 251.031 172.473 245.933 197.802L245.619 197.14C236.994 178.97 211 179.374 202.943 197.802L195.312 180.317C170.925 124.438 92.876 121.21 63.9585 174.884L58.0468 171.652C39.3416 161.424 16.7193 161.408 -2 171.611Z" fill="#914B8C"/>
          <defs>
            <filter id="filter0_d_1788_3069" x="-45.6" y="30.4117" width="1819.2" height="943.188" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
              <feOffset dy="4"/>
              <feGaussianBlur stdDeviation="21.8"/>
              <feComposite in2="hardAlpha" operator="out"/>
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
              <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1788_3069"/>
              <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1788_3069" result="shape"/>
            </filter>
          </defs>
        </svg>

        {/* Sun Overlay - Top-Right */}
        <div
          className="
            absolute
            right-12
            sm:right-20
            md:right-28
            lg:right-36
            xl:right-40

            bottom-[-10px]
            sm:bottom-[-15px]
            md:bottom-[-25px]
            lg:bottom-[-35px]
            xl:bottom-[-45px]

            w-[50px]
            sm:w-[70px]
            md:w-[85px]
            lg:w-[100px]
            xl:w-[110px]

            z-20
            pointer-events-none
            select-none
          "
        >
          <Image
            src="/assets/home_page/sun-logo-8FjyKkdiCt.png"
            alt="Sun"
            width={110}
            height={110}
            priority
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* ===== Solid Purple Footer Body ===== */}
      <div className="bg-[#914B8C] text-white pt-10 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">

            {/* Left Column: Brand & Logo */}
            <div className="md:col-span-6 flex flex-col items-start">
              {/* Logo Image */}
              <div className="mb-6">
                <Image
                  src="/Unialke Logo with Emblem 2 2.svg"
                  alt="UniLake Logo"
                  width={220}
                  height={80}
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
                  priority
                />
              </div>

              {/* Description */}
              <p className={`${hankenGrotesk.className} text-white/90 text-base sm:text-lg leading-relaxed max-w-[320px] mb-6`}>
                {brandDescription}
              </p>

              {/* Social Buttons */}
              <div className="flex items-center gap-4">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-white
                    text-[#914B8C]
                    flex
                    items-center
                    justify-center
                    shadow-md
                    transition-all
                    duration-250
                    hover:scale-110
                    hover:bg-[#FFCB05]
                    hover:text-black
                  "
                  aria-label="Instagram"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>

                <Link
                  href="/contact"
                  className="
                    w-10
                    h-10
                    rounded-full
                    bg-white
                    text-[#914B8C]
                    flex
                    items-center
                    justify-center
                    shadow-md
                    transition-all
                    duration-250
                    hover:scale-110
                    hover:bg-[#FFCB05]
                    hover:text-black
                  "
                  aria-label="Contact Us"
                >
                  <Mail className="w-5 h-5 fill-none stroke-current stroke-[2]" />
                </Link>
              </div>
            </div>

            {/* Middle Column: Explore */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div className="flex flex-col items-center text-center">
                <h4 className="text-xl font-medium uppercase tracking-wide mb-6">
                  EXPLORE
                </h4>
                <ul className={`${hankenGrotesk.className} flex flex-col gap-3 text-[15px] uppercase text-white/90`}>
                  <li>
                    <Link href="/" className="hover:text-white transition-colors duration-200">
                      HOME
                    </Link>
                  </li>
                  <li>
                    <Link href="/comic" className="hover:text-white transition-colors duration-200">
                      BOOKS
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-white transition-colors duration-200">
                      BLOG
                    </Link>
                  </li>
                  <li>
                    <Link href="/team" className="hover:text-white transition-colors duration-200">
                      TEAM
                    </Link>
                  </li>
                  {/* <li>
                    <Link href="/faq" className="hover:text-white transition-colors duration-200">
                      FAQ
                    </Link>
                  </li> */}
                  <li>
                    <Link href="/how_it_work" className="hover:text-white transition-colors duration-200">
                      HOW IT WORKS
                    </Link>
                  </li>
                  <li>
                    <Link href="/#faq" className="hover:text-white transition-colors duration-200">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Legal & Support */}
            <div className="md:col-span-3 flex flex-col items-center">
              <div className="flex flex-col items-center text-center">
                <h4 className="text-xl font-medium uppercase tracking-wide mb-6">
                  LEGAL &amp; SUPPORT
                </h4>
                <ul className={`${hankenGrotesk.className} flex flex-col gap-3 text-[15px] uppercase text-white/90`}>
                  <li>
                    <Link href="/privacy" className="hover:text-white transition-colors duration-200">
                      PRIVACY POLICY
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-white transition-colors duration-200">
                      TERMS AND CONDITION
                    </Link>
                  </li>
                  <li>
                    <Link href="/refund" className="hover:text-white transition-colors duration-200">
                      REFUND POLICY
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors duration-200">
                      CONTACT US
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
