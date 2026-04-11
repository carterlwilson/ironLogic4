import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { ClassSession } from '../models/ClassSession.js';
import { ClientDefaultSchedule } from '../models/ClientDefaultSchedule.js';
import { Enrollment } from '../models/Enrollment.js';
import { GenerateWeekResponse } from '@ironlogic4/shared';

/**
 * Service for generating weekly class sessions from schedule templates.
 */
export class ScheduleResetService {
  /**
   * Generate ClassSession documents for a given week and auto-enroll clients from their defaults.
   *
   * @param startDate - The Monday of the week to generate sessions for.
   *                    Defaults to the upcoming Monday if not provided.
   */
  static async generateWeeklySessions(startDate?: Date): Promise<GenerateWeekResponse> {
    const monday = startDate ? new Date(startDate) : ScheduleResetService.nextMonday();
    monday.setUTCHours(0, 0, 0, 0);

    // Build array of the 7 dates (Mon–Sun)
    const weekDates: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + i);
      return d;
    });

    // Map JS getUTCDay() → date for this week (Mon=1…Sat=6, Sun=0)
    const dateByDayOfWeek = new Map<number, Date>();
    for (const d of weekDates) {
      dateByDayOfWeek.set(d.getUTCDay(), d);
    }

    const templates = await ScheduleTemplate.find({ isActive: true });
    let sessionsCreated = 0;
    let enrollmentsCreated = 0;

    for (const template of templates) {
      const sessionDate = dateByDayOfWeek.get(template.dayOfWeek);
      if (!sessionDate) continue;

      // Deduplication — skip if session already exists for this template + date
      const existing = await ClassSession.findOne({
        templateId: template.id,
        date: sessionDate,
      });
      if (existing) continue;

      const session = await ClassSession.create({
        templateId: template.id,
        coachId: template.coachId,
        gymId: template.gymId,
        date: sessionDate,
        period: template.period,
        startTime: template.time,
        endTime: template.endTime,
        maxCapacity: template.maxCapacity,
      });
      sessionsCreated++;

      // Auto-enroll clients with a matching default for this template
      const defaults = await ClientDefaultSchedule.find({
        templateId: template.id,
        isActive: true,
      });

      for (const def of defaults) {
        const alreadyEnrolled = await Enrollment.findOne({
          sessionId: session.id,
          clientId: def.clientId,
        });
        if (alreadyEnrolled) continue;

        await Enrollment.create({
          sessionId: session.id,
          clientId: def.clientId,
          source: 'default',
          status: 'enrolled',
          enrolledAt: new Date(),
        });
        enrollmentsCreated++;
      }
    }

    return {
      sessionsCreated,
      enrollmentsCreated,
      weekStart: monday.toISOString().split('T')[0],
    };
  }

  /** Returns the date of the upcoming Monday (or today if today is Monday). */
  private static nextMonday(): Date {
    const now = new Date();
    const day = now.getUTCDay();
    const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7 || 7;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    return monday;
  }
}
