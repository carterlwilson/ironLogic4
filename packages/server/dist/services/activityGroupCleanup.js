"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupActivityTemplateReferences = void 0;
const ActivityTemplate_1 = require("../models/ActivityTemplate");
const cleanupActivityTemplateReferences = async (groupId) => {
    try {
        console.log(`Starting cleanup of ActivityTemplate references for group: ${groupId}`);
        const result = await ActivityTemplate_1.ActivityTemplate.updateMany({ groupId: groupId }, { $unset: { groupId: 1 } });
        console.log(`Cleanup completed: Updated ${result.modifiedCount} ActivityTemplate(s) to remove references to group ${groupId}`);
    }
    catch (error) {
        console.error(`Error during ActivityTemplate cleanup for group ${groupId}:`, error);
    }
};
exports.cleanupActivityTemplateReferences = cleanupActivityTemplateReferences;
//# sourceMappingURL=activityGroupCleanup.js.map