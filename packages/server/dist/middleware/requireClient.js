"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClient = void 0;
const shared_1 = require("@ironlogic4/shared");
/**
 * Middleware to verify user has CLIENT role
 * Must be used after verifyToken middleware
 */
const requireClient = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }
    if (req.user.userType !== shared_1.UserType.CLIENT) {
        res.status(403).json({
            success: false,
            error: 'This endpoint is only accessible to clients',
        });
        return;
    }
    next();
};
exports.requireClient = requireClient;
//# sourceMappingURL=requireClient.js.map