# بنك المهارات العربي — Arab Skills Bank

منصة تعليمية عربية مبنية على Next.js 15 + React 19 + Tailwind CSS v4.

## التشغيل

```bash
npm install
npm run dev
```

## الهيكل

```
src/
├── app/
│   ├── (app)/          # صفحات مسجّل الدخول (حسابي، أهدافي، دورات، محفظة، نور)
│   ├── (auth)/         # تسجيل الدخول، التسجيل، المقابلة
│   └── api/ai/         # مسارات Gemini (مقابلة، ملف، مساعد، معلّم، خطة)
├── components/
│   ├── ui/             # button, card, input, badge, icons, modal, theme-toggle
│   ├── layout/         # app-shell, auth-shell, sidebar, footer
│   ├── landing/        # الصفحة الرئيسية
│   ├── auth/           # نماذج الدخول والتسجيل
│   ├── interview/      # المقابلة الذكية
│   ├── goals/          # الأهداف اليومية
│   ├── courses/        # استكشاف الدورات
│   ├── wallet/         # المحفظة
│   ├── account/        # لوحة المتعلّم
│   └── ai/             # نور والمساعد الذكي
├── lib/                # منطق الأعمال (AI، دورات، تخطيط، توصيات)
├── services/           # طبقة البيانات (mock + Firebase)
├── providers/          # Auth, Theme, Wallet, Modal
└── types/              # أنواع TypeScript
```

## الهوية البصرية

| Token | Light | Dark |
|---|---|---|
| Background | `#fdfbf7` | `#0b1b2b` (navy) |
| Surface | `#ffffff` | `#0f2235` |
| Navy | `#0b1b2b` | — |
| Sage (CTA) | `#2d6a4f` | `#2d6a4f` |
| Gold (Accent) | `#c49a2c` | `#c49a2c` |

الخط: **Alexandria** (واجهة) + **Noto Naskh Arabic** (عناوين تحريرية).

فئات الطباعة في `globals.css`: `type-hero`, `type-section`, `type-card-title`, `type-lead`, `type-body`, `type-small`, `type-label`.

## الأوامر

| الأمر | الوصف |
|---|---|
| `npm run dev` | خادم التطوير |
| `npm run build` | بناء الإنتاج |
| `npm test` | اختبارات Vitest |
| `npm run lint` | ESLint |
| `npm run clean` | حذف `.next` |

## التوثيق

- `docs/01_PROJECT_DOCUMENTATION.md` — رؤية المشروع
- `docs/02-PROJECT_CONTEXT.md` — سياق المنتج
- `docs/03-PROJECT_RULES.md` — قواعد التطوير

## متغيرات البيئة

```env
GEMINI_API_KEY=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

بدون مفتاح Gemini، يعمل النظام بوضع mock fallback تلقائيًا في التطوير.
