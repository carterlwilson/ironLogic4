"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateGymSchema = exports.GymSchema = void 0;
const zod_1 = require("zod");
exports.GymSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1),
    address: zod_1.z.string().min(1),
    phoneNumber: zod_1.z.string().min(1),
    ownerId: zod_1.z.string(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateGymSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Gym name is required'),
    address: zod_1.z.string().min(1, 'Address is required'),
    phoneNumber: zod_1.z.string().min(1, 'Phone number is required'),
    ownerId: zod_1.z.string().min(1, 'Owner ID is required'),
});
//# sourceMappingURL=gyms.js.map