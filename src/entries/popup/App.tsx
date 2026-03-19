import { ShieldCheck } from "lucide-react";

import { Button } from "../../components/ui/button";
import { EmailAuthStep } from "../../features/auth/ui/email-auth-step";
import { OtpAuthStep } from "../../features/auth/ui/otp-auth-step";
import { usePopupAuthStore } from "../../features/auth/model/popup-auth.store";
import { CreateBookmarkStep } from "@/features/bookmark/ui/create-bookmark-step";

export default function App() {
  const step = usePopupAuthStore((state) => state.step);

  if (step === "otp") {
    return <OtpAuthStep />;
  }

  if (step === "bookmark") {
    return <CreateBookmarkStep />;
  }

  return <EmailAuthStep />;
}