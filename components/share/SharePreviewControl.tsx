"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShareButton, { PILL_CLASSES } from "@/components/share/ShareButton";
import { shareUrl } from "@/components/share/shareUrl";
import { useCreateShare, useShareState, useStopSharing } from "@/hooks/useShare";

interface SharePreviewControlProps {
  sessionId: string;
}

/**
 * "Share my child's book" on the preview page (feature 14): a button that opens a small dialog. The link is made
 * only when the customer presses "Create link", and it is a view-only page that is different from this private
 * page. Hidden when the backend says sharing is not available (a sample, or a book that is gone) or cannot be
 * reached: the button simply does not appear, and nothing else on the page changes.
 */
export default function SharePreviewControl({ sessionId }: SharePreviewControlProps) {
  const [open, setOpen] = useState(false);
  const [showName, setShowName] = useState(false);
  const state = useShareState(sessionId);
  const create = useCreateShare(sessionId);
  const stop = useStopSharing(sessionId);

  if (!state.data?.available) return null;

  const active = state.data.active && !!state.data.token;
  const busy = create.isPending || stop.isPending;
  const fail = () => toast.error("Could not update sharing. Please try again.");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Another tab may have created, changed or stopped the link: always start from the live state.
      void state.refetch().then((result) => setShowName(result.data?.active ? result.data.showName : false));
    }
  };

  const handleCreate = () => create.mutate(showName, { onError: fail });
  const handleToggleName = (value: boolean) => {
    setShowName(value);
    if (!active) return;
    // The link may have been stopped in another tab while this dialog stayed open: changing the name must never
    // bring a stopped link back, so look at the live state first.
    void state.refetch().then((result) => {
      if (!result.data?.active) {
        setShowName(false);
        return;
      }
      create.mutate(value, { onError: () => { setShowName(!value); fail(); } });
    });
  };
  const handleStop = () => stop.mutate(undefined, { onError: fail });

  return (
    <>
      <div className="mt-4 flex justify-center">
        <button type="button" onClick={() => handleOpenChange(true)} className={`${PILL_CLASSES} cursor-pointer`}>
          <Share2 size={16} aria-hidden="true" />
          Share my child&apos;s book
        </button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share your child&apos;s book</DialogTitle>
            <DialogDescription>
              Friends and family can look at the pages, but they cannot change anything or see your order,
              payment or address details. The link is different from your own private link.
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Anyone with the link can see the pages, including your child&apos;s face. A link to a preview stops
            working when the preview expires; after you pay, it shows the whole book until the book&apos;s files
            are deleted.
          </p>

          <label className="flex items-start gap-3 text-sm text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={showName}
              disabled={busy}
              onChange={(e) => handleToggleName(e.target.checked)}
              className="mt-1 size-4 accent-[#3F3C95]"
            />
            <span>
              Show my child&apos;s first name in the page title, on the page and in the link preview. The pictures
              can still show the name and your child&apos;s face.
            </span>
          </label>

          {active ? (
            <div className="flex flex-col gap-3">
              <input
                readOnly
                value={shareUrl(`/share/${state.data.token}`)}
                aria-label="Your sharing link"
                onFocus={(e) => e.currentTarget.select()}
                className="w-full rounded-md border border-[#3F3C95]/30 bg-white px-3 py-2 text-xs text-[#3F3C95]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <ShareButton
                  path={`/share/${state.data.token}`}
                  title="A personalised book from Unilake Kids"
                  variant="pill"
                />
                <Button
                  type="button"
                  variant="link"
                  onClick={handleStop}
                  disabled={busy}
                  className="px-0 font-semibold text-red-700 underline"
                >
                  Stop sharing
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="justify-self-start h-10 rounded-full bg-[#3F3C95] px-6 font-bold text-white hover:bg-[#2B2882]"
            >
              {create.isPending ? "Creating link..." : "Create link"}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
