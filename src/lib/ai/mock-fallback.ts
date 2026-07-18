import type { AssistantContext } from "@/lib/ai/prompts";
import { alignGeneratedProfileWithCatalog } from "@/lib/ai/align-profile-recommendations";
import {
  coursePagePhrase,
  mainPagesListAr,
  pagePhrase,
} from "@/lib/ai/arabic-page-labels";
import { getCourseCatalogForAi } from "@/lib/ai/platform-knowledge";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { SITE } from "@/lib/constants";
import { getRecommendedPackageId } from "@/lib/wallet/packages";
import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";
import {
  extractPlanningAnswerFallback,
  type PlanningExtraction,
} from "@/lib/ai/planning";
import { applyStructuredAnswersToProfile, structuredDraftToAnswers } from "@/lib/interview/build-structured-profile";
import type { StructuredInterviewDraft } from "@/lib/interview/steps";
import type { PlanningPreferences } from "@/types/noor";

const PROFILE_READY_MARKER = "[PROFILE_READY]";

export function isAiFallbackEnabled() {
  return process.env.AI_FALLBACK_ON_ERROR !== "false";
}

export function mockInterviewReply(messages: AiChatMessage[]): string {
  const userTurns = messages.filter((m) => m.role === "user" && m.text !== "ابدأ المقابلة");
  const lastUser = userTurns.at(-1)?.text ?? "";
  const count = userTurns.length;

  if (count === 0) {
    return `أهلًا بك! أنا نور، مرشدتك التعليمية في ${SITE.name}. ما الهدف الذي تريد تحقيقه من التعلّم؟`;
  }

  if (count === 1) {
    return `هدف جميل. ما مستواك الحالي في المجال المرتبط بهذا الهدف: مبتدئ، متوسط، أم متقدّم؟`;
  }

  if (count === 2) {
    return "ما خبرتك السابقة في هذا المجال؟ اذكر دورة أو مشروعًا أو ممارسة سابقة، أو قل «لا توجد خبرة».";
  }

  if (count === 3) {
    return "كم ساعة تستطيع تخصيصها للتعلّم أسبوعيًا بصورة واقعية؟";
  }

  if (count === 4) {
    return "ما طريقة التعلّم التي تفضّلها: دورات مسجّلة، جلسات مباشرة، أم كلتاهما؟";
  }

  if (count === 5) {
    return "كم ساعة تريد البدء بها في المحفظة؟ مثال: 5–10 ساعات لاستكشاف مدربين ودورات.";
  }

  if (count === 6) {
    return "شكرًا لك. فهمت هدفك ومستواك وخبرتك ووقتك الأسبوعي وطريقة التعلّم والميزانية المناسبة. هل هذه المعلومات صحيحة لأبني ملفك التعليمي؟";
  }

  if (!/نعم|صحيح|تمام|موافق|اوافق|أكد|اكد/.test(lastUser)) {
    return "بالتأكيد. اذكر المعلومة التي تريد تصحيحها، وبعد تعديلها أكّد لي أن الملخص أصبح صحيحًا.";
  }

  return `ممتاز، تم تأكيد المعلومات. سأبني ملفك التعليمي ومسارك الأولي الآن.\n${PROFILE_READY_MARKER}`;
}

