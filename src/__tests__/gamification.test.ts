import { describe, expect, it } from "vitest";
import { levelFromXp, plantStage, productivityScore, xpForSession } from "../gamification/engine";

describe("gamification engine", () => {
  it("gives meaningful xp values", () => {
    expect(xpForSession(25)).toBeGreaterThan(20);
  });

  it("computes level growth", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(480)).toBeGreaterThan(1);
  });

  it("maps plant stages correctly", () => {
    expect(plantStage(0, 100)).toBe("seed");
    expect(plantStage(8, 100)).toBe("tree");
    expect(plantStage(8, 10)).toBe("withered");
  });

  it("caps productivity score to 100", () => {
    expect(productivityScore(20, 400, 10)).toBe(100);
  });
});
