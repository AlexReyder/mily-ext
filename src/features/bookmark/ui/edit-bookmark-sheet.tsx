import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  BookmarkRecord,
  UpdateBookmarkInput,
} from "@/features/bookmark/model/bookmark.types";

type EditBookmarkSheetProps = {
  open: boolean;
  bookmark: BookmarkRecord | null;
  onOpenChange: (open: boolean) => void;
  onSave: (bookmarkId: string, input: UpdateBookmarkInput) => void;
  isSaving?: boolean;
};

function normalizeTag(tag: string) {
  return tag.trim();
}

export function EditBookmarkSheet({
  open,
  bookmark,
  onOpenChange,
  onSave,
  isSaving = false,
}: EditBookmarkSheetProps) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (!bookmark) {
      setTitle("");
      setTags([]);
      setTagInput("");
      setTitleError("");
      return;
    }

    setTitle(bookmark.title);
    setTags(bookmark.tags);
    setTagInput("");
    setTitleError("");
  }, [bookmark]);

  const canSubmit = useMemo(() => {
    return Boolean(bookmark) && title.trim().length > 0 && !isSaving;
  }, [bookmark, title, isSaving]);

  const handleAddTag = () => {
    const nextTag = normalizeTag(tagInput);

    if (!nextTag) {
      return;
    }

    const exists = tags.some(
      (tag) => tag.toLowerCase() === nextTag.toLowerCase(),
    );

    if (exists) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, nextTag]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!bookmark) {
      return;
    }

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setTitleError("Title is required");
      return;
    }

    setTitleError("");
    onSave(bookmark.id, {
      title: normalizedTitle,
      tags,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {bookmark ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="text-left">
              <SheetTitle>Edit bookmark</SheetTitle>
              <SheetDescription>
                Измени title и tags для выбранного bookmark.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 py-6">
              <div className="space-y-2">
                <div className="text-sm font-medium">URL</div>
                <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground break-all">
                  {bookmark.url}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bookmark-title" className="text-sm font-medium">
                  Title
                </label>
                <input
                  id="bookmark-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) {
                      setTitleError("");
                    }
                  }}
                  placeholder="Bookmark title"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                {titleError ? (
                  <p className="text-sm text-destructive">{titleError}</p>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Tags</div>

                <div className="flex gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus className="mr-2 size-4" />
                    Add
                  </Button>
                </div>

                {tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 rounded-xl border bg-background px-3 py-1 text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-muted-foreground transition hover:text-foreground"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="size-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-3 py-4 text-sm text-muted-foreground">
                    Tags пока нет
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="mt-auto flex-row justify-end gap-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>

              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </SheetFooter>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}