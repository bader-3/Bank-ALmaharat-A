import { toDateKey } from "@/services/goals";
import type { LearningGoal } from "@/types/goals";

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function computeStreak(goals: LearningGoal[], today: string): number {
  const goalsByDate = goals.reduce<Record<string, LearningGoal[]>>((map, goal) => {
    (map[goal.scheduledDate] ??= []).push(goal);
    return map;
  }, {});

  let streak = 0;
  const cursor = parseDateKey(today);

  while (true) {
    const key = toDateKey(cursor);
    const dayGoals = goalsByDate[key];
    if (!dayGoals?.length) break;
    const allDone = dayGoals.every((goal) => goal.completedAt);
    if (!allDone) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
