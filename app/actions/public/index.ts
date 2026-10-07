import api from "@/app/lib/axios";
import { CustomerReview } from "@/app/types/customerReview";
import { TeamMember } from "@/app/types/teamMember";
import { SubmitFeedbackPayload } from "@/app/types/publicFeedback";
import { SubmitContactEnquiryPayload } from "@/app/types/contactEnquiry";
import { HowItWorks } from "@/app/types/howItWorks";
import { Faq, FaqPlacement } from "@/app/types/faq";
import { Blog, BlogListItem } from "@/app/types/blog";
import { SitePage, SitePageSlug } from "@/app/types/sitePage";
import { SiteSetting } from "@/app/types/siteSetting";
import { GoogleReview } from "@/app/types/googleReview";

export async function fetchPublicCustomerReviews(): Promise<CustomerReview[]> {
  try {
    const { data } = await api.get<CustomerReview[]>("/api/public/customer-reviews");
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Active Google reviews, newest first.
 *
 * Returns [] on failure, like the other homepage content fetches — a
 * testimonials section that cannot load should disappear, not take the
 * homepage down with it.
 */
export async function fetchPublicGoogleReviews(): Promise<GoogleReview[]> {
  try {
    const { data } = await api.get<GoogleReview[]>("/api/public/google-reviews");
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicTeamMembers(): Promise<TeamMember[]> {
  try {
    const { data } = await api.get<TeamMember[]>("/api/public/team-members");
    return data || [];
  } catch {
    return [];
  }
}

export async function submitPublicFeedback(payload: SubmitFeedbackPayload): Promise<void> {
  await api.post("/api/public/feedbacks", payload);
}

/**
 * A /contact form submission. Deliberately a different endpoint from
 * submitPublicFeedback — enquiries carry a reply channel and land in their own
 * admin inbox, so the two must never share a destination.
 *
 * Unlike the fetches above, this one lets errors through: a visitor whose
 * message failed to send needs to know it failed.
 */
export async function submitContactEnquiry(
  payload: SubmitContactEnquiryPayload
): Promise<void> {
  await api.post("/api/public/contact-enquiries", payload);
}

export async function fetchPublicHowItWorks(): Promise<HowItWorks | null> {
  try {
    const { data } = await api.get<HowItWorks | null>("/api/public/how-it-works");
    return data;
  } catch {
    return null;
  }
}

export async function fetchPublicFaqs(placement: FaqPlacement): Promise<Faq[]> {
  try {
    const { data } = await api.get<Faq[]>(`/api/public/faqs?placement=${placement}`);
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicBlogs(): Promise<BlogListItem[]> {
  try {
    const { data } = await api.get<BlogListItem[]>("/api/public/blogs");
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchPublicBlogBySlug(slug: string): Promise<Blog> {
  const { data } = await api.get<Blog>(`/api/public/blogs/${slug}`);
  return data;
}

/**
 * Brand + contact details for the /contact page and the site-wide Footer.
 *
 * Swallows errors and returns null, like fetchPublicHowItWorks. The Footer
 * renders on every page and falls back to its built-in defaults, so a failure
 * here must never take a page down with it.
 */
export async function fetchPublicSiteSetting(): Promise<SiteSetting | null> {
  try {
    const { data } = await api.get<SiteSetting | null>("/api/public/site-settings");
    return data;
  } catch {
    return null;
  }
}

/**
 * A published legal page.
 *
 * Deliberately does NOT swallow errors — unlike the settings fetch above. The
 * caller needs the 404 in order to call notFound(); returning null here would
 * force every page to invent its own "missing" state.
 *
 * Errors arrive as { code, message } from the axios interceptor, so callers
 * test `error?.code === "NOT_FOUND"` — there is no `.response` to inspect.
 */
export async function fetchPublicSitePage(
  slug: SitePageSlug
): Promise<SitePage> {
  const { data } = await api.get<SitePage>(`/api/public/site-pages/${slug}`);
  return data;
}
