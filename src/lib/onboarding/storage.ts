/** مفاتيح localStorage للجولة التعريفية — دائمة، ليست يومية. */
export const ONBOARDING_SEEN_PAGES_KEY = "asb-onboarding-seen-pages";
export const ONBOARDING_WELCOME_SHOWN_KEY = "asb-onboarding-welcome-shown";

export type SeenPagesStore = Record<string, string[]>;
export type WelcomeShownStore = Record<string, boolean>;

export function readSeenPagesStore(): SeenPagesStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(ONBOARDING_SEEN_PAGES_KEY) ?? "{}",
    ) as SeenPagesStore;
  } catch {
    return {};
  }
}

export function writeSeenPagesStore(store: SeenPagesStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_SEEN_PAGES_KEY, JSON.stringify(store));
}

export function readWelcomeShownStore(): WelcomeShownStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(
      window.localStorage.getItem(ONBOARDING_WELCOME_SHOWN_KEY) ?? "{}",
    ) as WelcomeShownStore;
  } catch {
    return {};
  }
}

export function writeWelcomeShownStore(store: WelcomeShownStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_WELCOME_SHOWN_KEY, JSON.stringify(store));
}

/** يمسح تتبّع الجولة — يُستدعى عند بناء الحساب التجريبي. */
export function clearOnboardingTourStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ONBOARDING_SEEN_PAGES_KEY);
  window.localStorage.removeItem(ONBOARDING_WELCOME_SHOWN_KEY);
}
