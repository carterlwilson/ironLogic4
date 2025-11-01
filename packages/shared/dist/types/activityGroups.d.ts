export interface ActivityGroup {
    id: string;
    name: string;
    notes?: string;
    gymId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ActivityGroupListParams {
    gymId?: string;
    search?: string;
    page: number;
    limit: number;
}
//# sourceMappingURL=activityGroups.d.ts.map