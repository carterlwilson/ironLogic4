import { z } from 'zod';
import { DistanceUnit } from '../types/programs.js';
import { ActivityType } from '../types/activityTemplates.js';
export declare const DistanceUnitSchema: z.ZodNativeEnum<typeof DistanceUnit>;
export declare const ActivitySchema: z.ZodObject<{
    activityTemplateId: z.ZodString;
    type: z.ZodNativeEnum<typeof ActivityType>;
    order: z.ZodNumber;
    sets: z.ZodOptional<z.ZodNumber>;
    reps: z.ZodOptional<z.ZodNumber>;
    percentageOfMax: z.ZodOptional<z.ZodNumber>;
    time: z.ZodOptional<z.ZodNumber>;
    distance: z.ZodOptional<z.ZodNumber>;
    distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
}, "strip", z.ZodTypeAny, {
    type: ActivityType;
    activityTemplateId: string;
    order: number;
    time?: number | undefined;
    reps?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}, {
    type: ActivityType;
    activityTemplateId: string;
    order: number;
    time?: number | undefined;
    reps?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}>;
export declare const DaySchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityTemplateId: z.ZodString;
        type: z.ZodNativeEnum<typeof ActivityType>;
        order: z.ZodNumber;
        sets: z.ZodOptional<z.ZodNumber>;
        reps: z.ZodOptional<z.ZodNumber>;
        percentageOfMax: z.ZodOptional<z.ZodNumber>;
        time: z.ZodOptional<z.ZodNumber>;
        distance: z.ZodOptional<z.ZodNumber>;
        distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
    }, "strip", z.ZodTypeAny, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activities: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[];
}, {
    name: string;
    order: number;
    activities?: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[] | undefined;
}>;
export declare const ActivityGroupTargetSchema: z.ZodObject<{
    activityGroupId: z.ZodString;
    targetPercentage: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    activityGroupId: string;
    targetPercentage: number;
}, {
    activityGroupId: string;
    targetPercentage: number;
}>;
export declare const WeekSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>;
    days: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityTemplateId: z.ZodString;
            type: z.ZodNativeEnum<typeof ActivityType>;
            order: z.ZodNumber;
            sets: z.ZodOptional<z.ZodNumber>;
            reps: z.ZodOptional<z.ZodNumber>;
            percentageOfMax: z.ZodOptional<z.ZodNumber>;
            time: z.ZodOptional<z.ZodNumber>;
            distance: z.ZodOptional<z.ZodNumber>;
            distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
        }, "strip", z.ZodTypeAny, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }, {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activityGroupTargets: {
        activityGroupId: string;
        targetPercentage: number;
    }[];
    days: {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }[];
}, {
    name: string;
    order: number;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    days?: {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const BlockSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>;
    weeks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityGroupId: z.ZodString;
            targetPercentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activityGroupId: string;
            targetPercentage: number;
        }, {
            activityGroupId: string;
            targetPercentage: number;
        }>, "many">>;
        days: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
            activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
                activityTemplateId: z.ZodString;
                type: z.ZodNativeEnum<typeof ActivityType>;
                order: z.ZodNumber;
                sets: z.ZodOptional<z.ZodNumber>;
                reps: z.ZodOptional<z.ZodNumber>;
                percentageOfMax: z.ZodOptional<z.ZodNumber>;
                time: z.ZodOptional<z.ZodNumber>;
                distance: z.ZodOptional<z.ZodNumber>;
                distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
            }, "strip", z.ZodTypeAny, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }, {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }, {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activityGroupTargets: {
        activityGroupId: string;
        targetPercentage: number;
    }[];
    weeks: {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }[];
}, {
    name: string;
    order: number;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    weeks?: {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const CreateProgramSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    gymId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gymId: string;
    name: string;
    description?: string | undefined;
}, {
    gymId: string;
    name: string;
    description?: string | undefined;
}>;
export declare const UpdateProgramSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    blocks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityGroupId: z.ZodString;
            targetPercentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activityGroupId: string;
            targetPercentage: number;
        }, {
            activityGroupId: string;
            targetPercentage: number;
        }>, "many">>;
        weeks: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
            activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
                activityGroupId: z.ZodString;
                targetPercentage: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                activityGroupId: string;
                targetPercentage: number;
            }, {
                activityGroupId: string;
                targetPercentage: number;
            }>, "many">>;
            days: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                order: z.ZodNumber;
                activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
                    activityTemplateId: z.ZodString;
                    type: z.ZodNativeEnum<typeof ActivityType>;
                    order: z.ZodNumber;
                    sets: z.ZodOptional<z.ZodNumber>;
                    reps: z.ZodOptional<z.ZodNumber>;
                    percentageOfMax: z.ZodOptional<z.ZodNumber>;
                    time: z.ZodOptional<z.ZodNumber>;
                    distance: z.ZodOptional<z.ZodNumber>;
                    distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
                }, "strip", z.ZodTypeAny, {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }, {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }>, "many">>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                order: number;
                activities: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[];
            }, {
                name: string;
                order: number;
                activities?: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            order: number;
            activityGroupTargets: {
                activityGroupId: string;
                targetPercentage: number;
            }[];
            days: {
                name: string;
                order: number;
                activities: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[];
            }[];
        }, {
            name: string;
            order: number;
            activityGroupTargets?: {
                activityGroupId: string;
                targetPercentage: number;
            }[] | undefined;
            days?: {
                name: string;
                order: number;
                activities?: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[] | undefined;
            }[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        weeks: {
            name: string;
            order: number;
            activityGroupTargets: {
                activityGroupId: string;
                targetPercentage: number;
            }[];
            days: {
                name: string;
                order: number;
                activities: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[];
            }[];
        }[];
    }, {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        weeks?: {
            name: string;
            order: number;
            activityGroupTargets?: {
                activityGroupId: string;
                targetPercentage: number;
            }[] | undefined;
            days?: {
                name: string;
                order: number;
                activities?: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    blocks?: {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        weeks: {
            name: string;
            order: number;
            activityGroupTargets: {
                activityGroupId: string;
                targetPercentage: number;
            }[];
            days: {
                name: string;
                order: number;
                activities: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[];
            }[];
        }[];
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    blocks?: {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        weeks?: {
            name: string;
            order: number;
            activityGroupTargets?: {
                activityGroupId: string;
                targetPercentage: number;
            }[] | undefined;
            days?: {
                name: string;
                order: number;
                activities?: {
                    type: ActivityType;
                    activityTemplateId: string;
                    order: number;
                    time?: number | undefined;
                    reps?: number | undefined;
                    sets?: number | undefined;
                    percentageOfMax?: number | undefined;
                    distance?: number | undefined;
                    distanceUnit?: DistanceUnit | undefined;
                }[] | undefined;
            }[] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const ProgramListParamsSchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    createdBy: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    gymId?: string | undefined;
    search?: string | undefined;
    isActive?: boolean | undefined;
    createdBy?: string | undefined;
}, {
    gymId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    isActive?: boolean | undefined;
    createdBy?: string | undefined;
}>;
export declare const ProgramIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const CreateBlockSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>;
    weeks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityGroupId: z.ZodString;
            targetPercentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activityGroupId: string;
            targetPercentage: number;
        }, {
            activityGroupId: string;
            targetPercentage: number;
        }>, "many">>;
        days: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
            activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
                activityTemplateId: z.ZodString;
                type: z.ZodNativeEnum<typeof ActivityType>;
                order: z.ZodNumber;
                sets: z.ZodOptional<z.ZodNumber>;
                reps: z.ZodOptional<z.ZodNumber>;
                percentageOfMax: z.ZodOptional<z.ZodNumber>;
                time: z.ZodOptional<z.ZodNumber>;
                distance: z.ZodOptional<z.ZodNumber>;
                distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
            }, "strip", z.ZodTypeAny, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }, {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }, {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activityGroupTargets: {
        activityGroupId: string;
        targetPercentage: number;
    }[];
    weeks: {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }[];
}, {
    name: string;
    order: number;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    weeks?: {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const UpdateBlockSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    activityGroupTargets: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>>;
    weeks: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityGroupId: z.ZodString;
            targetPercentage: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            activityGroupId: string;
            targetPercentage: number;
        }, {
            activityGroupId: string;
            targetPercentage: number;
        }>, "many">>;
        days: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            order: z.ZodNumber;
            activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
                activityTemplateId: z.ZodString;
                type: z.ZodNativeEnum<typeof ActivityType>;
                order: z.ZodNumber;
                sets: z.ZodOptional<z.ZodNumber>;
                reps: z.ZodOptional<z.ZodNumber>;
                percentageOfMax: z.ZodOptional<z.ZodNumber>;
                time: z.ZodOptional<z.ZodNumber>;
                distance: z.ZodOptional<z.ZodNumber>;
                distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
            }, "strip", z.ZodTypeAny, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }, {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }, {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }, {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    order?: number | undefined;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    weeks?: {
        name: string;
        order: number;
        activityGroupTargets: {
            activityGroupId: string;
            targetPercentage: number;
        }[];
        days: {
            name: string;
            order: number;
            activities: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[];
        }[];
    }[] | undefined;
}, {
    name?: string | undefined;
    order?: number | undefined;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    weeks?: {
        name: string;
        order: number;
        activityGroupTargets?: {
            activityGroupId: string;
            targetPercentage: number;
        }[] | undefined;
        days?: {
            name: string;
            order: number;
            activities?: {
                type: ActivityType;
                activityTemplateId: string;
                order: number;
                time?: number | undefined;
                reps?: number | undefined;
                sets?: number | undefined;
                percentageOfMax?: number | undefined;
                distance?: number | undefined;
                distanceUnit?: DistanceUnit | undefined;
            }[] | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const CreateWeekSchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activityGroupTargets: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>;
    days: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityTemplateId: z.ZodString;
            type: z.ZodNativeEnum<typeof ActivityType>;
            order: z.ZodNumber;
            sets: z.ZodOptional<z.ZodNumber>;
            reps: z.ZodOptional<z.ZodNumber>;
            percentageOfMax: z.ZodOptional<z.ZodNumber>;
            time: z.ZodOptional<z.ZodNumber>;
            distance: z.ZodOptional<z.ZodNumber>;
            distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
        }, "strip", z.ZodTypeAny, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }, {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activityGroupTargets: {
        activityGroupId: string;
        targetPercentage: number;
    }[];
    days: {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }[];
}, {
    name: string;
    order: number;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    days?: {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const UpdateWeekSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    activityGroupTargets: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityGroupId: z.ZodString;
        targetPercentage: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        activityGroupId: string;
        targetPercentage: number;
    }, {
        activityGroupId: string;
        targetPercentage: number;
    }>, "many">>>;
    days: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        order: z.ZodNumber;
        activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
            activityTemplateId: z.ZodString;
            type: z.ZodNativeEnum<typeof ActivityType>;
            order: z.ZodNumber;
            sets: z.ZodOptional<z.ZodNumber>;
            reps: z.ZodOptional<z.ZodNumber>;
            percentageOfMax: z.ZodOptional<z.ZodNumber>;
            time: z.ZodOptional<z.ZodNumber>;
            distance: z.ZodOptional<z.ZodNumber>;
            distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
        }, "strip", z.ZodTypeAny, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }, {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }, {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    order?: number | undefined;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    days?: {
        name: string;
        order: number;
        activities: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[];
    }[] | undefined;
}, {
    name?: string | undefined;
    order?: number | undefined;
    activityGroupTargets?: {
        activityGroupId: string;
        targetPercentage: number;
    }[] | undefined;
    days?: {
        name: string;
        order: number;
        activities?: {
            type: ActivityType;
            activityTemplateId: string;
            order: number;
            time?: number | undefined;
            reps?: number | undefined;
            sets?: number | undefined;
            percentageOfMax?: number | undefined;
            distance?: number | undefined;
            distanceUnit?: DistanceUnit | undefined;
        }[] | undefined;
    }[] | undefined;
}>;
export declare const CreateDaySchema: z.ZodObject<{
    name: z.ZodString;
    order: z.ZodNumber;
    activities: z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityTemplateId: z.ZodString;
        type: z.ZodNativeEnum<typeof ActivityType>;
        order: z.ZodNumber;
        sets: z.ZodOptional<z.ZodNumber>;
        reps: z.ZodOptional<z.ZodNumber>;
        percentageOfMax: z.ZodOptional<z.ZodNumber>;
        time: z.ZodOptional<z.ZodNumber>;
        distance: z.ZodOptional<z.ZodNumber>;
        distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
    }, "strip", z.ZodTypeAny, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    order: number;
    activities: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[];
}, {
    name: string;
    order: number;
    activities?: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[] | undefined;
}>;
export declare const UpdateDaySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    activities: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        activityTemplateId: z.ZodString;
        type: z.ZodNativeEnum<typeof ActivityType>;
        order: z.ZodNumber;
        sets: z.ZodOptional<z.ZodNumber>;
        reps: z.ZodOptional<z.ZodNumber>;
        percentageOfMax: z.ZodOptional<z.ZodNumber>;
        time: z.ZodOptional<z.ZodNumber>;
        distance: z.ZodOptional<z.ZodNumber>;
        distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
    }, "strip", z.ZodTypeAny, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }, {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    order?: number | undefined;
    activities?: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[] | undefined;
}, {
    name?: string | undefined;
    order?: number | undefined;
    activities?: {
        type: ActivityType;
        activityTemplateId: string;
        order: number;
        time?: number | undefined;
        reps?: number | undefined;
        sets?: number | undefined;
        percentageOfMax?: number | undefined;
        distance?: number | undefined;
        distanceUnit?: DistanceUnit | undefined;
    }[] | undefined;
}>;
export declare const CreateActivitySchema: z.ZodObject<{
    activityTemplateId: z.ZodString;
    type: z.ZodNativeEnum<typeof ActivityType>;
    order: z.ZodNumber;
    sets: z.ZodOptional<z.ZodNumber>;
    reps: z.ZodOptional<z.ZodNumber>;
    percentageOfMax: z.ZodOptional<z.ZodNumber>;
    time: z.ZodOptional<z.ZodNumber>;
    distance: z.ZodOptional<z.ZodNumber>;
    distanceUnit: z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>;
}, "strip", z.ZodTypeAny, {
    type: ActivityType;
    activityTemplateId: string;
    order: number;
    time?: number | undefined;
    reps?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}, {
    type: ActivityType;
    activityTemplateId: string;
    order: number;
    time?: number | undefined;
    reps?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}>;
