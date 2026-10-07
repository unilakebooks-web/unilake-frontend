"use client";

import { Baby, Camera, Eye, Truck } from "lucide-react";

export default function ComicInfoCards() {
  const cards = [
    {
      id: 1,
      text: "Uses Self Reference Effect to Teach ",
      icon: <Baby className="w-4 h-4 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#3F3C95]",
      border: "border-[#3F3C95]",
    },
    {
      id: 2,
      text: "Add your child's photo",
      icon: <Camera className="w-4 h-4 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#D92D73]",
      border: "border-[#D92D73]",
    },
    {
      id: 3,
      text: "Preview the full story before buying",
      icon: <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#C8942A]",
      border: "border-[#C8942A]",
    },
    {
      id: 4,
      text: "Ships in 7-8 business days",
      icon: <Truck className="w-4 h-4 text-white" strokeWidth={2.5} />,
      iconBg: "bg-[#3F3C95]",
      border: "border-[#3F3C95]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5 w-full">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`flex flex-col items-center text-center gap-1.5 px-2 py-3 bg-white rounded-[14px] border ${card.border} shadow-sm`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${card.iconBg} ring-4 ring-white shadow-sm border border-black/5`}
          >
            {card.icon}
          </div>
          <p className="text-[#333333] font-medium text-xs leading-tight">
            {card.text}
          </p>
        </div>
      ))}
    </div>
  );
}
