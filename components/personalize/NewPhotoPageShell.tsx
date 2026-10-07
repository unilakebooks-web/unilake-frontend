"use client";

import HomeHeaderSection from "@/components/home/HomeHeaderSection";
import Footer from "@/components/home/Footer";
import NewPhotoForm from "./NewPhotoForm";
import { SessionSnapshot } from "@/app/types/session";

interface NewPhotoPageShellProps {
  previousSession: SessionSnapshot;
}

export default function NewPhotoPageShell({ previousSession }: NewPhotoPageShellProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeaderSection />
      
      <main className="flex-1 bg-[#F8E7D2] pt-[86px] flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <NewPhotoForm previousSession={previousSession} />
        </div>
        
        <div className="flow-root bg-[#F8E7D2]">
          <Footer />
        </div>
      </main>
    </div>
  );
}
