import { Goal } from "../types/finflow";

export function cappedGoalProgress(saved: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((saved / target) * 100)));
}

export function monthsUntil(targetDate?: string | null, now = new Date()) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  if (!Number.isFinite(target.getTime()) || target < today) return null;
  const months = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();
  const adjusted = target.getDate() > now.getDate() ? months + 1 : months;
  return Math.max(1, adjusted);
}

export function suggestedMonthlySaving(goal: Pick<Goal, "saved" | "target" | "targetDate">) {
  const months = monthsUntil(goal.targetDate);
  if (!months) return null;
  return Math.max(0, goal.target - goal.saved) / months;
}