export function mockProfileFromConversation(
  messages: AiChatMessage[],
  structured?: StructuredInterviewDraft,
): AiGeneratedProfile {
  if (structured?.weeklyHours) {
    const answers = structuredDraftToAnswers(structured);
    const baseProfile: AiGeneratedProfile = {
      answers: {
        goal: answers.goal,
        currentLevel: answers.currentLevel,
        priorExperience: answers.priorExperience,
        weeklyHours: answers.weeklyHours,
        learningPreference: answers.learningPreference,
        budgetOrHours: answers.budgetOrHours,
      },
      summary: "",
      suggestedSkills: ["التطبيق العملي", "التعلّم الذاتي", "لغات"],
      suggestedPath: "",
      learningPlan: {
        totalWeeks: 0,
        totalHours: 0,
        suggestedPackageId: getRecommendedPackageId(answers),
        packageReason: "",
        weeks: [],
      },
      courseRecommendations: [],
    };
    return applyStructuredAnswersToProfile(
      alignGeneratedProfileWithCatalog(baseProfile, messages),
      structured,
    );
  }

  const userText = messages
    .filter((m) => m.role === "user" && m.text !== "ابدأ المقابلة")
    .map((m) => m.text)
    .join(" ");

  const goal = userText.includes("مهني") || userText.includes("وظيف")
    ? "career_change"
    : userText.includes("جام")
      ? "student"
      : userText.includes("تطوير")
        ? "skill_upgrade"
        : "personal";

  const currentLevel = userText.includes("متقد") || /b2|c1|advanced/i.test(userText)
    ? "advanced"
    : userText.includes("متوسط") || /b1|intermediate/i.test(userText)
      ? "intermediate"
      : "beginner";

  const extractedHours = extractWeeklyHoursFromText(userText);

  const answers = {
    goal,
    currentLevel,
    priorExperience: userText.includes("لا") && userText.includes("خبر") ? "none" : "some",
    weeklyHours: extractedHours ? `${extractedHours} ساعة` : "5 ساعة",
    learningPreference: "both" as const,
    budgetOrHours: "10-20h",
  };

  const baseProfile: AiGeneratedProfile = {
    answers,
    summary: buildMockSummary(userText, currentLevel, goal),
    suggestedSkills: ["التطبيق العملي", "التعلّم الذاتي"],
    suggestedPath: "",
    learningPlan: {
      totalWeeks: 0,
      totalHours: 0,
      suggestedPackageId: getRecommendedPackageId(answers),
      packageReason: "",
      weeks: [],
    },
    courseRecommendations: [],
  };

  return alignGeneratedProfileWithCatalog(baseProfile, messages);
}

function extractWeeklyHoursFromText(text: string): number | undefined {
  const normalized = text.replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit).toString());
  const match = normalized.match(/(\d{1,2})\s*ساع(?:ة|ات)?/);
  if (match) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 40) return value;
  }
  const bare = normalized.match(/\b(20|25|15|12|10|8|5|3|2)\b/);
  if (bare) return Number(bare[1]);
  return undefined;
}

function buildMockSummary(userText: string, currentLevel: string, goal: string): string {
  if (/انجل|english|b2|لغه/i.test(userText)) {
    return `ملفك يعبّر عن متعلّم يركّز على اللغة الإنجليزية (${LEVEL_LABELS[currentLevel] ?? currentLevel}) ضمن ${GOAL_LABELS[goal] ?? goal}.`;
  }

  return `ملفك يعبّر عن متعلّم ${LEVEL_LABELS[currentLevel] ?? currentLevel} يسعى إلى ${GOAL_LABELS[goal] ?? goal}، مع جاهزية للبدء بمسار عملي يناسب وقتك.`;
}

export function mockPlanningExtraction(
  message: string,
  currentPreferences: PlanningPreferences,
): PlanningExtraction {
  return extractPlanningAnswerFallback(message, currentPreferences);
}

function normalizeAssistantQuestion(question: string) {
  return question
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه");
}

/** أسئلة عن قدرات نور / خدماتها — قبل مطابقة كلمات مثل «ساع» داخل «تساعد». */
export function isNoorCapabilitiesQuestion(question: string): boolean {
  const q = normalizeAssistantQuestion(question);
  return (
    /خدم/.test(q) ||
    /تساعد/.test(q) ||
    /ساعدني/.test(q) ||
    /ساعديني/.test(q) ||
    /ممكن تساعد/.test(q) ||
    /وش تسو/.test(q) ||
    /ماذا تفعل/.test(q) ||
    /ايش تسو/.test(q) ||
    /كيف تساعد/.test(q) ||
    /وش تقدري/.test(q) ||
    /ماذا تقدمي/.test(q) ||
    /قدراتك/.test(q) ||
    /ادوارك/.test(q)
  );
}

