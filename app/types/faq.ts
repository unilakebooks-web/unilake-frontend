export type FaqPlacement = "HOME" | "COMIC";

export type Faq = {
  id: string;
  placement: FaqPlacement;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
