const TOTAL_DAILY_LIMIT = 20;

export interface AiLimitState {
  used: number;
  total: number;
  date: string;
}

function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStorageKey(userId?: string): string {
  const safeId = userId ? userId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_") : "guest";
  return `wearbot_ai_limits_${safeId}`;
}

export function getAiLimitState(userId?: string): AiLimitState {
  const key = getStorageKey(userId);
  const today = getTodayKey();

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { used: 0, total: TOTAL_DAILY_LIMIT, date: today };
    }
    const data = JSON.parse(raw);
    // If recorded on a previous day, reset to 0 used today
    if (data.date !== today) {
      const resetState: AiLimitState = { used: 0, total: TOTAL_DAILY_LIMIT, date: today };
      localStorage.setItem(key, JSON.stringify(resetState));
      return resetState;
    }
    const used = typeof data.used === "number" ? Math.max(0, data.used) : 0;
    return { used, total: TOTAL_DAILY_LIMIT, date: today };
  } catch (e) {
    return { used: 0, total: TOTAL_DAILY_LIMIT, date: today };
  }
}

export function recordAiGeneration(userId?: string): AiLimitState {
  const current = getAiLimitState(userId);
  const today = getTodayKey();
  const nextUsed = Math.min(current.total, current.used + 1);
  const updated: AiLimitState = { used: nextUsed, total: current.total, date: today };

  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {}

  return updated;
}

export function resetAiLimits(userId?: string): AiLimitState {
  const today = getTodayKey();
  const fresh: AiLimitState = { used: 0, total: TOTAL_DAILY_LIMIT, date: today };
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(fresh));
  } catch (e) {}
  return fresh;
}
