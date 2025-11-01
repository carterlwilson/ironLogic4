import mongoose, { Document } from 'mongoose';
import { IActiveSchedule, IScheduleDay, ITimeSlot } from '@ironlogic4/shared';
export interface TimeSlotDocument extends Omit<ITimeSlot, 'id'>, Document {
}
export interface ScheduleDayDocument extends Omit<IScheduleDay, 'timeSlots'>, Document {
    timeSlots: TimeSlotDocument[];
}
export interface ActiveScheduleDocument extends Omit<IActiveSchedule, 'id' | 'days'>, Document {
    days: ScheduleDayDocument[];
}
export declare const ActiveSchedule: mongoose.Model<ActiveScheduleDocument, {}, {}, {}, mongoose.Document<unknown, {}, ActiveScheduleDocument, {}, {}> & ActiveScheduleDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ActiveSchedule.d.ts.map