export function isNoorNameQuestion(question: string): boolean {
  const q = normalizeAssistantQuestion(question);
  return /اسمك/.test(q) || /ليش نور/.test(q) || /لماذا نور/.test(q) || /من هي نور/.test(q);
}

/** طلب توصية دورة شخصية / حسب الملف. */
export function isCourseRecommendationQuestion(question: string): boolean {
  const q = normalizeAssistantQuestion(question);
  return (
    /مناسب/.test(q) ||
    /توصي/.test(q) ||
    /اقترح/.test(q) ||
    /ملفي/.test(q) ||
    /بناء على ملف/.test(q) ||
    /حسب ملفي/.test(q) ||
    /حسب الملف/.test(q) ||
    /الدوره المناسب/.test(q) ||
    /دوره لي/.test(q) ||
    /دوره تناسب/.test(q) ||
    /وش اخذ/.test(q) ||
    /ايش اخذ/.test(q) ||
    /ماذا اتعلم/.test(q)
  );
}

function buildCourseRecommendationReply(context: AssistantContext, courseCount: number): string {
  const recs = context.recommendedCourses ?? [];
  if (recs.length > 0) {
    const topic = context.learningTopic ? ` لمجال «${context.learningTopic}»` : "";
    const lines = recs.map((course, index) => {
      const meta = [course.levelLabel, course.hours ? `${course.hours} س` : null, course.specialty]
        .filter(Boolean)
        .join(" · ");
      const reason = course.reason ? ` — ${course.reason}` : "";
      return `${index + 1}. «${course.title}»${meta ? ` (${meta})` : ""}${reason}\n   ${coursePagePhrase(course.title)}`;
    });
    return `حسب ملفك التعليمي${topic}، أنصحك بالبدء بهذه الدورات:\n${lines.join("\n")}\n\nاختر واحدة وافتحها من ${pagePhrase("courses")}، أو قلّي نبني خطة من ${pagePhrase("noor")}.`;
  }

  if (context.learningTopic) {
    return `من ملفك أنت مهتم بـ «${context.learningTopic}». تصفّح الدورات المطابقة من ${pagePhrase("courses")} — أو اسألني عن مهارة أدق داخل المجال. لدينا ${courseCount} دورة في الفهرس.`;
  }

  return `لإقتراح دورة مناسبة أحتاج ملفك التعليمي. أكمل أو راجع ${pagePhrase("interview")}، أو اذكر مجالك مباشرة (إنجليزي، برمجة، قانون…). لدينا ${courseCount} دورة.`;
}

function buildNoorCapabilitiesReply(courseCount: number): string {
  return `أقدر أساعدك في:
1. شرح المنصة وتوجيهك للصفحات المناسبة (${mainPagesListAr()}).
2. اقتراح دورات ومدربين من الفهرس (${courseCount} دورة) حسب هدفك.
3. بناء خطة تعلّم منظمة معك في ${pagePhrase("noor")} ثم اعتمادها في ${pagePhrase("goals")} و ${pagePhrase("path")}.
4. متابعة أهدافك ومسارك وإنجازاتك.
5. شرح المحفظة وباقات الساعات وكيفية شراء درس أو دورة من ${pagePhrase("wallet")}.
6. جلسات مراجعة قصيرة بعد كل درس من ${pagePhrase("review")}.

قل لي هدفك أو اسأل عن دورة/مدرب/صفحة — وأبدأ معك مباشرة.`;
}

