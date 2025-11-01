"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const auth_1 = require("@ironlogic4/shared/schemas/auth");
const User_1 = require("../models/User");
const Gym_1 = require("../models/Gym");
const auth_2 = require("../utils/auth");
/**
 * Register a new user
 */
const registerUser = async (req, res) => {
    try {
        // Validate request body using RegisterSchema
        const validationResult = auth_1.RegisterSchema.safeParse(req.body);
        if (!validationResult.success) {
            const response = {
                success: false,
                error: 'Validation failed',
                message: validationResult.error.errors.map(e => e.message).join(', ')
            };
            res.status(400).json(response);
            return;
        }
        const { email, password, firstName, lastName, userType, gymId } = validationResult.data;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            const response = {
                success: false,
                error: 'User already exists',
                message: 'A user with this email address already exists'
            };
            res.status(409).json(response);
            return;
        }
        // Create new user (password will be auto-hashed by the model)
        const user = new User_1.User({
            email,
            password,
            firstName,
            lastName,
            userType,
            gymId
        });
        await user.save();
        // Return success response with user data (password excluded by model)
        const response = {
            success: true,
            data: user.toJSON(),
            message: 'User registered successfully'
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Registration error:', error);
        // Handle duplicate key error (in case unique index catches it)
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            const response = {
                success: false,
                error: 'User already exists',
                message: 'A user with this email address already exists'
            };
            res.status(409).json(response);
            return;
        }
        const response = {
            success: false,
            error: 'Internal server error',
            message: 'An error occurred during registration'
        };
        res.status(500).json(response);
    }
};
exports.registerUser = registerUser;
/**
 * Login user and return JWT token
 */
const loginUser = async (req, res) => {
    try {
        console.log("logging in user");
        // Validate request body using LoginSchema
        const validationResult = auth_1.LoginSchema.safeParse(req.body);
        if (!validationResult.success) {
            const response = {
                success: false,
                error: 'Validation failed',
                message: validationResult.error.errors.map(e => e.message).join(', ')
            };
            console.log(response);
            res.status(400).json(response);
            return;
        }
        const { email, password } = validationResult.data;
        // Find user by email and include password field
        const user = await User_1.User.findOne({ email }).select('+password');
        if (!user) {
            const response = {
                success: false,
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            };
            res.status(401).json(response);
            return;
        }
        // Compare password using user.comparePassword method
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            const response = {
                success: false,
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            };
            res.status(401).json(response);
            return;
        }
        // Fetch gym name if user has a gymId
        let gymName;
        if (user.gymId) {
            const gym = await Gym_1.Gym.findById(user.gymId).select('name');
            gymName = gym?.name;
        }
        // Generate JWT token using generateToken utility
        const token = (0, auth_2.generateToken)(user.id);
        // Return success response with token and user data (password excluded)
        const userData = user.toJSON();
        const response = {
            success: true,
            data: {
                token,
                user: { ...userData, gymName }
            },
            message: 'Login successful'
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error('Login error:', error);
        const response = {
            success: false,
            error: 'Internal server error',
            message: 'An error occurred during login'
        };
        res.status(500).json(response);
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=auth.js.map