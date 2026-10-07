export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string | null;
  imageUrl: string | null;
  linkedinUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
}

// Create payload — optional fields must be OMITTED, not sent as "" or null
export interface CreateTeamMemberPayload {
  name: string;
  role: string;
  description?: string;
  imageKey?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
}

// Update payload — null clears, omission leaves unchanged, "" is a 400
export interface UpdateTeamMemberPayload {
  name?: string;
  role?: string;
  description?: string | null;
  imageKey?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
}
