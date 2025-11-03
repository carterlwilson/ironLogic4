import { Program } from '../models/Program.js';
import { ProgramIdSchema, JumpToWeekSchema } from '@ironlogic4/shared';
/**
 * Start Program - Initialize progress tracking
 * Sets startedAt timestamp and ensures progress is at block 0, week 0
 */
export const startProgram = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Check if program has no blocks
        if (program.blocks.length === 0) {
            res.status(400).json({
                success: false,
                error: 'Cannot start program with no blocks',
            });
            return;
        }
        // Check if already started
        if (program.currentProgress.startedAt !== null) {
            res.status(400).json({
                success: false,
                error: 'Program has already been started',
            });
            return;
        }
        // Initialize progress
        program.currentProgress = {
            blockIndex: 0,
            weekIndex: 0,
            startedAt: new Date(),
            completedAt: null,
            lastAdvancedAt: null,
            totalWeeksCompleted: 0,
        };
        await program.save();
        const response = {
            success: true,
            data: program.toJSON(),
            message: 'Program started successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error starting program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start program',
        });
    }
};
/**
 * Advance Week - Move to next week with block advancement logic
 */
export const advanceWeek = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Check if program has been started
        if (program.currentProgress.startedAt === null) {
            res.status(400).json({
                success: false,
                error: 'Program must be started before advancing',
            });
            return;
        }
        // Check if program is already completed
        if (program.currentProgress.completedAt !== null) {
            res.status(400).json({
                success: false,
                error: 'Program has already been completed',
            });
            return;
        }
        const { blockIndex, weekIndex } = program.currentProgress;
        const currentBlock = program.blocks[blockIndex];
        if (!currentBlock) {
            res.status(400).json({
                success: false,
                error: 'Current block not found',
            });
            return;
        }
        // Check if we're at the last week of the current block
        const isLastWeekOfBlock = weekIndex === currentBlock.weeks.length - 1;
        if (isLastWeekOfBlock) {
            // Check if there's a next block
            const isLastBlock = blockIndex === program.blocks.length - 1;
            if (isLastBlock) {
                // Complete the program
                program.currentProgress.completedAt = new Date();
                program.currentProgress.lastAdvancedAt = new Date();
                program.currentProgress.totalWeeksCompleted += 1;
                await program.save();
                const response = {
                    success: true,
                    data: program.toJSON(),
                    message: 'Program completed successfully',
                };
                res.json(response);
                return;
            }
            else {
                // Move to first week of next block
                program.currentProgress.blockIndex += 1;
                program.currentProgress.weekIndex = 0;
                program.currentProgress.lastAdvancedAt = new Date();
                program.currentProgress.totalWeeksCompleted += 1;
            }
        }
        else {
            // Move to next week in current block
            program.currentProgress.weekIndex += 1;
            program.currentProgress.lastAdvancedAt = new Date();
            program.currentProgress.totalWeeksCompleted += 1;
        }
        await program.save();
        const response = {
            success: true,
            data: program.toJSON(),
            message: 'Advanced to next week successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error advancing week:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to advance week',
        });
    }
};
/**
 * Previous Week - Go back one week
 */
export const previousWeek = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Check if program has been started
        if (program.currentProgress.startedAt === null) {
            res.status(400).json({
                success: false,
                error: 'Program must be started before going back',
            });
            return;
        }
        const { blockIndex, weekIndex } = program.currentProgress;
        // Check if we're at the very beginning
        if (blockIndex === 0 && weekIndex === 0) {
            res.status(400).json({
                success: false,
                error: 'Already at the first week of the program',
            });
            return;
        }
        // If we're at the first week of a block, go to last week of previous block
        if (weekIndex === 0) {
            const previousBlock = program.blocks[blockIndex - 1];
            if (!previousBlock) {
                res.status(400).json({
                    success: false,
                    error: 'Previous block not found',
                });
                return;
            }
            program.currentProgress.blockIndex -= 1;
            program.currentProgress.weekIndex = previousBlock.weeks.length - 1;
        }
        else {
            // Go back one week in current block
            program.currentProgress.weekIndex -= 1;
        }
        // If program was completed, uncomplete it
        if (program.currentProgress.completedAt !== null) {
            program.currentProgress.completedAt = null;
        }
        // Decrement total weeks completed if greater than 0
        if (program.currentProgress.totalWeeksCompleted > 0) {
            program.currentProgress.totalWeeksCompleted -= 1;
        }
        program.currentProgress.lastAdvancedAt = new Date();
        await program.save();
        const response = {
            success: true,
            data: program.toJSON(),
            message: 'Moved to previous week successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error going to previous week:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to go to previous week',
        });
    }
};
/**
 * Jump to Week - Jump to a specific block and week
 */
