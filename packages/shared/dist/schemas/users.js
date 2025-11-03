"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserSchema = exports.UserSchema = exports.UserTypeSchema = void 0;
const zod_1 = require("zod");
const users_1 = require("../types/users");
exports.UserTypeSchema = zod_1.z.nativeEnum(users_1.UserType);
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    userType: exports.UserTypeSchema,
    password: zod_1.z.string().min(6),
    gymId: zod_1.z.string().optional(),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
});
exports.CreateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    userType: exports.UserTypeSchema,
    gymId: zod_1.z.string().optional(),
});
//# sourceMappingURL=users.js.map