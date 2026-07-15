import type { AssistantContext } from "@/lib/ai/prompts";
import { alignGeneratedProfileWithCatalog } from "@/lib/ai/align-profile-recommendations";
import { getCourseCatalogForAi } from "@/lib/ai/platform-knowledge";
import { GOAL_LABELS, LEVEL_LABELS } from "@/lib/interview/labels";
import { SITE } from "@/lib/constants";
import { getRecommendedPackageId } from "@/lib/wallet/packages";
import type { AiChatMessage, AiGeneratedProfile } from "@/types/ai";
import {
  extractPlanningAnswerFallback,
  type PlanningExtraction,
} from "@/lib/ai/planning";
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

export function mockProfileFromConversation(messages: AiChatMessage[]): AiGeneratedProfile {
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

  const answers = {
    goal,
    currentLevel,
    priorExperience: userText.includes("لا") && userText.includes("خبر") ? "none" : "some",
    weeklyHours: "3-5",
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

export function mockAssistantReply(question: string, context: AssistantContext): string {
  const q = question.toLowerCase();
  const catalog = getCourseCatalogForAi();

  if (!context.isAuthenticated) {
    if (q.includes("ساع") || q.includes("اقتصاد") || q.includes("محفظ")) {
      return `في ${SITE.name} تشتري رصيدًا من الساعات في محفظتك (/wallet) — لا دورة كاملة. تستكشف مدربين (/trainers) ودورات (/courses) بحرية. سجّل من /register ثم أكمل /interview.`;
    }
    return `أهلًا! أنا نور في ${SITE.name}. لدينا ${catalog.length} دورة في 13 تخصصًا. سجّل، أكمل المقابلة، اشترِ ساعات، واستكشف. ما الذي تريد معرفته؟`;
  }

  if (!context.interviewCompleted) {
    return "الخطوة التالية: أكمل المقابلة الذكية في /interview — نفهم أهدافك ونقترح دورات ومدربين من فهرس المنصة.";
  }

  if (context.userContextSummary && (q.includes("مسار") || q.includes("تقدم") || q.includes("رصيد"))) {
    return `حسب سجلك:\n${context.userContextSummary.slice(0, 280)}…\nللتفاصيل: /account أو /wallet.`;
  }

  if (q.includes("خطة") || q.includes("خطه")) {
    return "لبناء خطة منظمة: افتح /noor — نجمع تفضيلاتك، تختار دورات من الفهرس، ثم تعتمد الخطة في /goals و /path.";
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
      return `«${match.title}» (${match.slug}) — ${match.specialty}، ${match.levelLabel}، ${match.hours} ساعة، المدرب ${match.trainerName}. التفاصيل: /courses/${match.slug}`;
    }
    return `لدينا ${catalog.length} دورة — تصفّح /courses أو اسأل عن مجال (مثل: إنجليزي، برمجة، قانون).`;
  }

  if (q.includes("مدرب") || q.includes("trainer")) {
    const match = catalog.find((course) => q.includes(course.trainerName.split(" ")[1] ?? ""));
    if (match) {
      return `المدرب ${match.trainerName} — ملفه: /trainers/${match.trainerId}، دورة مرتبطة: «${match.title}».`;
    }
    return "تصفّح ملفات المدربين من /courses أو /trainers — كل دورة تعرض مدربها.";
  }

  if (q.includes("مراج") || q.includes("review") || q.includes("اختبار")) {
    return "بعد إكمال كل درس في /learn تُفتح جلسة مراجعة (/review) — أسئلة واختبار 4 أسئلة معي.";
  }

  if (q.includes("ساع") || q.includes("محفظ") || q.includes("شر") || q.includes("باق")) {
    return "اشترِ ساعات من /wallet — باقة الاستكشاف 5 س (89 ر.س)، النمو 15 س، التركيز 30 س. في صفحة الدورة: شراء درس أو دورة كاملة.";
  }

  if (q.includes("صفح") || q.includes("وين") || q.includes("أين")) {
    return "الصفحات الرئيسية: /courses دورات، /wallet محفظة، /goals أهداف، /path مسار، /activity سجل، /noor محادثتي، /account حسابك.";
  }

  return `بخصوص «${question.slice(0, 50)}»: اسأل عن دورة، مدرب، محفظة، أو صفحة — لدي معرفة كاملة بالمنصة (${catalog.length} دورة).`;
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
