import { create } from "zustand";

export type PopupAuthStep = "email" | "otp" | "bookmark";

type PopupAuthState = {
  step: PopupAuthStep;
  email: string;
  setEmail: (email: string) => void;
  goToOtp: () => void;
  backToEmail: () => void;
  goToBookmark: () => void;
  logout: () => void;
};

export const usePopupAuthStore = create<PopupAuthState>((set) => ({
  step: "bookmark",
  email: "",
  setEmail: (email) => set({ email }),
  goToOtp: () => set({ step: "otp" }),
  backToEmail: () => set({ step: "email" }),
  goToBookmark: () => set({ step: "bookmark" }),
  logout: () => set({ step: "email", email: "" }),
}));