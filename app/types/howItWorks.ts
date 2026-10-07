export type HowItWorksStep = {
  heading: string;
  description: string;
};

export type HowItWorks = {
  id: string;
  videoUrl: string | null;
  posterUrl: string | null;
  steps: HowItWorksStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HowItWorksUploadUrlResponse = {
  uploadUrl: string;
  key: string;
};
