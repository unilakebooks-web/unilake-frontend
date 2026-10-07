"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateComicForm } from "@/components/admin/comic/create/CreateComicForm";

export default function NewComicPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto py-2">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push("/admin/comics")}
          className="mb-4 text-[#914A8C] hover:text-[#7a3e75] hover:bg-[#914A8C]/10 rounded-xl px-3 h-9"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Comics
        </Button>
        <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Create New Comic</h1>
        <p className="text-neutral-500 mt-1">
          Set up a new comic shell. You'll add pages and bubbles in the next steps.
        </p>
      </div>

      <CreateComicForm />
    </div>
  );
}
