import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { FaqPlacement } from "@/app/types/faq";

interface FaqModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  placement: FaqPlacement; // Read-only, inherited from context
  initialQuestion: string;
  initialAnswer: string;
  onSave: (payload: { question: string; answer: string; placement: FaqPlacement }) => Promise<void>;
}

export function FaqModal({
  open,
  onOpenChange,
  mode,
  placement,
  initialQuestion,
  initialAnswer,
  onSave,
}: FaqModalProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState(initialAnswer);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion);
      setAnswer(initialAnswer);
      setError("");
      setIsSaving(false);
    }
  }, [open, initialQuestion, initialAnswer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError("Both question and answer are required.");
      return;
    }
    if (question.length > 200) {
      setError("Question must be 200 characters or less.");
      return;
    }
    if (answer.length > 1000) {
      setError("Answer must be 1000 characters or less.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await onSave({ question, answer, placement });
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save FAQ");
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSaving ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-[#914A8C]/20 bg-white/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-xl font-black text-gray-800">
            {mode === "create" ? "Create FAQ" : "Edit FAQ"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-medium mt-1">
            This FAQ will appear in the <strong className="text-[#914A8C]">{placement === "HOME" ? "Homepage" : "Comic Details"}</strong> section.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-bold text-gray-700">
              Question
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How long does delivery take?"
              disabled={isSaving}
              maxLength={200}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 transition-all disabled:opacity-50"
            />
            <div className="text-xs text-gray-400 text-right">
              {question.length}/200
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-bold text-gray-700">
              Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear and concise answer..."
              disabled={isSaving}
              rows={4}
              maxLength={1000}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 transition-all resize-none disabled:opacity-50"
            />
            <div className="text-xs text-gray-400 text-right">
              {answer.length}/1000
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <DialogFooter className="pt-4 sm:justify-between items-center w-full">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="text-gray-500 font-bold hover:text-gray-700 px-4 py-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !question.trim() || !answer.trim()}
              className="bg-[#914A8C] hover:bg-[#7a3e7e] text-white px-6 py-2.5 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                mode === "create" ? "Create FAQ" : "Save Changes"
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
