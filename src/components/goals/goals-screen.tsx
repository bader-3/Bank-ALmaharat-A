"use client";

import { MonthlyCalendar } from "@/components/goals/monthly-calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  IconArrow,
  IconBook,
  IconCheck,
  IconClock,
  IconFile,
  IconFlame,
  IconPlus,
  IconSparkle,
  IconTarget,
} from "@/components/ui/icons";
import { useRequireAuth } from "@/hooks/use-auth-redirect";
import { computeStreak } from "@/lib/goals/streak";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { useAuth } from "@/providers/auth-provider";
import { getGoalsService, toDateKey } from "@/services/goals";
import { getInterviewService } from "@/services/interview";
import { getRemindersService } from "@/services/reminders";
import type { GoalInput, GoalPlan, LearningGoal } from "@/types/goals";
import type { LearningProfile } from "@/types/interview";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

const EMPTY_PLAN: GoalPlan = { goals: [] };

export function GoalsScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isAuthenticated } = useRequireAuth();
  const goalsService = useMemo(() => getGoalsService(), []);
  const remindersService = useMemo(() => getRemindersService(), []);
  const today = toDateKey(new Date());

  const [plan, setPlan] = useState<GoalPlan>(EMPTY_PLAN);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [, setRemindersVersion] = useState(0);
  const [browserStatus, setBrowserStatus] = useState(() => ({
    supported: false,
    permission: "default",
    enabled: false,
  }));

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [nextPlan, nextProfile] = await Promise.all([
      goalsService.getPlan(user.id),
      getInterviewService().getProfile(user.id),
    ]);
    setPlan(nextPlan);
    setProfile(nextProfile);
    setLoading(false);
  }, [user, goalsService]);

  useEffect(() => {
    if (!user) return;
    if (!user.interviewCompleted) {
      router.replace(ROUTES.interview);
      return;
    }
    void load();
  }, [user, router, load]);

  useEffect(() => {
    if (!user) return;
    setBrowserStatus(remindersService.getBrowserStatus(user.id));
    remindersService.notifyDue(user.id, plan.goals);
  }, [user, plan.goals, remindersService]);

  const selectedGoals = useMemo(
    () =>
      plan.goals
        .filter((goal) => goal.scheduledDate === selectedDate)
        .sort((a, b) => Number(Boolean(a.completedAt)) - Number(Boolean(b.completedAt))),
    [plan.goals, selectedDate],
  );
  const todayGoals = plan.goals.filter((goal) => goal.scheduledDate === today);
  const todayCompleted = todayGoals.filter((goal) => goal.completedAt).length;
  const completionPercent =
    todayGoals.length > 0 ? Math.round((todayCompleted / todayGoals.length) * 100) : 0;
  const learningMinutes = todayGoals.reduce((sum, goal) => sum + goal.durationMinutes, 0);
  const streakDays = useMemo(() => computeStreak(plan.goals, today), [plan.goals, today]);
  const reminders = user ? remindersService.getReminders(user.id, plan.goals) : [];

  async function enableBrowserNotifications() {
    if (!user) return;
    await remindersService.requestBrowserPermission(user.id);
    setBrowserStatus(remindersService.getBrowserStatus(user.id));
    remindersService.notifyDue(user.id, plan.goals);
  }

  async function handleToggle(goalId: string) {
    if (!user) return;
    await goalsService.toggleComplete(user.id, goalId);
    await load();
  }

  async function handleDelete(goal: LearningGoal) {
    if (!user || !window.confirm(`هل تريد حذف هدف «${goal.title}»؟`)) return;
    await goalsService.remove(user.id, goal.id);
    await load();
  }

  async function handleSave(input: GoalInput) {
    if (!user) return;
    setSaving(true);
    if (editingGoal) {
      await goalsService.update(user.id, editingGoal.id, input);
    } else {
      await goalsService.add(user.id, input);
    }
    setSaving(false);
    setEditingGoal(null);
    setShowForm(false);
    setSelectedDate(input.scheduledDate);
    await load();
  }

  if (authLoading || !isAuthenticated || !user || loading) {
    return (
      <Container className="py-24">
        <p className="type-body text-center text-foreground-muted">جاري تجهيز أهدافك…</p>
      </Container>
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <IconSparkle size={18} className="text-gold-500" />
            <p className="text-xs font-semibold tracking-wide text-sage-600">خطة يومية تتكيّف معك</p>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-navy-900 lg:text-4xl">أهدافي الذكية</h1>
          <p className="mt-2 max-w-2xl text-pretty text-foreground-secondary">
            أنجز خطوات صغيرة كل يوم، وتابع تقدّمك في التقويم الشهري.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGoal(null);
            setShowForm(true);
          }}
        >
          <IconPlus size={18} />
          إضافة هدف
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="أهداف اليوم"
          value={`${todayGoals.length} أهداف`}
          icon={<IconTarget size={20} />}
          accent="blue"
        />
        <SummaryCard
          label="تم إنجازه"
          value={`${todayCompleted} أهداف`}
          icon={<IconCheck size={20} />}
          accent="green"
        />
        <SummaryCard
          label="وقت التعلم اليوم"
          value={`${learningMinutes.toLocaleString("ar-SA")} دقيقة`}
          icon={<IconClock size={20} />}
          accent="orange"
        />
        <SummaryCard
          label="سلسلة الإنجاز"
          value={`${streakDays.toLocaleString("ar-SA")} ${streakDays === 1 ? "يوم" : "أيام"}`}
          icon={<IconFlame size={20} />}
          accent="purple"
        />
      </div>

      <Card padding="md" className="mt-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sage-50 text-2xl">
            🌿
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground-muted">إنجاز اليوم</p>
                <p className="mt-1 text-base font-semibold text-navy-900">
                  {todayCompleted} من {todayGoals.length} أهداف
                </p>
              </div>
              <span className="text-2xl font-bold text-sage-600">{completionPercent}٪</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-background-muted">
              <div
                className="h-full rounded-full bg-sage-500 transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
          {completionPercent === 100 && todayGoals.length > 0 && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-500 text-white">
              <IconCheck size={20} />
            </span>
          )}
        </div>
      </Card>

      <Card padding="md" className="mt-5 border-gold-200/60 bg-gold-50/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gold-700">مركز التذكيرات</p>
            <h2 className="mt-1 text-lg font-semibold text-navy-900">مواعيد التعلّم القادمة</h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              تظهر التذكيرات هنا دائمًا. إشعارات المتصفح اختيارية ولا نطلب إذنها تلقائيًا.
            </p>
          </div>
          {browserStatus.supported && browserStatus.permission !== "denied" && !browserStatus.enabled && (
            <Button size="sm" variant="secondary" onClick={() => void enableBrowserNotifications()}>
              تفعيل إشعارات المتصفح
            </Button>
          )}
          {browserStatus.enabled && <Badge variant="sage">إشعارات المتصفح مفعّلة</Badge>}
          {browserStatus.permission === "denied" && (
            <Badge variant="neutral">الإشعارات محظورة من إعدادات المتصفح</Badge>
          )}
        </div>
        {reminders.length ? (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {reminders.slice(0, 4).map((reminder) => (
              <li
                key={reminder.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">{reminder.title}</p>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {formatDate(reminder.scheduledDate)} · {reminder.startTime}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-foreground-muted hover:text-foreground"
                  onClick={() => {
                    if (!user) return;
                    remindersService.dismiss(user.id, reminder.id);
                    setRemindersVersion((value) => value + 1);
                  }}
                >
                  إخفاء
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-foreground-muted">لا توجد تذكيرات قادمة حاليًا.</p>
        )}
      </Card>

      {showForm && (
        <GoalForm
          goal={editingGoal}
          defaultDate={editingGoal?.scheduledDate ?? selectedDate}
          saving={saving}
          onSubmit={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingGoal(null);
          }}
        />
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_44rem]">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-foreground-muted">
                {selectedDate === today ? "اليوم" : "اليوم المحدد"}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-navy-900">{formatDate(selectedDate)}</h2>
            </div>
            {selectedDate !== today && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="text-sm text-sage-600 hover:underline"
              >
                العودة لأهداف اليوم
              </button>
            )}
          </div>

          {selectedGoals.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {selectedGoals.map((goal) => (
                <GoalItem
                  key={goal.id}
                  goal={goal}
                  onToggle={() => void handleToggle(goal.id)}
                  onEdit={() => {
                    setEditingGoal(goal);
                    setShowForm(true);
                    window.scrollTo({ top: 260, behavior: "smooth" });
                  }}
                  onDelete={() => void handleDelete(goal)}
                />
              ))}
            </ul>
          ) : (
            <Card padding="lg" className="mt-5 text-center">
              <p className="text-lg font-semibold text-navy-900">لا توجد أهداف لهذا اليوم</p>
              <p className="mt-2 text-foreground-secondary">
                أضف هدفًا شخصيًا أو اختر يومًا آخر من التقويم.
              </p>
              <Button
                size="sm"
                className="mt-5"
                onClick={() => {
                  setEditingGoal(null);
                  setShowForm(true);
                }}
              >
                <IconPlus size={16} />
                إضافة هدف لهذا اليوم
              </Button>
            </Card>
          )}

          {selectedGoals.length > 0 && (
            <button
              type="button"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-sage-600 hover:underline"
            >
              عرض كل الأهداف
              <IconArrow size={16} />
            </button>
          )}

          {!plan.acceptedPlanKey && profile?.learningPlan && (
            <Card padding="lg" className="mt-5 border-sage-200/60 bg-sage-50/40">
              <p className="text-xs font-semibold text-sage-600">خطة المساعد جاهزة</p>
              <h3 className="mt-2 text-lg font-semibold text-navy-900">
                اعتمد خطتك لإضافة أهداف يومية تلقائيًا
              </h3>
              <p className="mt-2 text-foreground-secondary">
                ستبقى أهدافك الشخصية محفوظة، وسيضيف المساعد خطوات الخطة إلى التقويم.
              </p>
              <Button href={ROUTES.account} size="sm" className="mt-5">
                مراجعة الخطة واعتمادها
              </Button>
            </Card>
          )}
        </section>

        <aside className="grid gap-4 md:grid-cols-2 xl:sticky xl:top-24 xl:self-start">
          <MonthlyCalendar
            goals={plan.goals}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <WeeklyGoals
            goals={plan.goals}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </aside>
      </div>
    </Container>
  );
}

