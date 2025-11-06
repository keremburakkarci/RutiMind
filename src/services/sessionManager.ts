// Session Manager - Handles student session timing and sequencing with monotonic clock

import type { SelectedSkill } from '../types';

export type SkillResponse = 'yes' | 'no' | 'no-response';

export interface SessionEvent {
  skillId: string;
  skillName: string;
  scheduledTime: number; // milliseconds from session start
  // How long (ms) after THIS skill until the next skill should start.
  // For the last skill this will typically be 0.
  intervalAfterPrevMs: number;
  actualPresentationTime?: number; // actual presentation timestamp
  response?: SkillResponse;
  responseTime?: number; // timestamp when response was recorded
}

export interface SessionConfig {
  waitDuration: number; // minutes
  skills: SelectedSkill[];
}

export class SessionManager {
  private sessionStartTime: number | null = null;
  private events: SessionEvent[] = [];
  private config: SessionConfig;

  constructor(config: SessionConfig) {
    this.config = config;
    this.buildSchedule();
  }

  /**
   * Build the schedule of when each skill should appear.
   * Uses monotonic timing: treat each skill's `duration` as the WAIT before that skill.
   * This means the first skill is presented after its own duration elapses.
   */
  private buildSchedule(): void {
    // New interpretation: each skill.duration (minutes) is the wait BEFORE that skill.
    // Example with durations [1,2,3]:
    //  - Skill 0 scheduled at 1 minute
    //  - Skill 1 scheduled at 1 + 2 = 3 minutes
    //  - Skill 2 scheduled at 1 + 2 + 3 = 6 minutes
    // For the convenience of other APIs, we also expose intervalAfterPrevMs which
    // represents how long after THIS skill the NEXT skill will start (i.e. next skill's duration).
    let accumulatedTime = 0;

    this.events = this.config.skills.map((skill, idx) => {
      const waitMsForThisSkill = (skill.duration || 0) * 60 * 1000;
      accumulatedTime += waitMsForThisSkill; // schedule time is after waiting this skill's duration

      const nextWaitMs = (this.config.skills[idx + 1]?.duration || 0) * 60 * 1000;

      const event: SessionEvent = {
        skillId: skill.skillId,
        skillName: skill.skillName,
        scheduledTime: accumulatedTime,
        // how long after THIS skill until the next begins -> equals next skill's wait
        intervalAfterPrevMs: nextWaitMs,
      };

      return event;
    });
  }

  /**
   * Start the session timer. Should be called when wait period begins.
   */
  startSession(): void {
    this.sessionStartTime = Date.now();
    console.log('[SessionManager] Session started at:', new Date(this.sessionStartTime).toISOString());
  }

  /**
   * Get the session start time (null if not started).
   */
  getSessionStartTime(): number | null {
    return this.sessionStartTime;
  }

  /**
   * Get all scheduled events.
   */
  getSchedule(): SessionEvent[] {
    return this.events;
  }

  /**
   * Get the next skill that should be presented based on current time.
   * Returns null if all skills have been presented or session hasn't started.
   */
  getNextSkill(): SessionEvent | null {
    if (!this.sessionStartTime) return null;

    const elapsed = Date.now() - this.sessionStartTime;
    const nextEvent = this.events.find(
      (event) => !event.actualPresentationTime && event.scheduledTime <= elapsed
    );

    return nextEvent || null;
  }

  /**
   * Mark a skill as presented (record actual presentation time).
   */
  markSkillPresented(skillId: string): void {
    const event = this.events.find((e) => e.skillId === skillId);
    if (event) {
      event.actualPresentationTime = Date.now();
      console.log('[SessionManager] Skill presented:', skillId, 'at', new Date(event.actualPresentationTime).toISOString());
    }
  }

  /**
   * Record a response for a skill.
   */
  recordResponse(skillId: string, response: SkillResponse): void {
    const event = this.events.find((e) => e.skillId === skillId);
    if (event) {
      event.response = response;
      event.responseTime = Date.now();
      console.log('[SessionManager] Response recorded:', skillId, response, 'at', new Date(event.responseTime).toISOString());
    }
  }

  /**
   * Get time (in ms) until the next scheduled skill.
   * Returns null if session hasn't started or all skills are done.
   */
  getTimeUntilNextSkill(): number | null {
    if (!this.sessionStartTime) return null;

    const elapsed = Date.now() - this.sessionStartTime;
    const nextEvent = this.events.find((e) => !e.actualPresentationTime);

    if (!nextEvent) return null;

    const timeUntil = nextEvent.scheduledTime - elapsed;
    return Math.max(0, timeUntil);
  }

  /**
   * Check if all skills have been presented.
   */
  isSessionComplete(): boolean {
    return this.events.every((e) => e.actualPresentationTime !== undefined);
  }

  /**
   * Get summary of all events (for logging/debugging).
   */
  getSummary(): SessionEvent[] {
    return this.events.map((e) => ({ ...e }));
  }
}
