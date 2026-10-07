import { UseFormReturn } from "react-hook-form";
import { ComicCreateFormValues } from "./comicCreateSchema";
import { TagChipsField } from "./TagChipsField";
import { useThemes } from "@/hooks/useThemes";
import { AGE_GROUP_OPTIONS, GENDER_OPTIONS } from "@/lib/comicTags";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

interface ComicDetailsFieldsProps {
  form: UseFormReturn<ComicCreateFormValues>;
}

export function ComicDetailsFields({ form }: ComicDetailsFieldsProps) {
  const { data: themes, isLoading: isLoadingThemes } = useThemes();

  return (
    <div className="space-y-6">
      {/* Gender, age group and theme are multi-select chip rows. Each spans
          both columns so its chips have room to sit on one line, and carries
          min-w-0 so a long theme name wraps instead of widening the grid. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-neutral-900 font-semibold">Comic Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter comic title" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genderTags"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2 min-w-0">
              <FormLabel className="text-neutral-900 font-semibold">Gender *</FormLabel>
              <FormControl>
                <TagChipsField
                  ariaLabel="Gender"
                  options={GENDER_OPTIONS}
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription className="text-xs">Pick every gender this comic is for.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ageGroups"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2 min-w-0">
              <FormLabel className="text-neutral-900 font-semibold">Age Group *</FormLabel>
              <FormControl>
                <TagChipsField
                  ariaLabel="Age group"
                  options={AGE_GROUP_OPTIONS}
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription className="text-xs">Pick every age group this comic suits.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pageCount"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Total Page Count *</FormLabel>
              <FormControl>
                <Input type="number" min="1" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormDescription className="text-xs">Physical pages in the printed book.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="freePreviewPages"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel className="text-neutral-900 font-semibold">Free Preview Pages *</FormLabel>
              <FormControl>
                <Input type="number" min="0" {...field} className="h-11 rounded-xl bg-white border-neutral-200" />
              </FormControl>
              <FormDescription className="text-xs">Must be less than total page count.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="themeIds"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2 min-w-0">
              <FormLabel className="text-neutral-900 font-semibold">Theme *</FormLabel>
              {isLoadingThemes ? (
                <Skeleton className="h-9 w-full rounded-xl bg-neutral-100" />
              ) : themes && themes.length > 0 ? (
                <FormControl>
                  <TagChipsField
                    ariaLabel="Theme"
                    options={themes.map((t) => ({ value: t.id, label: t.name }))}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                </FormControl>
              ) : (
                <p className="text-sm text-neutral-500">
                  No themes yet — create one on the Themes page first.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-neutral-900 font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Comic synopsis or details..." 
                  {...field} 
                  className="min-h-[100px] rounded-xl bg-white border-neutral-200 resize-y" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isBestseller"
          render={({ field }: { field: any }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 bg-white md:col-span-2">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-semibold text-neutral-900">Bestseller Badge</FormLabel>
                <FormDescription className="text-xs text-neutral-500">
                  Highlight this comic as a bestseller on the storefront.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
