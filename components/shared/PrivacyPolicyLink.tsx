import Link from "next/link";

/** The link inside the data-deletion notes, so the wording around it can differ from page to page. */
export function PrivacyPolicyLink() {
  return (
    <Link href="/privacy" className="underline hover:text-[#914A8C]">
      Privacy Policy
    </Link>
  );
}
