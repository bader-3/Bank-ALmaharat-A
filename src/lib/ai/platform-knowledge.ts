import { ROUTES, SITE } from "@/lib/constants";
import {
  COURSES,
  SPECIALTIES,
  TRAINERS,
  getSpecialtyById,
  getTrainerById,
} from "@/lib/courses/mock-data";
import { HOUR_PACKAGES } from "@/lib/wallet/packages";
import { DELIVERY_LABELS, LEVEL_LABELS } from "@/types/course";

export { COURSES, HOUR_PACKAGES };

export function getCourseCatalogForAi() {
  return COURSES.map((course) => {
    const specialty = getSpecialtyById(course.specialtyId);
    const trainer = getTrainerById(course.trainerId);
    return {
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      level: course.level,
      levelLabel: LEVEL_LABELS[course.level],
      hours: course.hours,
      deliveryMode: course.deliveryMode,
      deliveryLabel: DELIVERY_LABELS[course.deliveryMode],
      specialty: specialty?.name ?? course.specialtyId,
      trainerId: course.trainerId,
      trainerName: trainer?.name ?? "",
      hasCertificate: course.hasCertificate,
    };
  });
}

export function getTrainersForAi() {
  return TRAINERS.map((trainer) => ({
    id: trainer.id,
    name: trainer.name,
    title: trainer.title,
    bio: trainer.bio,
    courseCount: COURSES.filter((course) => course.trainerId === trainer.id).length,
  }));
}

export function getSpecialtiesForAi() {
  return SPECIALTIES.map((specialty) => ({
    id: specialty.id,
    name: specialty.name,
    courseCount: COURSES.filter((course) => course.specialtyId === specialty.id).length,
  }));
}

export function getPackagesForAi() {
  return HOUR_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    hours: pkg.hours,
    price: pkg.price,
    description: pkg.description,
  }));
}

function buildPlatformOverview(): string {
  return `## المنصة: ${SITE.name}
${SITE.description}

### نموذج اقتصاد الساعات
- المتعلّم يشتري رصيدًا من الساعات في المحفظة (/wallet) — لا يشتري دورة كاملة مسبقًا.
- يستكشف مدربين (/trainers) ودورات (/courses) بساعات قليلة.
- عند صفحة الدورة: يختار «شراء الدرس الأول» أو «شراء الدورة كاملة»، وبعد إكمال درس يمكنه «شراء الدرس التالي» أو «شراء باقي الدورة».
- تُخصم ساعات كل درس عند شرائه بصيغة ساعة:دقيقة (مثل 1:10 أو 7:00).
- إكمال جميع دروس الدورة شرط للحصول على الشهادة (إن وُجدت).
- الاستكشاف ≠ إكمال الدورة ≠ شهادة — تجربة درس أو مدرب لا تمنح شهادة.`;
}

function buildPagesGuide(): string {
  return `## صفحات المنصة
| المسار | الاسم | الغرض |
|--------|-------|-------|
| ${ROUTES.home} | الرئيسية | التعريف بالمنصة والفكرة |
| ${ROUTES.register} | التسجيل | إنشاء حساب جديد |
| ${ROUTES.login} | تسجيل الدخول | الدخول للحساب |
| ${ROUTES.welcome} | الترحيب | بعد التسجيل — نظرة على المحفظة والخطوات التالية |
| ${ROUTES.interview} | المقابلة الذكية | جلسة مع نور لفهم الأهداف وبناء الملف التعليمي |
| ${ROUTES.account} | حسابي | الملف، المحفظة، التسجيلات، اقتراحات التكيّف |
| ${ROUTES.courses} | الدورات | استكشاف وفلترة ${COURSES.length} دورة في ${SPECIALTIES.length} تخصصًا |
| /courses/[slug] | تفاصيل الدورة | المدرب، الدروس، الساعات، خيارات الشراء |
| /learn/[slug] | التعلّم | مشاهدة الدروس المشتراة، إكمالها، شراء دروس إضافية |
| /trainers/[id] | ملف المدرب | السيرة، التقييمات، دورات المدرب |
| ${ROUTES.wallet} | المحفظة | شراء باقات الساعات ومتابعة الرصيد |
| ${ROUTES.goals} | الأهداف | تقويم الأهداف اليومية من الخطة المعتمدة |
| ${ROUTES.path} | مساري | مسار التعلّم المعتمد (الدورات والأسابيع) |
| ${ROUTES.progress} | إنجازاتي | الشارات، السلسلة، الإنجازات |
| ${ROUTES.activity} | سجل التعلّم | سجل الجلسات وجلسات المراجعة مع نور |
| ${ROUTES.favorites} | المفضّلة | الدورات المحفوظة |
| ${ROUTES.noor} | نور | المحادثة الكاملة وبناء خطة تعلّم منظمة |
| /review/[slug]/[lessonId] | جلسة المراجعة | بعد إكمال درس — أسئلة واختبار قصير مع نور |`;
}

