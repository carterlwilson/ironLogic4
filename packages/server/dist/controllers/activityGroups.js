import { ActivityGroup } from '../models/ActivityGroup.js';
import { CreateActivityGroupSchema, UpdateActivityGroupSchema, ActivityGroupListParamsSchema, ActivityGroupIdSchema } from '@ironlogic4/shared';
import { cleanupActivityTemplateReferences } from '../services/activityGroupCleanup.js';
export const getAllActivityGroups = async (req, res) => {
    try {
        const validation = ActivityGroupListParamsSchema.safeParse(req.query);
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
        const query = {};
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        if (search) {
            query.$text = { $search: search };
        }
        const [groups, total] = await Promise.all([
            ActivityGroup.find(query)
                .populate('gymId', 'name')
                .populate('createdBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ActivityGroup.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: groups.map(g => g.toJSON()),
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
        console.error('Error fetching activity groups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity groups',
        });
    }
};
export const getActivityGroupById = async (req, res) => {
    try {
        const validation = ActivityGroupIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid activity group ID',
            });
            return;
        }
        const { id } = validation.data;
        const group = await ActivityGroup.findById(id)
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        if (!group) {
            res.status(404).json({
                success: false,
                error: 'Activity group not found',
            });
            return;
        }
        if (req.user?.userType === 'owner' && group.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s groups.',
            });
            return;
        }
        const response = {
            success: true,
            data: group.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching activity group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity group',
        });
    }
};
export const createActivityGroup = async (req, res) => {
    try {
        const validation = CreateActivityGroupSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid activity group data',
                details: validation.error.errors,
            });
            return;
        }
        const groupData = validation.data;
        if (req.user?.userType === 'owner') {
            if (groupData.gymId !== req.user.gymId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only create groups for your own gym',
                });
                return;
            }
        }
        const newGroup = new ActivityGroup({
            ...groupData,
            createdBy: req.user.id,
        });
        const savedGroup = await newGroup.save();
        await savedGroup.populate('gymId', 'name');
        await savedGroup.populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: savedGroup.toJSON(),
            message: 'Activity group created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating activity group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create activity group',
        });
    }
};
export const updateActivityGroup = async (req, res) => {
    try {
        const paramsValidation = ActivityGroupIdSchema.safeParse(req.params);
        const bodyValidation = UpdateActivityGroupSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const updateData = bodyValidation.data;
        const group = await ActivityGroup.findById(id);
        if (!group) {
            res.status(404).json({
                success: false,
                error: 'Activity group not found',
            });
            return;
        }
        if (req.user?.userType === 'owner' && group.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own gym\'s groups.',
            });
            return;
        }
        const updatedGroup = await ActivityGroup.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: updatedGroup ? updatedGroup.toJSON() : null,
            message: 'Activity group updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating activity group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update activity group',
        });
    }
};
export const deleteActivityGroup = async (req, res) => {
    try {
        const validation = ActivityGroupIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid activity group ID',
            });
            return;
        }
        const { id } = validation.data;
        const group = await ActivityGroup.findById(id);
        if (!group) {
            res.status(404).json({
                success: false,
                error: 'Activity group not found',
            });
            return;
        }
        if (req.user?.userType === 'owner' && group.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s groups.',
            });
            return;
        }
        await ActivityGroup.findByIdAndDelete(id);
        setImmediate(() => {
            cleanupActivityTemplateReferences(id);
        });
        const response = {
            success: true,
            message: 'Activity group deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting activity group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete activity group',
        });
    }
};
//# sourceMappingURL=activityGroups.js.map