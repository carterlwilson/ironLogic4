"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unassignProgram = exports.assignProgram = exports.deleteClient = exports.updateClient = exports.createClient = exports.getClientById = exports.getAllClients = void 0;
const User_1 = require("../models/User");
const Program_1 = require("../models/Program");
const shared_1 = require("@ironlogic4/shared");
const auth_1 = require("../utils/auth");
/**
 * Get all clients with pagination, search, and gym scoping
 */
const getAllClients = async (req, res) => {
    try {
        const validation = shared_1.ClientListParamsSchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: validation.error.errors,
            });
            return;
        }
        const { gymId, search, page, limit } = validation.data;
        const skip = (page - 1) * limit;
        const query = { userType: shared_1.UserType.CLIENT };
        // Gym scoping: owners can only see their gym's clients, admins can filter by gymId
        if (req.user?.userType === shared_1.UserType.OWNER) {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        // Search by name or email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const [clients, total] = await Promise.all([
            User_1.User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_1.User.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: clients.map(client => client.toJSON()),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch clients',
        });
    }
};
exports.getAllClients = getAllClients;
/**
 * Get a single client by ID
 */
const getClientById = async (req, res) => {
    try {
        const validation = shared_1.ClientIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const { id } = validation.data;
        const client = await User_1.User.findById(id).select('-password').populate('programId');
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Verify client is actually a CLIENT user type
        if (client.userType !== shared_1.UserType.CLIENT) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Gym scoping: owners can only access their gym's clients
        if (req.user?.userType === shared_1.UserType.OWNER && client.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s clients.',
            });
            return;
        }
        const response = {
            success: true,
            data: client.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch client',
        });
    }
};
exports.getClientById = getClientById;
/**
 * Create a new client
 */
const createClient = async (req, res) => {
    try {
        const validation = shared_1.CreateClientSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid client data',
                details: validation.error.errors,
            });
            return;
        }
        const { email, firstName, lastName, gymId, password, generatePassword, programId } = validation.data;
        // Gym scoping: owners can only create clients for their gym
        if (req.user?.userType === shared_1.UserType.OWNER) {
            if (gymId !== req.user.gymId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only create clients for your own gym',
                });
                return;
            }
        }
        // Check if user with this email already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'A user with this email already exists',
            });
            return;
        }
        // If programId is provided, validate it exists and belongs to the same gym
        if (programId) {
            const program = await Program_1.Program.findById(programId);
            if (!program) {
                res.status(404).json({
                    success: false,
                    error: 'Program not found',
                });
                return;
            }
            // Verify program belongs to the same gym as the client
            if (program.gymId !== gymId) {
                res.status(400).json({
                    success: false,
                    error: 'Program must belong to the same gym as the client',
                });
                return;
            }
        }
        // Password generation logic
        let finalPassword;
        if (generatePassword !== false) {
            finalPassword = (0, auth_1.generateRandomPassword)(12);
        }
        else {
            if (!password) {
                res.status(400).json({
                    success: false,
                    error: 'Password is required when generatePassword is false',
                });
                return;
            }
            finalPassword = password;
        }
        // Create the client - ALWAYS set userType to CLIENT
        const newClient = new User_1.User({
            email,
            firstName,
            lastName,
            userType: shared_1.UserType.CLIENT, // Never trust client input - always set to CLIENT
            gymId,
            password: finalPassword,
            ...(programId && { programId }),
        });
        const savedClient = await newClient.save();
        // Populate program if it was assigned
        const populatedClient = programId
            ? await User_1.User.findById(savedClient._id).select('-password').populate('programId')
            : savedClient;
        // Return client data without password, but include generated password in response if applicable
        const clientData = populatedClient?.toJSON() || savedClient.toJSON();
        const response = {
            success: true,
            data: {
                ...clientData,
                ...(generatePassword !== false && { generatedPassword: finalPassword }),
            },
            message: 'Client created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create client',
        });
    }
};
exports.createClient = createClient;
/**
 * Update a client
 */
