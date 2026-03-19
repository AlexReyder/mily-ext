import { z } from "zod";

export const emailAuthSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Введите email")
    .email("Введите корректный email"),
});

export const otpAuthSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Код должен состоять из 6 цифр"),
});

export type EmailAuthFormValues = z.infer<typeof emailAuthSchema>;
export type OtpAuthFormValues = z.infer<typeof otpAuthSchema>;