export function mockAssistantReply(question: string, context: AssistantContext): string {
  const q = normalizeAssistantQuestion(question);
  const catalog = getCourseCatalogForAi();

  if (isNoorNameQuestion(question)) {
    return `اسمي نور — مرشدتك التعليمية في ${SITE.name}. أساعدك في اختيار الدورات، بناء خطتك، وتوجيهك داخل المنصة.`;
  }

  if (isNoorCapabilitiesQuestion(question)) {
    return buildNoorCapabilitiesReply(catalog.length);
  }

  if (!context.isAuthenticated) {
    if (
      q.includes("ساعات") ||
      q.includes("ساعه") ||
      q.includes("اقتصاد") ||
      q.includes("محفظ")
    ) {
      return `في ${SITE.name} تشتري رصيدًا من الساعات في ${pagePhrase("wallet")} — لا دورة كاملة. تستكشف المدربين والدورات بحرية. سجّل من ${pagePhrase("register")} ثم أكمل ${pagePhrase("interview")}.`;
    }
    return `أهلًا! أنا نور في ${SITE.name}. لدينا ${catalog.length} دورة في 13 تخصصًا. سجّل، أكمل المقابلة، اشترِ ساعات، واستكشف. ما الذي تريد معرفته؟`;
  }

  if (!context.interviewCompleted) {
    return `الخطوة التالية: أكمل ${pagePhrase("interview")} — نفهم أهدافك ونقترح دورات ومدربين من فهرس المنصة.`;
  }

  if (isCourseRecommendationQuestion(question)) {
    return buildCourseRecommendationReply(context, catalog.length);
  }

  if (
    context.userContextSummary &&
    (q.includes("مساري") ||
      q.includes("مسار التعل") ||
      q.includes("التقدم") ||
      q.includes("تقدمي") ||
      q.includes("تقدمك") ||
      q.includes("رصيد"))
  ) {
    return `حسب سجلك:\n${context.userContextSummary.slice(0, 280)}…\nللتفاصيل: ${pagePhrase("account")} أو ${pagePhrase("wallet")}.`;
  }

  if (q.includes("خطه") || q.includes("خطة")) {
    return `لبناء خطة منظمة: افتح ${pagePhrase("noor")} — نجمع تفضيلاتك، تختار دورات من الفهرس، ثم تعتمد الخطة في ${pagePhrase("goals")} و ${pagePhrase("path")}.`;
  }

  if (q.includes("دور") || q.includes("تخص") || q.includes("course") || q.includes("عقد")) {
    const match =
      catalog.find((course) => q.includes(course.slug.replace(/-/g, " "))) ??
      catalog.find(
        (course) =>
          q.includes(course.title.slice(0, 8)) ||
          (q.includes("عقد") && course.slug === "contracts-101"),
      );
    if (match) {
      return `«${match.title}» — ${match.specialty}، ${match.levelLabel}، ${match.hours} ساعة، المدرب ${match.trainerName}. ${coursePagePhrase(match.title)}.`;
    }
    // سؤال عام عن الدورات بدون تحديد — وجّه للتوصية الشخصية إن وُجدت
    if (context.recommendedCourses?.length) {
      return buildCourseRecommendationReply(context, catalog.length);
    }
    return `لدينا ${catalog.length} دورة — تصفّح ${pagePhrase("courses")} أو اسأل «ما الدورة المناسبة لي؟» لأعتمد على ملفك، أو اذكر مجالًا (إنجليزي، برمجة، قانون).`;
  }

  if (q.includes("مدرب") || q.includes("trainer")) {
    const match = catalog.find((course) => q.includes(course.trainerName.split(" ")[1] ?? ""));
    if (match) {
      return `المدرب ${match.trainerName} — ملفه من ${pagePhrase("trainers")}، ودورة مرتبطة: «${match.title}».`;
    }
    return `تصفّح ملفات المدربين من ${pagePhrase("courses")} أو ${pagePhrase("trainers")} — كل دورة تعرض مدربها.`;
  }

  if (q.includes("مراج") || q.includes("review") || q.includes("اختبار")) {
    return `بعد إكمال كل درس في ${pagePhrase("learn")} تُفتح ${pagePhrase("review")} — أسئلة واختبار 4 أسئلة معي.`;
  }

  if (
    q.includes("ساعات") ||
    q.includes("ساعه") ||
    q.includes("محفظ") ||
    q.includes("باق") ||
    q.includes("اشتري") ||
    q.includes("شراء") ||
    q.includes("اشتر")
  ) {
    return `اشترِ ساعات من ${pagePhrase("wallet")} — باقة الاستكشاف 5 س (89 ر.س)، النمو 15 س، التركيز 30 س. من صفحة الدورة: شراء درس أو دورة كاملة.`;
  }

  if (q.includes("صفح") || q.includes("وين") || q.includes("اين")) {
    return `الصفحات الرئيسية: ${mainPagesListAr()}.`;
  }

  return `بخصوص «${question.slice(0, 50)}»: اسأل عن دورة، مدرب، محفظة، أو صفحة — أو قل «وش تقدري تساعديني فيه؟» لمعرفة خدماتي. لدي معرفة كاملة بالمنصة (${catalog.length} دورة).`;
}

