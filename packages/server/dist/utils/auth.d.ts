/**
 * Generate a JWT token for the given user ID
 */
export declare const generateToken: (userId: string) => string;
/**
 * Hash a password using bcrypt
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compare a plain text password with a hashed password
 */
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
/**
 * Generate a random password
 */
export declare const generateRandomPassword: (length?: number) => string;
//# sourceMappingURL=auth.d.ts.map