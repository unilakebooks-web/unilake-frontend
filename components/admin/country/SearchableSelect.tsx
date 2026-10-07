"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

interface Option {
  code: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.code === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <label className="text-sm font-semibold text-neutral-800 block">
        {label} <span className="text-red-500">*</span>
      </label>
      <div
        className={`h-11 px-3.5 text-sm rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
          disabled
            ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
            : "bg-[#F8E7D2]/20 border-[#914A8C]/30 hover:border-[#914A8C]/60 text-neutral-900"
        } ${isOpen ? "ring-2 ring-[#914A8C]/30 border-[#914A8C]" : ""}`}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm("");
          }
        }}
      >
        <span className={selectedOption ? "" : "text-neutral-500"}>
          {selectedOption
            ? `${selectedOption.code} — ${selectedOption.name}`
            : placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-neutral-500 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-neutral-100">
            <input
              type="text"
              placeholder="Search..."
              className="w-full h-9 px-3 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#914A8C]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-500">
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt.code}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                    value === opt.code
                      ? "bg-[#914A8C]/10 text-[#914A8C] font-semibold"
                      : "hover:bg-neutral-100 text-neutral-700"
                  }`}
                  onClick={() => {
                    onChange(opt.code);
                    setIsOpen(false);
                  }}
                >
                  <span>
                    <span className="font-mono text-xs mr-2 opacity-70">
                      {opt.code}
                    </span>
                    {opt.name}
                  </span>
                  {value === opt.code && (
                    <Check className="w-4 h-4 text-[#914A8C]" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
