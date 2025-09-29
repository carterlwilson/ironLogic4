import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Gym } from '../models/Gym';
import { CreateGymSchema } from '@ironlogic4/shared/schemas/gyms';
import { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import { z } from 'zod';

// Update gym schema for validation
const UpdateGymSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phoneNumber: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

/**
 * Get all gyms with pagination
 */
export const getAllGyms = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search as string;
    const ownerIdFilter = req.query.ownerId as string;

    // Ensure limit is reasonable
    const maxLimit = Math.min(limit, 100);

    // Build query object
    let query: any = {};

    // Add search functionality (name, address)
    if (searchQuery && searchQuery.trim()) {
      query.$or = [
        { name: { $regex: searchQuery.trim(), $options: 'i' } },
        { address: { $regex: searchQuery.trim(), $options: 'i' } }
      ];
    }

    // Add owner filtering
    if (ownerIdFilter) {
      query.ownerId = ownerIdFilter;
    }

    const [gyms, total] = await Promise.all([
      Gym.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      Gym.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / maxLimit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: gyms,
      pagination: {
        page,
        limit: maxLimit,
        total,
        totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching gyms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gyms',
    } as ApiResponse);
  }
};

/**
 * Get gym by ID
 */
export const getGymById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const gym = await Gym.findById(id);

    if (!gym) {
      res.status(404).json({
        success: false,
        error: 'Gym not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: gym,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching gym:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gym',
    } as ApiResponse);
  }
};

/**
 * Create new gym (admin only)
 */
export const createGym = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = CreateGymSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid gym data',
        message: validationResult.error.errors.map(e => e.message).join(', '),
      } as ApiResponse);
      return;
    }

    const { name, address, phoneNumber, ownerId } = validationResult.data;

    // Check if gym with same name already exists
    const existingGym = await Gym.findOne({ name });
    if (existingGym) {
      res.status(409).json({
        success: false,
        error: 'Gym with this name already exists',
      } as ApiResponse);
      return;
    }

    // Create new gym
    const gym = new Gym({
      name,
      address,
      phoneNumber,
      ownerId,
    });

    await gym.save();

    // Return gym data
    const gymResponse = gym.toJSON();

    res.status(201).json({
      success: true,
      data: gymResponse,
      message: 'Gym created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating gym:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create gym',
    } as ApiResponse);
  }
};

/**
 * Update gym (admin only)
 */
export const updateGym = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = UpdateGymSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid update data',
        message: validationResult.error.errors.map(e => e.message).join(', '),
      } as ApiResponse);
      return;
    }

    const updateData = validationResult.data;

    // Find the gym to update
    const existingGym = await Gym.findById(id);
    if (!existingGym) {
      res.status(404).json({
        success: false,
        error: 'Gym not found',
      } as ApiResponse);
      return;
    }

    // Check if name is being updated and if it's already taken
    if (updateData.name && updateData.name !== existingGym.name) {
      const nameExists = await Gym.findOne({ name: updateData.name });
      if (nameExists) {
        res.status(409).json({
          success: false,
          error: 'Gym name is already in use',
        } as ApiResponse);
        return;
      }
    }

    // Update gym
    const updatedGym = await Gym.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGym) {
      res.status(404).json({
        success: false,
        error: 'Gym not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: updatedGym,
      message: 'Gym updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating gym:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update gym',
    } as ApiResponse);
  }
};

/**
 * Delete gym (admin only)
 */
export const deleteGym = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const gym = await Gym.findByIdAndDelete(id);

    if (!gym) {
      res.status(404).json({
        success: false,
        error: 'Gym not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Gym deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting gym:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete gym',
    } as ApiResponse);
  }
};