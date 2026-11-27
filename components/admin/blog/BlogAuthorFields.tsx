"use client";

interface BlogAuthorFieldsProps {
  authorName: string;
  onAuthorNameChange: (value: string) => void;
  authorInstagramUrl: string;
  onAuthorInstagramUrlChange: (value: string) => void;
  authorLinkedinUrl: string;
  onAuthorLinkedinUrlChange: (value: string) => void;
  disabled: boolean;
}

const INPUT_CLASSES =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 outline-none focus:border-[#914A8C] focus:ring-2 focus:ring-[#914A8C]/20 focus:bg-white transition-all disabled:opacity-50";

/**
 * The post's own author (a guest author), used by the create and the edit page. Blank name: the
 * post shows the author saved in Settings, with that author's links. Styling follows the share
 * fields of the same pages.
 */
export function BlogAuthorFields({
  authorName,
  onAuthorNameChange,
  authorInstagramUrl,
  onAuthorInstagramUrlChange,
  authorLinkedinUrl,
  onAuthorLinkedinUrlChange,
  disabled,
}: BlogAuthorFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-700">Author</h3>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          Shown at the top of the post, with links to the author&apos;s Instagram and LinkedIn. All
          optional: leave the name blank to show the author set in Settings, Blog author.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="blog-author-name" className="text-sm font-bold text-gray-700">
          Author Name
        </label>
        <input
          id="blog-author-name"
          type="text"
          value={authorName}
          onChange={(e) => onAuthorNameChange(e.target.value)}
          disabled={disabled}
          placeholder="The author from Settings"
          maxLength={100}
          className={INPUT_CLASSES}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="blog-author-instagram" className="text-sm font-bold text-gray-700">
            Author Instagram
          </label>
          <input
            id="blog-author-instagram"
            type="url"
            value={authorInstagramUrl}
            onChange={(e) => onAuthorInstagramUrlChange(e.target.value)}
            disabled={disabled}
            placeholder="https://www.instagram.com/..."
            className={INPUT_CLASSES}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="blog-author-linkedin" className="text-sm font-bold text-gray-700">
            Author LinkedIn
          </label>
          <input
            id="blog-author-linkedin"
            type="url"
            value={authorLinkedinUrl}
            onChange={(e) => onAuthorLinkedinUrlChange(e.target.value)}
            disabled={disabled}
            placeholder="https://www.linkedin.com/in/..."
            className={INPUT_CLASSES}
          />
        </div>
      </div>

      {/* The post's links are shown only with its own name (never mixed with the Settings author), so
          links typed without a name would be saved and silently not shown. */}
      {!authorName.trim() && (authorInstagramUrl.trim() || authorLinkedinUrl.trim()) ? (
        <p className="text-xs text-amber-700 font-medium">
          Add an author name: without one, the post shows the author from Settings with that author&apos;s
          links, not these.
        </p>
      ) : (
        <p className="text-xs text-gray-400 font-medium">
          The links are used only with this post&apos;s own author name.
        </p>
      )}
    </div>
  );
}