function buildNoorServicesGuide(): string {
  return `## خدمات نور (أدوارك)
1. **المساعد العائم** (معظم الصفحات): إجابات عن المنصة، التوجيه للصفحات، مساعدة في اختيار دورة/مدرب من الفهرس.
2. **المقابلة الذكية** (/interview): جمع 6 محاور (هدف، مستوى، خبرة، وقت أسبوعي، طريقة التعلّم، ميزانية ساعات) ثم بناء ملف تعليمي.
3. **بناء الخطة** (/noor): مقابلة منظمة → اختيار دورات من الفهرس → مسودة خطة → اعتماد → أهداف يومية في /goals.
4. **جلسة المراجعة** (/review): بعد إكمال درس — Q&A واختبار 4 أسئلة على محتوى الدرس فقط.
5. **التكيّف**: محرك قواعد يقترح تعديلات على الخطة من التقدّم — تظهر في /account و/noor.

### ما لا تفعلينه
- لستِ معلّمة داخل مشاهدة الدرس — الشرح من المدرب في /learn.
- لا تخترعي دورات أو مدربين أو أسعارًا خارج الفهرس أدناه.
- لا تدّعي إنشاء خطة كاملة من المحادثة العامة — وجّهي لـ /noor للمسار المنظم.`;
}

function buildPurchaseGuide(): string {
  return `## آلية الشراء والتعلّم
1. التسجيل → المقابلة الذكية (/interview) → شراء ساعات (/wallet).
2. اختيار دورة (/courses) → صفحة الدورة → شراء درس أو دورة كاملة.
3. /learn/[slug] → مشاهدة وإكمال الدرس → تُفتح /review تلقائيًا.
4. بعد المراجعة → العودة للدورة لشراء الدرس التالي أو باقي الدورة.
5. /path و/goals لمتابعة المسار؛ /progress للإنجازات؛ /activity للسجل.`;
}

function buildCatalogSection(): string {
  return `## فهرس الدورات (${COURSES.length} دورة — استخدم slug فقط)
${JSON.stringify(getCourseCatalogForAi(), null, 0)}`;
}

function buildTrainersSection(): string {
  return `## فهرس المدربين (${TRAINERS.length} مدرب — استخدم id للرابط /trainers/[id])
${JSON.stringify(getTrainersForAi(), null, 0)}`;
}

function buildPackagesSection(): string {
  return `## باقات المحفظة
${JSON.stringify(getPackagesForAi(), null, 0)}`;
}

function buildSpecialtiesSection(): string {
  return `## التخصصات
${JSON.stringify(getSpecialtiesForAi(), null, 0)}`;
}

/** معرفة كاملة بالمنصة — تُحقَن في prompts نور */
export function buildFullPlatformKnowledge(): string {
  return [
    buildPlatformOverview(),
    buildPagesGuide(),
    buildNoorServicesGuide(),
    buildPurchaseGuide(),
    buildSpecialtiesSection(),
    buildPackagesSection(),
    buildTrainersSection(),
    buildCatalogSection(),
  ].join("\n\n");
}
