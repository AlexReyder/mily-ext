import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, BookmarkPlus, LogOut, Search, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { usePopupAuthStore } from "@/features/auth/model/popup-auth.store";
import {
  createBookmarkSchema,
  type CreateBookmarkFormValues,
} from "@/features/bookmark/model/create-bookmark.schema";
import { getActiveTabDraft } from "@/features/bookmark/lib/get-active-tab-draft";
import { saveBookmark } from "@/features/bookmark/lib/bookmark.repository";

const AVAILABLE_TAGS = [
  "landing",
  "saas",
  "dashboard",
  "mobile",
  "minimal",
  "dark",
  "typography",
  "portfolio",
  "ecommerce",
  "motion",
  "brutalism",
  "cards",
];

const COLLECTIONS = [
  { id: "", name: "Без collection" },
  { id: "inspiration", name: "Inspiration" },
  { id: "ui-patterns", name: "UI Patterns" },
  { id: "competitors", name: "Competitors" },
  { id: "favorites", name: "Favorites" },
];

export function CreateBookmarkStep() {
  const logout = usePopupAuthStore((state) => state.logout);

  const [tagQuery, setTagQuery] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [tabWarning, setTabWarning] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [isDraftLoading, setIsDraftLoading] = useState(true);

  const defaultValues = useMemo<CreateBookmarkFormValues>(
    () => ({
      title: "",
      url: "",
      note: "",
      collectionId: "",
      tags: [],
    }),
    [],
  );

  const form = useForm<CreateBookmarkFormValues>({
    resolver: zodResolver(createBookmarkSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const selectedTags = watch("tags");

  const filteredTags = AVAILABLE_TAGS.filter((tag) =>
    tag.toLowerCase().includes(tagQuery.toLowerCase().trim()),
  );

  useEffect(() => {
    let cancelled = false;

    const loadDraft = async () => {
      try {
        const draft = await getActiveTabDraft();

        if (cancelled) return;

        if (!draft) {
          setTabWarning("Не удалось получить данные активной вкладки.");
          return;
        }

        setFaviconUrl(draft.faviconUrl);

        if (draft.title) {
          setValue("title", draft.title, { shouldDirty: false });
        }

        if (!draft.unsupported && draft.url) {
          setValue("url", draft.url, { shouldDirty: false });
        } else {
          setTabWarning(
            "Автоподстановка работает только для обычных http/https страниц.",
          );
        }
      } catch {
        if (!cancelled) {
          setTabWarning("Не удалось прочитать текущую вкладку.");
        }
      } finally {
        if (!cancelled) {
          setIsDraftLoading(false);
        }
      }
    };

    loadDraft();

    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const toggleTag = (tag: string) => {
    const exists = selectedTags.includes(tag);

    if (exists) {
      setValue(
        "tags",
        selectedTags.filter((item) => item !== tag),
        { shouldValidate: true, shouldDirty: true },
      );
      return;
    }

    setValue("tags", [...selectedTags, tag], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const openMainApp = async () => {
    await chrome.tabs.create({
      url: chrome.runtime.getURL("app.html"),
    });
  };

  const onSubmit = async (values: CreateBookmarkFormValues) => {
    const record = await saveBookmark({
      title: values.title,
      url: values.url,
      note: values.note ?? "",
      collectionId: values.collectionId ?? "",
      tags: values.tags,
      faviconUrl,
    });

    setSavedMessage(`Bookmark сохранён: ${record.title}`);

    reset({
      title: values.title,
      url: values.url,
      note: "",
      collectionId: "",
      tags: [],
    });

    setTagQuery("");
  };

  return (
    <div className="min-h-[620px] bg-gradient-to-b from-background to-muted/40 p-4 text-foreground">
      <div className="mx-auto w-full max-w-sm rounded-3xl border border-border/70 bg-background/95 p-5 shadow-sm backdrop-blur">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              New Bookmark
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Добавить Bookmark
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Сохрани текущую страницу локально.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex size-9 items-center justify-center rounded-xl border text-muted-foreground transition hover:text-foreground"
            aria-label="Выйти"
          >
            <LogOut className="size-4" />
          </button>
        </div>

        <div className="mb-4 rounded-xl border border-border/70 bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                className="size-4 rounded-sm"
              />
            ) : (
              <div className="size-4 rounded-sm bg-border" />
            )}

            <div className="text-xs text-muted-foreground">
              {isDraftLoading
                ? "Читаем данные текущей вкладки..."
                : "Данные вкладки подставлены автоматически"}
            </div>
          </div>

          {tabWarning ? (
            <p className="mt-2 text-xs text-destructive">{tabWarning}</p>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Название</label>
            <input
              type="text"
              placeholder="Например, Stripe — Pricing page"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("title")}
            />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("url")}
            />
            {errors.url ? (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Заметка</label>
            <textarea
              rows={4}
              placeholder="Почему ты сохраняешь этот Bookmark"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("note")}
            />
            {errors.note ? (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Collection</label>
            <select
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("collectionId")}
            >
              {COLLECTIONS.map((collection) => (
                <option key={collection.id || "none"} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Теги</label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
                placeholder="Найти тег"
                className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-xl border border-border/70 p-2">
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => {
                  const active = selectedTags.includes(tag);

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={[
                        "rounded-lg border px-2.5 py-1.5 text-xs transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {tag}
                    </button>
                  );
                })
              ) : (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  Ничего не найдено
                </p>
              )}
            </div>

            {selectedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="inline-flex items-center gap-1 rounded-lg border bg-muted px-2 py-1 text-xs"
                  >
                    {tag}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}

            {errors.tags ? (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            ) : null}
          </div>

          {savedMessage ? (
            <div className="rounded-xl border border-border/70 bg-muted/60 px-3 py-2 text-sm text-foreground">
              {savedMessage}
            </div>
          ) : null}

          <div className="space-y-2 pt-2">
            <Button
              type="submit"
              className="h-11 w-full rounded-xl"
              disabled={isSubmitting}
            >
              <BookmarkPlus className="mr-2 size-4" />
              Сохранить Bookmark
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl"
              onClick={openMainApp}
            >
              <ArrowUpRight className="mr-2 size-4" />
              Перейти на главный экран
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}