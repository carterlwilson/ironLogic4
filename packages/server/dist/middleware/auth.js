"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireOwnerOrAdminForGym = exports.requireUserManagementPermission = exports.requireAdminOrCoach = exports.requireAdminOrOwner = exports.requireAdmin = exports.requireRole = exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = require("@ironlogic4/shared/types/users");
const User_1 = require("../models/User");
/**
 * Middleware to verify JWT token and attach user to request
 */
const verifyToken = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req);
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token is required',
            });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({
                success: false,
                error: 'JWT secret not configured',
            });
            return;
        }
        // Verify and decode the token
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        // Find the user in the database
        const user = await User_1.User.findById(decoded.userId).select('+password');
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        // Attach user to request object
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Authentication error',
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Middleware factory for role-based authorization
 * @param allowedRoles Array of UserType values that are allowed to access the route
 * @returns Express middleware function
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }
        if (!allowedRoles.includes(req.user.userType)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Middleware for admin-only access (strict admin only, no other roles)
 */
exports.requireAdmin = (0, exports.requireRole)([users_1.UserType.ADMIN]);
/**
 * Middleware for admin and owner access (legacy, kept for compatibility)
 */
exports.requireAdminOrOwner = (0, exports.requireRole)([users_1.UserType.ADMIN, users_1.UserType.OWNER]);
/**
 * Middleware for admin and coach access
 */
exports.requireAdminOrCoach = (0, exports.requireRole)([
    users_1.UserType.ADMIN,
    users_1.UserType.OWNER,
    users_1.UserType.COACH,
]);
/**
 * Authorization middleware that checks if user can create/manage other users
 * Admin/Owner: can create admin/coach users
 * Coach: can create/edit/delete client users only
 */
const requireUserManagementPermission = (targetUserType) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
            return;
        }
        const { userType } = req.user;
        // Admin can manage all user types
        if (userType === users_1.UserType.ADMIN) {
            next();
            return;
        }
        // Owner can manage Coach and Client Types
        if (userType === users_1.UserType.OWNER) {
            if (targetUserType === users_1.UserType.CLIENT || targetUserType === users_1.UserType.COACH) {
                next();
                return;
            }
        }
        // Coach can only manage client users
        if (userType === users_1.UserType.COACH) {
            if (!targetUserType || targetUserType === users_1.UserType.CLIENT) {
                next();
                return;
            }
            res.status(403).json({
                success: false,
                error: 'Coaches can only manage client users',
            });
            return;
        }
        // Clients have read-only access
        res.status(403).json({
            success: false,
            error: 'Insufficient permissions for user management',
        });
    };
};
exports.requireUserManagementPermission = requireUserManagementPermission;
/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return null;
    }
    // Check for "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
}
/**
 * Middleware for gym-scoped access - owners can only access their own gym's data, admins have full access
 *
 * For OWNER/CLIENT users: Verifies they have a gym assignment (req.user.gymId exists)
 * For ADMIN users: Allows full access across all gyms
 *
 * Controllers are responsible for using req.user.gymId for gym scoping.
 */
const requireOwnerOrAdminForGym = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
        return;
    }
    // Admins have full access to all gyms
    if (user.userType === users_1.UserType.ADMIN) {
        next();
        return;
    }
    // Owners and Clients must have a gym assignment
    if (user.userType === users_1.UserType.OWNER || user.userType === users_1.UserType.CLIENT) {
        if (!user.gymId) {
            res.status(400).json({
                success: false,
                error: 'You must be assigned to a gym to perform this action',
            });
            return;
        }
        // User has a gym assignment, allow the request
        // Controllers will use req.user.gymId for gym scoping
        next();
        return;
    }
    res.status(403).json({
        success: false,
        error: 'Access denied. Owner or admin privileges required.',
    });
};
exports.requireOwnerOrAdminForGym = requireOwnerOrAdminForGym;
//# sourceMappingURL=auth.js.map