const updateClient = async (req, res) => {
    try {
        const paramsValidation = shared_1.ClientIdSchema.safeParse(req.params);
        const bodyValidation = shared_1.UpdateClientSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const validatedData = bodyValidation.data;
        const client = await User_1.User.findById(id);
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Verify client is actually a CLIENT user type
        if (client.userType !== shared_1.UserType.CLIENT) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Gym scoping: owners can only update their gym's clients
        if (req.user?.userType === shared_1.UserType.OWNER && client.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own gym\'s clients.',
            });
            return;
        }
        // Check if email is being changed and if it's already taken
        if (validatedData.email && validatedData.email !== client.email) {
            const existingUser = await User_1.User.findOne({ email: validatedData.email });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: 'A user with this email already exists',
                });
                return;
            }
        }
        // Field sanitization - strip protected fields
        const sanitizedUpdateData = {
            ...validatedData,
            userType: undefined, // Never allow changing user type
            gymId: undefined, // Never allow changing gym
            password: undefined, // Don't allow password change through this endpoint
            // Explicitly allow benchmark updates (they're already validated)
            currentBenchmarks: validatedData.currentBenchmarks,
            historicalBenchmarks: validatedData.historicalBenchmarks,
        };
        const updatedClient = await User_1.User.findByIdAndUpdate(id, sanitizedUpdateData, { new: true, runValidators: true }).select('-password');
        const response = {
            success: true,
            data: updatedClient ? updatedClient.toJSON() : null,
            message: 'Client updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update client',
        });
    }
};
exports.updateClient = updateClient;
/**
 * Delete a client
 */
const deleteClient = async (req, res) => {
    try {
        const validation = shared_1.ClientIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const { id } = validation.data;
        const client = await User_1.User.findById(id);
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Verify client is actually a CLIENT user type
        if (client.userType !== shared_1.UserType.CLIENT) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Gym scoping: owners can only delete their gym's clients
        if (req.user?.userType === shared_1.UserType.OWNER && client.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s clients.',
            });
            return;
        }
        await User_1.User.findByIdAndDelete(id);
        const response = {
            success: true,
            message: 'Client deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete client',
        });
    }
};
exports.deleteClient = deleteClient;
/**
 * Assign a program to a client
 */
const assignProgram = async (req, res) => {
    try {
        const validation = shared_1.ClientIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const { id } = validation.data;
        const { programId } = req.body;
        if (!programId) {
            res.status(400).json({
                success: false,
                error: 'Program ID is required',
            });
            return;
        }
        // Find the client
        const client = await User_1.User.findById(id);
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Verify client is actually a CLIENT user type
        if (client.userType !== shared_1.UserType.CLIENT) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Gym scoping: owners/coaches can only assign programs to their gym's clients
        if (req.user?.userType === shared_1.UserType.OWNER && client.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only assign programs to your own gym\'s clients.',
            });
            return;
        }
        // Find and validate the program
        const program = await Program_1.Program.findById(programId);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Verify program belongs to the same gym as the client
        if (program.gymId !== client.gymId) {
            res.status(400).json({
                success: false,
                error: 'Program must belong to the same gym as the client',
            });
            return;
        }
        // Auto-start program if not already started and has blocks
        if (program.currentProgress.startedAt === null &&
            program.blocks.length > 0) {
            program.currentProgress = {
                blockIndex: 0,
                weekIndex: 0,
                startedAt: new Date(),
                completedAt: null,
                lastAdvancedAt: null,
                totalWeeksCompleted: 0,
            };
            await program.save();
        }
        // Update client with programId
        client.programId = programId;
        await client.save();
        // Return updated client with populated program
        const updatedClient = await User_1.User.findById(id).select('-password').populate('programId');
        const response = {
            success: true,
            data: updatedClient ? updatedClient.toJSON() : null,
            message: 'Program assigned successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error assigning program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign program',
        });
    }
};
exports.assignProgram = assignProgram;
/**
 * Unassign a program from a client
 */
const unassignProgram = async (req, res) => {
    try {
        const validation = shared_1.ClientIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid client ID',
            });
            return;
        }
        const { id } = validation.data;
        // Find the client
        const client = await User_1.User.findById(id);
        if (!client) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Verify client is actually a CLIENT user type
        if (client.userType !== shared_1.UserType.CLIENT) {
            res.status(404).json({
                success: false,
                error: 'Client not found',
            });
            return;
        }
        // Gym scoping: owners/coaches can only unassign programs from their gym's clients
        if (req.user?.userType === shared_1.UserType.OWNER && client.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only unassign programs from your own gym\'s clients.',
            });
            return;
        }
        // Unassign the program
        client.programId = undefined;
        await client.save();
        // Return updated client
        const updatedClient = await User_1.User.findById(id).select('-password');
        const response = {
            success: true,
            data: updatedClient ? updatedClient.toJSON() : null,
            message: 'Program unassigned successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error unassigning program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unassign program',
        });
    }
};
exports.unassignProgram = unassignProgram;
//# sourceMappingURL=clients.js.map