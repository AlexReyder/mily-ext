import { z } from "zod";

const HTTP_URL_RE = /^https?:\/\//i;

export const createBookmarkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Введите название")
    .max(120, "Максимум 120 символов"),

  url: z
    .string()
    .trim()
    .min(1, "Введите ссылку")
    .url("Введите корректный URL")
    .refine((value) => HTTP_URL_RE.test(value), {
      message: "Можно сохранять только http/https страницы",
    }),

  note: z
    .string()
    .trim()
    .max(500, "Максимум 500 символов")
    .optional()
    .or(z.literal("")),

  collectionId: z.string().trim().optional().or(z.literal("")),

  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(8, "Можно выбрать не более 8 тегов"),
});

export type CreateBookmarkFormValues = z.infer<typeof createBookmarkSchema>;