export const jumpToWeek = async (req, res) => {
    try {
        const paramsValidation = ProgramIdSchema.safeParse(req.params);
        const bodyValidation = JumpToWeekSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const { blockIndex, weekIndex } = bodyValidation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Check if program has been started
        if (program.currentProgress.startedAt === null) {
            res.status(400).json({
                success: false,
                error: 'Program must be started before jumping to a week',
            });
            return;
        }
        // Validate blockIndex
        if (blockIndex >= program.blocks.length) {
            res.status(400).json({
                success: false,
                error: `Block index ${blockIndex} is out of range. Program has ${program.blocks.length} blocks.`,
            });
            return;
        }
        const targetBlock = program.blocks[blockIndex];
        // Validate weekIndex
        if (weekIndex >= targetBlock.weeks.length) {
            res.status(400).json({
                success: false,
                error: `Week index ${weekIndex} is out of range. Block ${blockIndex} has ${targetBlock.weeks.length} weeks.`,
            });
            return;
        }
        // Calculate total weeks completed up to this point
        let totalWeeks = 0;
        for (let i = 0; i < blockIndex; i++) {
            totalWeeks += program.blocks[i].weeks.length;
        }
        totalWeeks += weekIndex;
        // Update progress
        program.currentProgress.blockIndex = blockIndex;
        program.currentProgress.weekIndex = weekIndex;
        program.currentProgress.totalWeeksCompleted = totalWeeks;
        program.currentProgress.lastAdvancedAt = new Date();
        // If jumping to a position, uncomplete the program if it was completed
        if (program.currentProgress.completedAt !== null) {
            program.currentProgress.completedAt = null;
        }
        await program.save();
        const response = {
            success: true,
            data: program.toJSON(),
            message: `Jumped to block ${blockIndex}, week ${weekIndex} successfully`,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error jumping to week:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to jump to week',
        });
    }
};
/**
 * Reset Progress - Reset program to beginning
 */
export const resetProgress = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query);
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        // Reset progress to initial state
        program.currentProgress = {
            blockIndex: 0,
            weekIndex: 0,
            startedAt: null,
            completedAt: null,
            lastAdvancedAt: null,
            totalWeeksCompleted: 0,
        };
        await program.save();
        const response = {
            success: true,
            data: program.toJSON(),
            message: 'Program progress reset successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error resetting progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset progress',
        });
    }
};
/**
 * Get Current Progress - Get progress with metadata
 */
export const getCurrentProgress = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query)
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        const { blockIndex, weekIndex } = program.currentProgress;
        // Calculate total weeks in program
        const totalWeeks = program.blocks.reduce((sum, block) => sum + block.weeks.length, 0);
        // Get current block and week if program has been started
        let currentBlock = null;
        let currentWeek = null;
        let isCompleted = program.currentProgress.completedAt !== null;
        if (program.blocks.length > 0 && blockIndex < program.blocks.length) {
            currentBlock = program.blocks[blockIndex];
            if (currentBlock && weekIndex < currentBlock.weeks.length) {
                currentWeek = currentBlock.weeks[weekIndex];
            }
        }
        const progressData = {
            program: program.toJSON(),
            metadata: {
                totalBlocks: program.blocks.length,
                totalWeeks,
                currentBlockIndex: blockIndex,
                currentWeekIndex: weekIndex,
                currentBlockName: currentBlock?.name || null,
                currentWeekName: currentWeek?.name || null,
                isStarted: program.currentProgress.startedAt !== null,
                isCompleted,
                progressPercentage: totalWeeks > 0 ? Math.round((program.currentProgress.totalWeeksCompleted / totalWeeks) * 100) : 0,
            },
        };
        const response = {
            success: true,
            data: progressData,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch progress',
        });
    }
};
//# sourceMappingURL=programProgress.js.map