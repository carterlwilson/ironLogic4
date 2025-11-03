"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseSchema = void 0;
const zod_1 = require("zod");
exports.ApiResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    data: zod_1.z.any().optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
});
//# sourceMappingURL=api.js.map