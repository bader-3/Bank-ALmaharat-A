import type { LearningGoal } from "@/types/goals";

const REMINDERS_KEY = "asb-reminders";

type ReminderState = {
  browserEnabled: boolean;
  dismissedIds: string[];
  notifiedIds: string[];
};

type ReminderStore = Record<string, ReminderState>;

export type GoalReminder = {
  id: string;
  goalId: string;
  title: string;
  scheduledDate: string;
  startTime: string;
  dueAt: string;
};

function emptyState(): ReminderState {
  return { browserEnabled: false, dismissedIds: [], notifiedIds: [] };
}

function readStore(): ReminderStore {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REMINDERS_KEY) ?? "{}") as ReminderStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveState(userId: string, state: ReminderState) {
  if (typeof window === "undefined") return;
  const store = readStore();
  store[userId] = state;
  window.localStorage.setItem(REMINDERS_KEY, JSON.stringify(store));
}

function getState(userId: string): ReminderState {
  const state = readStore()[userId];
  return state
    ? {
        browserEnabled: Boolean(state.browserEnabled),
        dismissedIds: Array.isArray(state.dismissedIds) ? state.dismissedIds : [],
        notifiedIds: Array.isArray(state.notifiedIds) ? state.notifiedIds : [],
      }
    : emptyState();
}

function toReminder(goal: LearningGoal): GoalReminder {
  const startTime = goal.startTime || "18:00";
  return {
    id: `${goal.id}:${goal.scheduledDate}:${startTime}`,
    goalId: goal.id,
    title: goal.title,
    scheduledDate: goal.scheduledDate,
    startTime,
    dueAt: `${goal.scheduledDate}T${startTime}:00`,
  };
}

export class LocalRemindersService {
  getBrowserStatus(userId: string) {
    const supported = typeof window !== "undefined" && "Notification" in window;
    return {
      supported,
      permission: supported ? Notification.permission : "unsupported",
      enabled: supported && Notification.permission === "granted" && getState(userId).browserEnabled,
    };
  }

  getReminders(userId: string, goals: LearningGoal[], now = new Date()) {
    const dismissed = new Set(getState(userId).dismissedIds);
    const oldest = new Date(now);
    oldest.setHours(0, 0, 0, 0);
    return goals
      .filter((goal) => !goal.completedAt)
      .map(toReminder)
      .filter((reminder) => !dismissed.has(reminder.id) && new Date(reminder.dueAt) >= oldest)
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
      .slice(0, 8);
  }

  dismiss(userId: string, reminderId: string) {
    const state = getState(userId);
    saveState(userId, {
      ...state,
      dismissedIds: [...new Set([...state.dismissedIds, reminderId])].slice(-200),
    });
  }

  async requestBrowserPermission(userId: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    const permission = await Notification.requestPermission();
    const state = getState(userId);
    saveState(userId, { ...state, browserEnabled: permission === "granted" });
    return permission;
  }

  notifyDue(userId: string, goals: LearningGoal[], now = new Date()) {
    const status = this.getBrowserStatus(userId);
    if (!status.enabled) return;
    const state = getState(userId);
    const notified = new Set(state.notifiedIds);
    const due = this.getReminders(userId, goals, now).filter((reminder) => {
      const difference = now.getTime() - new Date(reminder.dueAt).getTime();
      return difference >= 0 && difference <= 60 * 60 * 1000 && !notified.has(reminder.id);
    });
    due.forEach((reminder) => {
      new Notification("موعد هدفك التعليمي", {
        body: `${reminder.title} — ${reminder.startTime}`,
        tag: reminder.id,
      });
      notified.add(reminder.id);
    });
    if (due.length) {
      saveState(userId, { ...state, notifiedIds: [...notified].slice(-200) });
    }
  }
}

let instance: LocalRemindersService | null = null;

export function getRemindersService() {
  if (!instance) instance = new LocalRemindersService();
  return instance;
}