export declare const UpdateActivitySchema: z.ZodObject<{
    activityTemplateId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ActivityType>>;
    order: z.ZodOptional<z.ZodNumber>;
    sets: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    reps: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    percentageOfMax: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    time: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    distance: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    distanceUnit: z.ZodOptional<z.ZodOptional<z.ZodNativeEnum<typeof DistanceUnit>>>;
}, "strip", z.ZodTypeAny, {
    time?: number | undefined;
    reps?: number | undefined;
    type?: ActivityType | undefined;
    activityTemplateId?: string | undefined;
    order?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}, {
    time?: number | undefined;
    reps?: number | undefined;
    type?: ActivityType | undefined;
    activityTemplateId?: string | undefined;
    order?: number | undefined;
    sets?: number | undefined;
    percentageOfMax?: number | undefined;
    distance?: number | undefined;
    distanceUnit?: DistanceUnit | undefined;
}>;
export declare const JumpToWeekSchema: z.ZodObject<{
    blockIndex: z.ZodNumber;
    weekIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    blockIndex: number;
    weekIndex: number;
}, {
    blockIndex: number;
    weekIndex: number;
}>;
export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;
export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;
export type ProgramListParamsInput = z.infer<typeof ProgramListParamsSchema>;
export type ProgramIdInput = z.infer<typeof ProgramIdSchema>;
export type CreateBlockInput = z.infer<typeof CreateBlockSchema>;
export type UpdateBlockInput = z.infer<typeof UpdateBlockSchema>;
export type CreateWeekInput = z.infer<typeof CreateWeekSchema>;
export type UpdateWeekInput = z.infer<typeof UpdateWeekSchema>;
export type CreateDayInput = z.infer<typeof CreateDaySchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
export type JumpToWeekInput = z.infer<typeof JumpToWeekSchema>;
//# sourceMappingURL=programs.d.ts.map