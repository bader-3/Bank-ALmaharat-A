import { describe, expect, it } from "vitest";
import {
  createPlanningSession,
  extractPlanningAnswerFallback,
  extractPlanningPreferencesFallback,
  getMissingPlanningKey,
  getNextPlanningQuestion,
  getPlanningCompleteness,
  getPlanningRepromptMessage,
  getPlanningStage,
  planningPreferencesFromProfile,
  PLANNING_QUESTIONNAIRE_VERSION,
  updatePlanningSession,
  upgradePlanningQuestionnaire,
  validatePlanningExtraction,
} from "@/lib/ai/planning";
import {
  mockAssistantReply,
  mockInterviewReply,
  PROFILE_READY_MARKER,
} from "@/lib/ai/mock-fallback";
import type { AiChatMessage } from "@/types/ai";
import type { PlanningPreferences } from "@/types/noor";

const completePreferences: PlanningPreferences = {
  goal: "الحصول على وظيفة",
  domain: "تطوير الويب",
  currentLevel: "beginner",
  priorExperience: "لا توجد خبرة",
  weeklyHours: 6,
  durationWeeks: 8,
  availableDays: ["السبت", "الثلاثاء"],
  preferredTimes: ["مساءً"],
  deliveryModes: ["recorded"],
  budgetHours: 20,
};

describe("استخراج تفضيلات التخطيط والتحقق منها", () => {
  it("يفهم الأرقام العربية والمدة والأيام والنمط والميزانية", () => {
    const result = extractPlanningPreferencesFallback(
      "أريد تعلم البرمجة للحصول على وظيفة. أنا مبتدئ بدون خبرة، ٦ ساعات أسبوعياً لمدة شهرين، السبت والثلاثاء مساءً، أفضل المسجل وميزانيتي ٢٠ ساعة",
    );

    expect(result).toMatchObject({
      goal: "هدف مهني أو الحصول على وظيفة",
      currentLevel: "beginner",
      priorExperience: "لا توجد خبرة سابقة",
      weeklyHours: 6,
      durationWeeks: 8,
      availableDays: ["السبت", "الثلاثاء"],
      preferredTimes: ["مساءً"],
      deliveryModes: ["recorded"],
      budgetHours: 20,
    });
  });

  it("يستخدم سياق السؤال الحالي ولا يحوّل سؤال المستخدم إلى إجابة", () => {
    const current: PlanningPreferences = { goal: "وظيفة", deliveryModes: [] };
    expect(extractPlanningAnswerFallback("تطوير الويب", current).domain).toBe("تطوير الويب");
    expect(extractPlanningAnswerFallback("ما المجال المناسب؟", current)).toEqual({});
  });

  it("يفهم أيامًا متعددة مفصولة بـ و", () => {
    const current: PlanningPreferences = {
      ...completePreferences,
      availableDays: undefined,
    };
    expect(extractPlanningAnswerFallback("الأحد والثلاثاء", current).availableDays).toEqual([
      "الأحد",
      "الثلاثاء",
    ]);
  });

  it("يرفض القيم غير الصالحة ويحافظ على رصيد الصفر", () => {
    expect(
      validatePlanningExtraction({
        goal: " ",
        currentLevel: "expert",
        weeklyHours: -2,
        durationWeeks: 999,
        availableDays: ["السبت", "", 7],
        deliveryModes: ["recorded", "telepathy", "recorded"],
        walletBalanceHours: 0,
      }),
    ).toEqual({
      availableDays: ["السبت"],
      walletBalanceHours: 0,
      deliveryModes: ["recorded"],
    });
  });
});

