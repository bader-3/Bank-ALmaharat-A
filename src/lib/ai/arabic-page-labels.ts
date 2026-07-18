import { ROUTES } from "@/lib/constants";

/** أسماء الصفحات بالعربية — لنور والمحادثات بدل المسارات الإنجليزية. */
export const PAGE_LABELS_AR = {
  home: "الرئيسية",
  register: "التسجيل",
  login: "تسجيل الدخول",
  welcome: "الترحيب",
  account: "حسابي",
  interview: "المقابلة الذكية",
  courses: "الدورات",
  wallet: "المحفظة",
  goals: "أهدافي",
  path: "مساري",
  progress: "إنجازاتي",
  favorites: "المفضلة",
  activity: "سجل التعلّم",
  noor: "محادثة نور",
  trainers: "المدربين",
  learn: "التعلّم",
  review: "جلسة المراجعة",
} as const;

export type PageKey = keyof typeof PAGE_LABELS_AR;

const PATH_TO_KEY: Array<{ match: RegExp | string; key: PageKey }> = [
  { match: "/register", key: "register" },
  { match: "/login", key: "login" },
  { match: "/welcome", key: "welcome" },
  { match: "/account", key: "account" },
  { match: "/interview", key: "interview" },
  { match: "/courses", key: "courses" },
  { match: "/wallet", key: "wallet" },
  { match: "/goals", key: "goals" },
  { match: "/path", key: "path" },
  { match: "/progress", key: "progress" },
  { match: "/favorites", key: "favorites" },
  { match: "/activity", key: "activity" },
  { match: "/noor", key: "noor" },
  { match: "/trainers", key: "trainers" },
  { match: "/learn", key: "learn" },
  { match: "/review", key: "review" },
];

export function pageName(key: PageKey): string {
  return PAGE_LABELS_AR[key];
}

/** «صفحة الدورات» */
export function pagePhrase(key: PageKey): string {
  return `صفحة «${PAGE_LABELS_AR[key]}»`;
}

export function coursePagePhrase(courseTitle: string): string {
  return `صفحة دورة «${courseTitle}» ضمن «${PAGE_LABELS_AR.courses}»`;
}

/** قائمة مختصرة للصفحات الرئيسية بالعربية. */
export function mainPagesListAr(): string {
  return [
    pagePhrase("courses"),
    pagePhrase("wallet"),
    pagePhrase("goals"),
    pagePhrase("path"),
    pagePhrase("activity"),
    pagePhrase("noor"),
    pagePhrase("account"),
  ].join("، ");
}

/** يحوّل المسار إلى مفتاح صفحة، أو null إن لم يُعرف. */
export function routeKeyFromPath(path: string): PageKey | null {
  const normalized = path.split("?")[0] || "/";
  if (normalized === "/") return "home";

  for (const entry of PATH_TO_KEY) {
    if (typeof entry.match === "string") {
      if (normalized === entry.match || normalized.startsWith(`${entry.match}/`)) {
        return entry.key;
      }
    } else if (entry.match.test(normalized)) {
      return entry.key;
    }
  }
  return null;
}

export function routeLabelFromPath(path: string): string | null {
  const key = routeKeyFromPath(path);
  return key ? PAGE_LABELS_AR[key] : null;
}

export const NOOR_ROUTE_HINTS = {
  courses: ROUTES.courses,
  wallet: ROUTES.wallet,
  goals: ROUTES.goals,
  path: ROUTES.path,
  noor: ROUTES.noor,
  account: ROUTES.account,
  interview: ROUTES.interview,
} as const;
