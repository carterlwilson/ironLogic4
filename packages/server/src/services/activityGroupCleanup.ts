import { ActivityTemplate } from '../models/ActivityTemplate';

export const cleanupActivityTemplateReferences = async (groupId: string): Promise<void> => {
  try {
    console.log(`Starting cleanup of ActivityTemplate references for group: ${groupId}`);

    const result = await ActivityTemplate.updateMany(
      { groupId: groupId },
      { $unset: { groupId: 1 } }
    );

    console.log(`Cleanup completed: Updated ${result.modifiedCount} ActivityTemplate(s) to remove references to group ${groupId}`);
  } catch (error) {
    console.error(`Error during ActivityTemplate cleanup for group ${groupId}:`, error);
  }
};