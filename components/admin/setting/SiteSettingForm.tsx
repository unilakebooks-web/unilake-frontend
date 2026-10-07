"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSaveSiteSetting } from "@/hooks/useSiteSettings";
import { getErrorMessage } from "@/lib/utils";
import {
  CharCounter,
  SEO_TITLE_LIMIT,
  SEO_DESCRIPTION_LIMIT,
} from "@/components/admin/shared/CharCounter";
import type { SiteSetting } from "@/app/types/siteSetting";
import {
  siteSettingFormSchema,
  toFormValues,
  toPayload,
  type SiteSettingFormValues,
} from "./siteSettingFormSchema";

interface SiteSettingFormProps {
  setting: SiteSetting | null;
}

/** Visual grouping for a related run of fields. */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/70 backdrop-blur-sm rounded-3xl border border-[#914A8C]/15 shadow-sm p-6 sm:p-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-neutral-900">{label}</label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass = "h-11 rounded-xl bg-white";

export function SiteSettingForm({ setting }: SiteSettingFormProps) {
  const saveSetting = useSaveSiteSetting();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<SiteSettingFormValues>({
    resolver: zodResolver(siteSettingFormSchema),
    defaultValues: toFormValues(setting),
  });

  // The query resolves after first render, so seed the form once it lands.
  useEffect(() => {
    reset(toFormValues(setting));
  }, [setting, reset]);

  // useWatch rather than the destructured watch(): watch() returns a fresh
  // function on every render, which the React Compiler cannot memoize safely
  // (it warns "incompatible library"). useWatch subscribes to just these two
  // fields, so the counters update live without re-rendering the whole form.
  const metaTitleValue = useWatch({ control, name: "metaTitle" }) ?? "";
  const metaDescriptionValue =
    useWatch({ control, name: "metaDescription" }) ?? "";

  const onSubmit = async (values: SiteSettingFormValues) => {
    try {
      // toPayload maps "" -> null. The API rejects empty strings, so sending
      // raw form values would fail on any blank field.
      await saveSetting.mutateAsync(toPayload(values));
      reset(values); // clears isDirty without refetching
      toast.success("Settings saved");
    } catch (err: unknown) {
      toast.error("Failed to save: " + getErrorMessage(err, "Server error"));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Section
        title="Brand"
        description="Shown in the footer on every page of the site."
      >
        <Field
          label="Brand description"
          hint="A short paragraph about what UniLake does."
          error={errors.brandDescription?.message}
        >
          <Textarea
            {...register("brandDescription")}
            rows={3}
            placeholder="Creating magical personalized stories that spark imagination…"
            className="rounded-xl bg-white resize-none"
          />
        </Field>
      </Section>

      <Section
        title="Search engine (SEO)"
        description="What Google shows, and what appears when someone shares a link on WhatsApp or Facebook. Used for any page that has no SEO text of its own — comics and blog posts can override it individually."
      >
        <Field
          label="Site title"
          hint="Shown for the homepage, and anywhere without its own title. Leave blank to use “UniLake”."
          error={errors.metaTitle?.message}
        >
          <Input
            {...register("metaTitle")}
            placeholder="UniLake — Personalized Storybooks for Kids"
            className={inputClass}
          />
          <div className="flex justify-end pt-0.5">
            <CharCounter value={metaTitleValue} limit={SEO_TITLE_LIMIT} />
          </div>
        </Field>

        <Field
          label="Site description"
          hint="One or two sentences describing the site. This is the grey text under your link in Google results."
          error={errors.metaDescription?.message}
        >
          <Textarea
            {...register("metaDescription")}
            rows={3}
            placeholder="Turn your child into the hero of their own comic book — upload a photo and we do the rest."
            className="rounded-xl bg-white resize-none"
          />
          <div className="flex justify-end pt-0.5">
            <CharCounter
              value={metaDescriptionValue}
              limit={SEO_DESCRIPTION_LIMIT}
            />
          </div>
        </Field>
      </Section>

      <Section
        title="Contact page intro"
        description="The heading and text at the top of the Contact page."
      >
        <Field label="Headline" error={errors.headline?.message}>
          <Input
            {...register("headline")}
            placeholder="Get in touch"
            className={inputClass}
          />
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <Textarea
            {...register("description")}
            rows={3}
            placeholder="We would love to hear from you…"
            className="rounded-xl bg-white resize-none"
          />
        </Field>
      </Section>

      <Section
        title="Contact channels"
        description="How customers can reach you. The email also appears in the footer."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Email" error={errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              placeholder="hello@unilakekids.com"
              className={inputClass}
            />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <Input
              {...register("phone")}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </Field>

          <Field label="WhatsApp number" error={errors.whatsappPhone?.message}>
            <Input
              {...register("whatsappPhone")}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </Field>

          <Field
            label="Business hours"
            hint="Free text, e.g. Mon–Fri, 9am–6pm IST"
            error={errors.businessHours?.message}
          >
            <Input
              {...register("businessHours")}
              placeholder="Mon–Fri, 9am–6pm IST"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Address"
        description="Displayed on the Contact page, with an optional embedded map."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Address line 1" error={errors.addressLine1?.message}>
            <Input {...register("addressLine1")} className={inputClass} />
          </Field>

          <Field label="Address line 2" error={errors.addressLine2?.message}>
            <Input {...register("addressLine2")} className={inputClass} />
          </Field>

          <Field label="City" error={errors.city?.message}>
            <Input {...register("city")} className={inputClass} />
          </Field>

          <Field label="State" error={errors.state?.message}>
            <Input {...register("state")} className={inputClass} />
          </Field>

          <Field label="ZIP / Postcode" error={errors.zip?.message}>
            <Input {...register("zip")} className={inputClass} />
          </Field>

          <Field label="Country" error={errors.country?.message}>
            <Input {...register("country")} className={inputClass} />
          </Field>
        </div>

        <Field
          label="Map embed URL"
          hint="Google Maps → Share → Embed a map → copy the src URL from the iframe."
          error={errors.mapEmbedUrl?.message}
        >
          <Input
            {...register("mapEmbedUrl")}
            placeholder="https://www.google.com/maps/embed?pb=…"
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Social links"
        description="Only the ones you fill in are shown. The Instagram link also appears in the footer."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Instagram" error={errors.instagramUrl?.message}>
            <Input
              {...register("instagramUrl")}
              placeholder="https://instagram.com/…"
              className={inputClass}
            />
          </Field>

          <Field label="Facebook" error={errors.facebookUrl?.message}>
            <Input
              {...register("facebookUrl")}
              placeholder="https://facebook.com/…"
              className={inputClass}
            />
          </Field>

          <Field label="Twitter / X" error={errors.twitterUrl?.message}>
            <Input
              {...register("twitterUrl")}
              placeholder="https://x.com/…"
              className={inputClass}
            />
          </Field>

          <Field label="YouTube" error={errors.youtubeUrl?.message}>
            <Input
              {...register("youtubeUrl")}
              placeholder="https://youtube.com/@…"
              className={inputClass}
            />
          </Field>

          <Field label="LinkedIn" error={errors.linkedinUrl?.message}>
            <Input
              {...register("linkedinUrl")}
              placeholder="https://linkedin.com/company/…"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      {/* Sticky so the button stays reachable on a long form. */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={!isDirty || saveSetting.isPending}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#914A8C] hover:bg-[#7a3e75] text-white font-semibold text-sm shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saveSetting.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}
