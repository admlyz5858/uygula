import { describe, expect, it } from "vitest";
import { generateAiPlan } from "../ai/planner";

describe("generateAiPlan", () => {
  it("creates a multi-session plan from hour input", () => {
    const output = generateAiPlan("Study physics 3 hours", 25);
    const totalSessions = output.tasks.reduce((sum, task) => sum + task.sessions, 0);
    expect(totalSessions).toBeGreaterThanOrEqual(7);
    expect(output.summary.toLowerCase()).toContain("physics");
  });

  it("falls back to default duration when no duration present", () => {
    const output = generateAiPlan("Write a report", 30);
    const totalMinutes = output.tasks.reduce((sum, task) => sum + task.minutes, 0);
    expect(totalMinutes).toBeGreaterThan(0);
  });
});
