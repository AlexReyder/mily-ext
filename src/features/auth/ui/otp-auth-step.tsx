import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "../../../components/ui/button";
import {
  otpAuthSchema,
  type OtpAuthFormValues,
} from "../model/auth.schemas";
import { usePopupAuthStore } from "../model/popup-auth.store";
import { AuthShell } from "./auth-shell";

export function OtpAuthStep() {
  const email = usePopupAuthStore((state) => state.email);
  const backToEmail = usePopupAuthStore((state) => state.backToEmail);
  const goToBookmark = usePopupAuthStore((state) => state.goToBookmark);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpAuthFormValues>({
    resolver: zodResolver(otpAuthSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (values: OtpAuthFormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    if (values.code === "123456") {
      goToBookmark();
      return;
    }

    setError("code", {
      type: "manual",
      message: "Неверный код. Попробуй ещё раз.",
    });
  };

  const handleResend = () => {
    reset({ code: "" });
  };

  return (
    <AuthShell
      badge="OTP Verification"
      title="Подтверди вход"
      description={`Мы отправили 6-значный код на ${email || "указанный email"}.`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToEmail}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Изменить email
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Отправить код снова
          </button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label
            htmlFor="code"
            className="text-sm font-medium text-foreground"
          >
            OTP код
          </label>

          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm tracking-[0.35em] outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("code")}
            />
          </div>

          {errors.code ? (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          ) : null}

          {import.meta.env.DEV ? (
            <p className="text-xs text-muted-foreground">
              Dev-код для демо: 123456
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl"
          disabled={isSubmitting}
        >
          Подтвердить вход
        </Button>
      </form>
    </AuthShell>
  );
}