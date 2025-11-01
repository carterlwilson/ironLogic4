export interface Gym {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateGymRequest {
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
}
export interface UpdateGymRequest {
    name?: string;
    address?: string;
    phoneNumber?: string;
    ownerId?: string;
}
export interface GymListParams {
    page?: number;
    limit?: number;
    search?: string;
    ownerId?: string;
}
//# sourceMappingURL=gyms.d.ts.map