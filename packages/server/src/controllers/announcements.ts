import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Announcement } from '../models/Announcement.js';
import { ApiResponse } from '@ironlogic4/shared/types/api';
import { UpsertAnnouncementSchema } from '@ironlogic4/shared/schemas/announcements';
import { sanitizeAnnouncementHtml } from '../utils/sanitizeHtml.js';

/**
 * GET /api/gym/announcements
 * Get announcement for the user's gym
 */
export const getAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Determine gymId based on user type
    let gymId: string | undefined;

    if (req.user?.userType === 'owner' || req.user?.userType === 'coach') {
      gymId = req.user.gymId;
    } else if (req.user?.userType === 'admin') {
      // Admin can query by gymId parameter
      gymId = req.query.gymId as string;
    }

    if (!gymId) {
      res.status(400).json({
        success: false,
        error: 'Gym ID is required',
      } as ApiResponse);
      return;
    }

    const announcement = await Announcement.findOne({ gymId });

    if (!announcement) {
      // Return success with null data if no announcement exists
      res.json({
        success: true,
        data: null,
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: announcement.toJSON(),
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcement',
    } as ApiResponse);
  }
};

/**
 * PUT /api/gym/announcements
 * Upsert announcement for the user's gym
 */
export const upsertAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validation = UpsertAnnouncementSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid announcement data',
        message: validation.error.errors.map((e: any) => e.message).join(', '),
      } as ApiResponse);
      return;
    }

    const { content } = validation.data;

    // Sanitize HTML content
    const sanitizedContent = sanitizeAnnouncementHtml(content);

    // Determine gymId based on user type
    let gymId: string | undefined;

    if (req.user?.userType === 'owner') {
      gymId = req.user.gymId;
    } else if (req.user?.userType === 'admin') {
      // Admin must provide gymId in request body
      gymId = req.body.gymId;
    }

    if (!gymId) {
      res.status(400).json({
        success: false,
        error: 'Gym ID is required',
      } as ApiResponse);
      return;
    }

    // Upsert announcement
    const announcement = await Announcement.findOneAndUpdate(
      { gymId },
      {
        content: sanitizedContent,
      },
      {
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: announcement.toJSON(),
      message: 'Announcement saved successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error upserting announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save announcement',
    } as ApiResponse);
  }
};

/**
 * DELETE /api/gym/announcements
 * Delete announcement for the user's gym
 */
export const deleteAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Determine gymId based on user type
    let gymId: string | undefined;

    if (req.user?.userType === 'owner') {
      gymId = req.user.gymId;
    } else if (req.user?.userType === 'admin') {
      gymId = req.query.gymId as string;
    }

    if (!gymId) {
      res.status(400).json({
        success: false,
        error: 'Gym ID is required',
      } as ApiResponse);
      return;
    }

    const result = await Announcement.findOneAndDelete({ gymId });

    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Announcement not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete announcement',
    } as ApiResponse);
  }
};