function WeeklyGoals({
  goals,
  selectedDate,
  onSelectDate,
}: {
  goals: LearningGoal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const selected = parseDateKey(selectedDate);
  const weekStart = new Date(selected);
  weekStart.setDate(selected.getDate() - selected.getDay());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = toDateKey(date);
    return {
      date,
      key,
      goals: goals
        .filter((goal) => goal.scheduledDate === key)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    };
  });

  return (
    <Card padding="md">
      <div>
        <p className="text-xs font-semibold text-sage-600">العرض الأسبوعي</p>
        <h3 className="mt-1 font-semibold text-navy-900">
          {weekStart.toLocaleDateString("ar-SA", { day: "numeric", month: "long" })}
        </h3>
      </div>
      <div className="mt-4 space-y-2">
        {days.map(({ date, key, goals: dayGoals }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectDate(key)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-2.5 text-start transition-colors",
              key === selectedDate
                ? "border-sage-300 bg-sage-50"
                : "border-border/60 hover:bg-background-subtle",
            )}
          >
            <span className="w-14 shrink-0 text-xs font-medium text-foreground-muted">
              {date.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric" })}
            </span>
            <span className="min-w-0 flex-1">
              {dayGoals.length ? (
                dayGoals.map((goal) => (
                  <span key={goal.id} className="mb-1 block truncate text-xs text-foreground-secondary">
                    {goal.startTime} · {goal.title}
                  </span>
                ))
              ) : (
                <span className="text-xs text-foreground-muted">لا توجد دروس</span>
              )}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function GoalItem({
  goal,
  onToggle,
  onEdit,
  onDelete,
}: {
  goal: LearningGoal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const GoalIcon = goal.courseSlug ? IconBook : goal.source === "ai" ? IconBook : IconFile;

  return (
    <li>
      <Card
        padding="md"
        className={cn(
          "flex items-start gap-4 transition-all hover:shadow-md",
          goal.completedAt && "opacity-70",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            goal.completedAt
              ? "border-sage-500 bg-sage-500 text-white"
              : "border-border hover:border-sage-400 hover:bg-sage-50",
          )}
          aria-label={goal.completedAt ? "إلغاء إنجاز الهدف" : "تحديد الهدف كمنجز"}
        >
          {goal.completedAt && <IconCheck size={14} />}
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background-subtle text-foreground-muted">
          <GoalIcon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-semibold text-navy-900",
                goal.completedAt && "line-through opacity-70",
              )}
            >
              {goal.title}
            </p>
            <Badge variant={goal.source === "ai" ? "sage" : "blue"}>
              {goal.source === "ai" ? "من المسار" : "هدف شخصي"}
            </Badge>
          </div>
          {goal.description && (
            <p className="mt-1 text-sm text-foreground-secondary">{goal.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1">
              <IconClock size={13} />
              {goal.startTime} · {goal.durationMinutes.toLocaleString("ar-SA")} دقيقة
            </span>
            {goal.courseSlug && (
              <a
                href={goal.lessonId ? ROUTES.learn(goal.courseSlug) : `${ROUTES.courses}/${goal.courseSlug}`}
                className="text-sage-600 hover:underline"
              >
                {goal.lessonId ? "فتح الدرس" : "فتح الدورة"}
              </a>
            )}
          </div>
          <div className="mt-2 flex gap-3">
            <button type="button" onClick={onEdit} className="text-xs text-sage-600 hover:underline">
              تعديل
            </button>
            <button type="button" onClick={onDelete} className="text-xs text-red-500 hover:underline">
              حذف
            </button>
          </div>
        </div>
      </Card>
    </li>
  );
}

function GoalForm({
  goal,
  defaultDate,
  saving,
  onSubmit,
  onCancel,
}: {
  goal: LearningGoal | null;
  defaultDate: string;
  saving: boolean;
  onSubmit: (input: GoalInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [scheduledDate, setScheduledDate] = useState(goal?.scheduledDate ?? defaultDate);
  const [startTime, setStartTime] = useState(goal?.startTime ?? "18:00");
  const [durationMinutes, setDurationMinutes] = useState(goal?.durationMinutes ?? 30);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    void onSubmit({
      title,
      description: description.trim() || undefined,
      courseSlug: goal?.courseSlug,
      lessonId: goal?.lessonId,
      durationMinutes,
      scheduledDate,
      startTime,
    });
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition focus:border-sage-400 focus:ring-2 focus:ring-sage-400/15";

  return (
    <Card padding="lg" className="mt-6 border-sage-200/60">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy-900">
            {goal ? "تعديل الهدف" : "إضافة هدف شخصي"}
          </h2>
          {goal?.source === "ai" && <Badge variant="sage">هدف المساعد</Badge>}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-foreground-secondary sm:col-span-2">
            عنوان الهدف
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={inputClass}
              placeholder="مثال: أكمل درس المفاهيم الأساسية"
              required
              autoFocus
            />
          </label>
          <label className="text-sm text-foreground-secondary sm:col-span-2">
            ملاحظات
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={cn(inputClass, "h-24 resize-none py-3")}
              placeholder="تفاصيل اختيارية تساعدك على الإنجاز"
            />
          </label>
          <label className="text-sm text-foreground-secondary">
            التاريخ
            <input
              type="date"
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="text-sm text-foreground-secondary">
            وقت البدء
            <input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="text-sm text-foreground-secondary">
            المدة بالدقائق
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(Number(event.target.value))}
              className={inputClass}
              required
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "جاري الحفظ…" : goal ? "حفظ التعديلات" : "إضافة الهدف"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}

type SummaryAccent = "blue" | "green" | "orange" | "purple";

const summaryStyles: Record<
  SummaryAccent,
  { card: string; icon: string }
> = {
  blue: {
    card: "border-accent-blue-100 bg-accent-blue-50/60",
    icon: "bg-accent-blue-100 text-accent-blue-600",
  },
  green: {
    card: "border-sage-200 bg-sage-50/60",
    icon: "bg-sage-100 text-sage-600",
  },
  orange: {
    card: "border-accent-orange-100 bg-accent-orange-50/60",
    icon: "bg-accent-orange-100 text-accent-orange-600",
  },
  purple: {
    card: "border-accent-purple-100 bg-accent-purple-50/60",
    icon: "bg-accent-purple-100 text-accent-purple-600",
  },
};

function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: SummaryAccent;
}) {
  const styles = summaryStyles[accent];
  return (
    <Card padding="md" className={styles.card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
          <p className="mt-2 text-xl font-bold text-navy-900">{value}</p>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            styles.icon,
          )}
        >
          {icon}
        </span>
      </div>
    </Card>
  );
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
