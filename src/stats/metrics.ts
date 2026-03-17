import { format, subDays } from "date-fns";
import type { DayRecord } from "../types";

export function ensureDayRecord(records: DayRecord[], day: string): DayRecord[] {
  if (records.some((r) => r.date === day)) return records;
  return [...records, { date: day, sessions: 0, focusMinutes: 0, xp: 0 }];
}

export function upsertDayRecord(
  records: DayRecord[],
  day: string,
  delta: Partial<DayRecord>,
): DayRecord[] {
  const next = ensureDayRecord(records, day);
  return next.map((record) => {
    if (record.date !== day) return record;
    return {
      ...record,
      sessions: record.sessions + (delta.sessions ?? 0),
      focusMinutes: record.focusMinutes + (delta.focusMinutes ?? 0),
      xp: record.xp + (delta.xp ?? 0)
    };
  });
}

export function lastDays(records: DayRecord[], count: number): DayRecord[] {
  const lookup = new Map(records.map((r) => [r.date, r]));
  return Array.from({ length: count }, (_, idx) => {
    const day = format(subDays(new Date(), count - idx - 1), "yyyy-MM-dd");
    return (
      lookup.get(day) ?? {
        date: day,
        sessions: 0,
        focusMinutes: 0,
        xp: 0
      }
    );
  });
}

export function streakFromRecords(records: DayRecord[]): number {
  const set = new Set(records.filter((r) => r.sessions > 0).map((r) => r.date));
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (set.has(day)) {
      streak += 1;
      continue;
    }
    if (i === 0) {
      continue;
    }
    break;
  }
  return streak;
}
