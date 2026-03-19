import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MoveRight } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  emailAuthSchema,
  type EmailAuthFormValues,
} from "../model/auth.schemas";
import { usePopupAuthStore } from "../model/popup-auth.store";
import { AuthShell } from "./auth-shell";

export function EmailAuthStep() {
  const email = usePopupAuthStore((state) => state.email);
  const setEmail = usePopupAuthStore((state) => state.setEmail);
  const goToOtp = usePopupAuthStore((state) => state.goToOtp);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailAuthFormValues>({
    resolver: zodResolver(emailAuthSchema),
    defaultValues: {
      email,
    },
  });

  const onSubmit = async (values: EmailAuthFormValues) => {
    setEmail(values.email);
    goToOtp();
  };

  const handleYandexLogin = () => {
    window.open(
      "https://passport.yandex.ru/auth",
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <AuthShell
      badge="Authentication"
      title="Вход в Mily"
      description="Введи email, и мы отправим одноразовый код. Либо начни вход через Яндекс."
      footer={
        <p className="text-center text-xs leading-5 text-muted-foreground">
          Продолжая вход, пользователь подтверждает авторизацию в popup расширения.
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className="flex h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              {...register("email")}
            />
          </div>

          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="h-11 w-full rounded-xl"
          disabled={isSubmitting}
        >
          Войти по почте
          <MoveRight className="ml-2 size-4" />
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          или
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl"
        onClick={handleYandexLogin}
      >
        <span className="mr-2 inline-flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
          Я
        </span>
        Войти через Яндекс
      </Button>
    </AuthShell>
  );
}