export function mockReviewReply(question: string, lessonTitle: string): string {
  const q = question.toLowerCase();
  if (q.includes("لخص") || q.includes("ملخص")) {
    return `باختصار، درس «${lessonTitle}» يركّز على المفاهيم الأساسية مع مثال تطبيقي. راجع النقاط الرئيسية في نهاية الدرس قبل الانتقال للتالي.`;
  }
  if (q.includes("مثال") || q.includes("فهم")) {
    return `في «${lessonTitle}»، المثال يوضّح كيف تطبّق الفكرة عمليًا. جرّب إعادة الخطوات بنفسك — وإن بقي غموض، راجع المقطع أو اسأل المدرب في الجلسة المباشرة.`;
  }
  return `بخصوص «${lessonTitle}»: سؤالك عن «${question.slice(0, 60)}» مهم. ركّز على الفكرة الأساسية، طبّقها بمثال بسيط، ثم راجع ملخص الدرس.`;
}

export function mockReviewQuiz(lessonTitle: string): import("@/types/review").ReviewQuizQuestion[] {
  return [
    {
      id: "q1",
      question: `ما الهدف الرئيسي من درس «${lessonTitle}»؟`,
      options: [
        "فهم المفاهيم الأساسية للموضوع",
        "حفظ تعريفات دون فهم",
        "تخطّي التطبيق العملي",
        "الانتقال لدورة أخرى مباشرة",
      ],
      correctIndex: 0,
      explanation: "الدرس يهدف لبناء فهم أساسي قابل للتطبيق.",
    },
    {
      id: "q2",
      question: "أي خطوة تلي شرح المفاهيم في الدرس؟",
      options: ["تمرين تطبيقي", "اختبار نهائي", "شراء درس جديد", "إغلاق المنصة"],
      correctIndex: 0,
      explanation: "بعد الشرح يأتي تطبيق عملي لتثبيت الفهم.",
    },
    {
      id: "q3",
      question: "ماذا ينصح به الملخص في نهاية الدرس؟",
      options: ["مراجعة النقاط الرئيسية", "نسيان المحتوى", "تخطّي المراجعة", "إلغاء التسجيل"],
      correctIndex: 0,
      explanation: "الملخص يساعد على تثبيت ما تعلّمته.",
    },
    {
      id: "q4",
      question: "إذا لم يتضح جزء من الدرس، ما الخيار الأنسب؟",
      options: [
        "مراجعة الدرس أو سؤال المدرب",
        "تجاهل الموضوع",
        "الإجابة عشوائيًا في الاختبار",
        "إيقاف التعلّم نهائيًا",
      ],
      correctIndex: 0,
      explanation: "المراجعة أو المدرب هما الطريق الصحيح للفهم.",
    },
  ];
}

export { PROFILE_READY_MARKER };
