export const SITE = {
  name: "بنك المهارات العربي",
  tagline: "تعلّم بالوقت، لا بالالتزام",
  description:
    "منصة تعليمية عربية بنموذج اقتصاد الساعات: تشتري رصيدًا في محفظتك، تستكشف مدربين ودورات بحرية، وتُكمل الدورة كاملة للحصول على الشهادة.",
} as const;

export const NAV_LINKS = [
  { href: "/courses", label: "الدورات" },
  { href: "/#how-it-works", label: "كيف يعمل" },
  { href: "/#idea", label: "الفكرة" },
  { href: "/#noor", label: "نور" },
  { href: "/#principles", label: "المبادئ" },
] as const;

export const ROUTES = {
  home: "/",
  register: "/register",
  login: "/login",
  welcome: "/welcome",
  account: "/account",
  interview: "/interview",
  courses: "/courses",
  trainers: "/trainers",
  wallet: "/wallet",
  goals: "/goals",
  path: "/path",
  progress: "/progress",
  favorites: "/favorites",
  activity: "/activity",
  noor: "/noor",
  /** Default landing after interview — full app shell with sidebar */
  platformHome: "/courses",
  review: (slug: string, lessonId: string) => `/review/${slug}/${lessonId}` as const,
  trainer: (id: string) => `/trainers/${id}` as const,
  learn: (slug: string) => `/learn/${slug}` as const,
} as const;
