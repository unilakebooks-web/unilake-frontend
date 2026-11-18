import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown the moment a customer opens checkout, while the server loads their
 * session. Without it the page stayed as it was until the whole route was ready.
 */
export default function CheckoutLoading() {
  return (
    <main className="min-h-screen bg-[#F8E7D2] pt-24">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 py-10 flex flex-col lg:flex-row gap-8">
        <Skeleton className="w-full lg:w-[55%] h-[420px] rounded-[24px] bg-gray-200/50" />
        <Skeleton className="w-full lg:w-[45%] h-[420px] rounded-[24px] bg-gray-200/50" />
      </div>
    </main>
  );
}
