export declare enum ActivityType {
    LIFT = "lift",
    CARDIO = "cardio",
    OTHER = "other",
    BENCHMARK = "benchmark"
}
export interface ActivityTemplate {
    id: string;
    name: string;
    notes?: string;
    groupId?: string;
    type: ActivityType;
    benchmarkTemplateId?: string;
    gymId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateActivityTemplateRequest {
    name: string;
    notes?: string;
    groupId?: string;
    type: ActivityType;
    benchmarkTemplateId?: string;
    gymId: string;
}
export interface UpdateActivityTemplateRequest {
    name?: string;
    notes?: string;
    groupId?: string;
    type?: ActivityType;
    benchmarkTemplateId?: string;
}
export interface ActivityTemplateListParams {
    gymId?: string;
    type?: ActivityType;
    groupId?: string;
    search?: string;
    page?: number;
    limit?: number;
}
//# sourceMappingURL=activityTemplates.d.ts.map