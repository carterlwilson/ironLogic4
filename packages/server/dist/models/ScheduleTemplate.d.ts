import mongoose, { Document } from 'mongoose';
import { IScheduleTemplate, IScheduleDay, ITimeSlot } from '@ironlogic4/shared';
export interface TimeSlotDocument extends Omit<ITimeSlot, 'id'>, Document {
}
export interface ScheduleDayDocument extends Omit<IScheduleDay, 'timeSlots'>, Document {
    timeSlots: TimeSlotDocument[];
}
export interface ScheduleTemplateDocument extends Omit<IScheduleTemplate, 'id' | 'days'>, Document {
    days: ScheduleDayDocument[];
}
export declare const ScheduleTemplate: mongoose.Model<ScheduleTemplateDocument, {}, {}, {}, mongoose.Document<unknown, {}, ScheduleTemplateDocument, {}, {}> & ScheduleTemplateDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ScheduleTemplate.d.ts.map