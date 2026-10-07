"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface BlogTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
}

export function BlogTagInput({
  tags,
  onChange,
  maxTags = 8,
  maxTagLength = 30,
}: BlogTagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    // Normalize: lowercase, trim, remove multiple spaces
    const normalized = tag.toLowerCase().trim().replace(/\s+/g, ' ');
    
    if (!normalized) return;

    if (normalized.length > maxTagLength) {
      toast.error(`Tag cannot exceed ${maxTagLength} characters`);
      return;
    }

    if (tags.length >= maxTags) {
      toast.error(`Maximum of ${maxTags} tags allowed`);
      return;
    }

    if (tags.includes(normalized)) {
      setInputValue("");
      return; // Deduplicate silently
    }

    onChange([...tags, normalized]);
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addTag(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center p-2 bg-white border border-gray-200 rounded-xl focus-within:border-[#914A8C] focus-within:ring-2 focus-within:ring-[#914A8C]/20 transition-all min-h-[50px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 font-medium text-sm rounded-lg border border-gray-200 group"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0.5 transition-colors focus:outline-none"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={tags.length >= maxTags}
          placeholder={tags.length >= maxTags ? "Max tags reached" : "Type a tag and press Enter..."}
          className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-gray-800 disabled:opacity-50"
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
        <span>Press Enter to add a tag</span>
        <span>{tags.length} / {maxTags} tags</span>
      </div>
    </div>
  );
}
