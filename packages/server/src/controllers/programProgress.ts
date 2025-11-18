import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Program } from '../models/Program.js';
import { ApiResponse, ProgramIdSchema, JumpToWeekSchema } from '@ironlogic4/shared';

/**
 * Update Progress - Set program to a specific block and week position
 * Auto-calculates totalWeeksCompleted, manages startedAt and completedAt timestamps
 */
export const updateProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    const query: any = { _id: id };
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

    // Validate blockIndex is within program structure
    if (blockIndex >= program.blocks.length) {
      res.status(400).json({
        success: false,
        error: `Block index ${blockIndex} is out of range. Program has ${program.blocks.length} blocks.`,
      });
      return;
    }

    const targetBlock = program.blocks[blockIndex];

    // Validate weekIndex is within block structure
    if (weekIndex >= targetBlock.weeks.length) {
      res.status(400).json({
        success: false,
        error: `Week index ${weekIndex} is out of range. Block ${blockIndex} has ${targetBlock.weeks.length} weeks.`,
      });
      return;
    }

    // Auto-calculate totalWeeksCompleted
    // Sum all weeks in blocks before the current blockIndex, then add weekIndex
    let totalWeeksCompleted = 0;
    for (let i = 0; i < blockIndex; i++) {
      totalWeeksCompleted += program.blocks[i].weeks.length;
    }
    totalWeeksCompleted += weekIndex;

    // Auto-set startedAt if null (first time setting progress)
    if (program.currentProgress.startedAt === null) {
      program.currentProgress.startedAt = new Date();
    }

    // Update progress position
    program.currentProgress.blockIndex = blockIndex;
    program.currentProgress.weekIndex = weekIndex;
    program.currentProgress.totalWeeksCompleted = totalWeeksCompleted;
    program.currentProgress.lastAdvancedAt = new Date();

    // Auto-detect completion: if on last block AND last week, set completedAt
    const isLastBlock = blockIndex === program.blocks.length - 1;
    const isLastWeek = weekIndex === targetBlock.weeks.length - 1;

    if (isLastBlock && isLastWeek) {
      program.currentProgress.completedAt = new Date();
    } else {
      program.currentProgress.completedAt = null;
    }

    await program.save();

    const response: ApiResponse<any> = {
      success: true,
      data: program.toJSON(),
      message: `Updated progress to block ${blockIndex}, week ${weekIndex}`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress',
    });
  }
};

/**
 * Advance Week - Move to next week with block advancement logic
 */
export const advanceWeek = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    const query: any = { _id: id };
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

        const response: ApiResponse<any> = {
          success: true,
          data: program.toJSON(),
          message: 'Program completed successfully',
        };

        res.json(response);
        return;
      } else {
        // Move to first week of next block
        program.currentProgress.blockIndex += 1;
        program.currentProgress.weekIndex = 0;
        program.currentProgress.lastAdvancedAt = new Date();
        program.currentProgress.totalWeeksCompleted += 1;
      }
    } else {
      // Move to next week in current block
      program.currentProgress.weekIndex += 1;
      program.currentProgress.lastAdvancedAt = new Date();
      program.currentProgress.totalWeeksCompleted += 1;
    }

    await program.save();

    const response: ApiResponse<any> = {
      success: true,
      data: program.toJSON(),
      message: 'Advanced to next week successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error advancing week:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to advance week',
    });
  }
};

/**
 * Get Current Progress - Get progress with metadata
 */
export const getCurrentProgress = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    const query: any = { _id: id };
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

    const response: ApiResponse<any> = {
      success: true,
      data: progressData,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress',
    });
  }
};