describe("مراحل workflow", () => {
  it("ينتقل بالترتيب من الهدف حتى اختيار الدورات", () => {
    expect(getPlanningStage({ deliveryModes: [] })).toBe("goal");
    expect(getPlanningStage({ goal: "وظيفة", deliveryModes: [] })).toBe("domain");
    expect(getPlanningStage({ ...completePreferences, budgetHours: undefined })).toBe("budget");
    expect(getPlanningStage(completePreferences)).toBe("course_selection");
    expect(getMissingPlanningKey(completePreferences)).toBeNull();
    expect(getPlanningCompleteness(completePreferences)).toEqual({
      completed: 8,
      total: 8,
      percent: 100,
    });
  });

  it("لا يعتبر رصيد المحفظة إجابة عن ميزانية الخطة", () => {
    const preferences = {
      ...completePreferences,
      budgetHours: undefined,
      walletBalanceHours: 25,
    };

    expect(getMissingPlanningKey(preferences)).toBe("budgetHours");
    expect(getNextPlanningQuestion(preferences)).toContain("رصيدك الحالي 25 ساعة");
  });

  it("يدعم جلسة زائر ويحدّث حالتها عند اكتمال الملف", () => {
    const guest = createPlanningSession("guest");
    const updated = updatePlanningSession(guest, completePreferences);

    expect(guest.ownerId).toBe("guest");
    expect(guest.status).toBe("collecting_preferences");
    expect(updated.stage).toBe("course_selection");
    expect(updated.status).toBe("course_selection");
  });

  it("يعيد الجلسات القديمة إلى أول سؤال بدل القفز إلى الأيام", () => {
    const legacy = {
      ...createPlanningSession("u1", {
        ...completePreferences,
        availableDays: undefined,
      }),
      questionnaireVersion: undefined,
    };
    const upgraded = upgradePlanningQuestionnaire(legacy);

    expect(upgraded.questionnaireVersion).toBe(PLANNING_QUESTIONNAIRE_VERSION);
    expect(upgraded.preferences.walletBalanceHours).toBeUndefined();
    expect(getMissingPlanningKey(upgraded.preferences)).toBe("goal");
  });

  it("يعيد صياغة السؤال عند الإجابة غير الواضحة", () => {
    const reprompt = getPlanningRepromptMessage(
      { goal: "وظيفة", domain: "برمجة", deliveryModes: [] },
      "ايوب",
    );
    expect(reprompt).toContain("لم أفهم");
    expect(reprompt).toContain("مستواك");
  });

  it("يتعامل مع ملف مقابلة ناقص دون اختلاق قيم", () => {
    const preferences = planningPreferencesFromProfile({
      userId: "u1",
      answers: {
        goal: "",
        currentLevel: "",
        priorExperience: "",
        weeklyHours: "",
        learningPreference: "recorded",
        budgetOrHours: "",
      },
      summary: "",
      suggestedSkills: [],
      suggestedPath: "",
      completedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(preferences.weeklyHours).toBeUndefined();
    expect(preferences.durationWeeks).toBeUndefined();
    expect(getPlanningStage(preferences)).toBe("goal");
  });
});

describe("fallback للمساعد", () => {
  it("يوجّه الزائر والملف غير المكتمل بوضوح", () => {
    expect(
      mockAssistantReply("كيف أشتري ساعات؟", { isAuthenticated: false }),
    ).toContain("التسجيل");
    expect(
      mockAssistantReply("أريد خطة", {
        isAuthenticated: true,
        interviewCompleted: false,
      }),
    ).toContain("المقابلة الذكية");
  });

  it("يجيب عن قدرات نور بدل المحفظة أو الملف", () => {
    const auth = {
      isAuthenticated: true,
      interviewCompleted: true,
      userContextSummary: "متعلّم مبتدئ يركّز على الإنجليزية المهنية.",
    };
    const help = mockAssistantReply("عندي سؤالين وش ممكن تساعديني فيه ؟", auth);
    expect(help).toContain("أقدر أساعدك");
    expect(help).toContain("محادثة نور");
    expect(help).not.toContain("/noor");
    expect(help).not.toContain("/courses");
    expect(help).not.toContain("باقة الاستكشاف");

    const services = mockAssistantReply("وش الخدمات الي تقدمينها ؟", auth);
    expect(services).toContain("أقدر أساعدك");
    expect(services).not.toContain("حسب سجلك");
    expect(services).not.toContain("/wallet");

    const name = mockAssistantReply("ليش اسمك نور ؟", auth);
    expect(name).toContain("اسمي نور");
  });

  it("يقترح دورات من الملف بدل الرد العام", () => {
    const auth = {
      isAuthenticated: true,
      interviewCompleted: true,
      learningTopic: "اللغات",
      specialtyId: "languages",
      recommendedCourses: [
        {
          slug: "english-for-work",
          title: "الإنجليزية المهنية للتواصل",
          reason: "تناسب هدفك في التواصل المهني",
          specialty: "اللغات",
          levelLabel: "مبتدئ",
          hours: 12,
        },
      ],
    };

    const suitable = mockAssistantReply("ما الدورة المناسبة لي؟", auth);
    expect(suitable).toContain("الإنجليزية المهنية للتواصل");
    expect(suitable).toContain("صفحة دورة");
    expect(suitable).not.toContain("/courses/");
    expect(suitable).not.toContain("تصفّح /courses أو اسأل عن مجال");

    const fromProfile = mockAssistantReply("بناء على ملفي", auth);
    expect(fromProfile).toContain("حسب ملفك");
    expect(fromProfile).toContain("الإنجليزية المهنية للتواصل");
  });

  it("يحافظ على تسلسل المقابلة ولا ينهيها قبل تأكيد المحاور", () => {
    const answers = [
      "أريد تغيير مساري المهني",
      "مبتدئ",
      "لا توجد خبرة",
      "خمس ساعات",
      "كلتاهما",
      "عشر ساعات تعليمية",
    ];
    const history: AiChatMessage[] = [{ role: "user", text: "ابدأ المقابلة" }];

    expect(mockInterviewReply(history)).toContain("الهدف");
    for (const answer of answers) {
      history.push({ role: "user", text: answer });
    }

    const confirmationQuestion = mockInterviewReply(history);
    expect(confirmationQuestion).toContain("هل هذه المعلومات صحيحة");
    expect(confirmationQuestion).not.toContain(PROFILE_READY_MARKER);

    history.push({ role: "user", text: "نعم، صحيحة" });
    expect(mockInterviewReply(history)).toContain(PROFILE_READY_MARKER);
  });
});
