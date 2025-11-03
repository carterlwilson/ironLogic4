Go into plan mode.

I'm now seeing all the following errors in my deployment, why?

src/controllers/activeSchedules.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/activeSchedules.ts(3,32): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActiveSchedule.js'?

src/controllers/activeSchedules.ts(4,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ScheduleTemplate.js'?

src/controllers/activeSchedules.ts(5,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/activeSchedules.ts(70,45): error TS7006: Parameter 'schedule' implicitly has an 'any' type.

src/controllers/activeSchedules.ts(385,40): error TS7006: Parameter 'templateDay' implicitly has an 'any' type.

src/controllers/activeSchedules.ts(385,53): error TS7006: Parameter 'dayIndex' implicitly has an 'any' type.

src/controllers/activeSchedules.ts(389,47): error TS7006: Parameter 'templateSlot' implicitly has an 'any' type.

src/controllers/activeSchedules.ts(392,13): error TS7006: Parameter 's' implicitly has an 'any' type.

src/controllers/activityGroups.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/activityGroups.ts(3,31): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActivityGroup.js'?

src/controllers/activityGroups.ts(5,51): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../services/activityGroupCleanup.js'?

src/controllers/activityGroups.ts(52,24): error TS7006: Parameter 'g' implicitly has an 'any' type.

src/controllers/activityTemplates.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/activityTemplates.ts(3,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActivityTemplate.js'?

src/controllers/activityTemplates.ts(65,27): error TS7006: Parameter 't' implicitly has an 'any' type.

src/controllers/auth.ts(4,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/auth.ts(5,21): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Gym.js'?

src/controllers/auth.ts(6,31): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../utils/auth.js'?

src/controllers/benchmarkProgress.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/benchmarkProgress.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/benchmarkProgress.ts(4,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/BenchmarkTemplate.js'?

src/controllers/benchmarkTemplates.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/benchmarkTemplates.ts(3,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/BenchmarkTemplate.js'?

src/controllers/benchmarkTemplates.ts(73,27): error TS7006: Parameter 't' implicitly has an 'any' type.

src/controllers/clientBenchmarks.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/clientBenchmarks.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/clientBenchmarks.ts(4,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/BenchmarkTemplate.js'?

src/controllers/clientBenchmarks.ts(97,10): error TS7006: Parameter 'b' implicitly has an 'any' type.

src/controllers/clientBenchmarks.ts(205,8): error TS7006: Parameter 'b' implicitly has an 'any' type.

src/controllers/clientBenchmarks.ts(212,10): error TS7006: Parameter 'b' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/clientSchedules.ts(3,32): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActiveSchedule.js'?

src/controllers/clientSchedules.ts(4,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/clientSchedules.ts(82,23): error TS7006: Parameter 'schedule' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(83,33): error TS7006: Parameter 'coachId' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(94,19): error TS7006: Parameter 'coach' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(109,45): error TS7006: Parameter 'schedule' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(170,39): error TS7006: Parameter 'schedule' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(171,46): error TS7006: Parameter 'day' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(172,56): error TS7006: Parameter 'slot' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(179,17): error TS7006: Parameter 'day' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(187,15): error TS7006: Parameter 'schedule' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(264,39): error TS7006: Parameter 's' implicitly has an 'any' type.

src/controllers/clientSchedules.ts(307,43): error TS7006: Parameter 's' implicitly has an 'any' type.

src/controllers/clients.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/clients.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/clients.ts(4,25): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Program.js'?

src/controllers/clients.ts(14,40): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../utils/auth.js'?

src/controllers/clients.ts(69,25): error TS7006: Parameter 'client' implicitly has an 'any' type.

src/controllers/coaches.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/coaches.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/coaches.ts(4,32): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActiveSchedule.js'?

src/controllers/coaches.ts(15,54): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../utils/auth.js'?

src/controllers/coaches.ts(70,25): error TS7006: Parameter 'coach' implicitly has an 'any' type.

src/controllers/gyms.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/gyms.ts(3,21): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Gym.js'?

src/controllers/gyms.ts(4,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/gyms.ts(64,22): error TS7006: Parameter 'gym' implicitly has an 'any' type.

src/controllers/programProgress.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/programProgress.ts(3,25): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Program.js'?

src/controllers/programProgress.ts(522,47): error TS7006: Parameter 'sum' implicitly has an 'any' type.

src/controllers/programProgress.ts(522,52): error TS7006: Parameter 'block' implicitly has an 'any' type.

src/controllers/programs.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/programs.ts(3,25): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Program.js'?

src/controllers/programs.ts(75,26): error TS7006: Parameter 'program' implicitly has an 'any' type.

src/controllers/scheduleTemplates.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/scheduleTemplates.ts(3,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ScheduleTemplate.js'?

src/controllers/scheduleTemplates.ts(4,32): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActiveSchedule.js'?

src/controllers/scheduleTemplates.ts(5,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/scheduleTemplates.ts(31,35): error TS7006: Parameter 'coach' implicitly has an 'any' type.

src/controllers/scheduleTemplates.ts(38,5): error TS7006: Parameter 'coach' implicitly has an 'any' type.

src/controllers/scheduleTemplates.ts(79,27): error TS7006: Parameter 'template' implicitly has an 'any' type.

src/controllers/scheduleTemplates.ts(222,75): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

Type 'undefined' is not assignable to type 'string'.
src/controllers/users.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/users.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/users.ts(8,40): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../utils/auth.js'?

src/controllers/users.ts(69,23): error TS7006: Parameter 'u' implicitly has an 'any' type.

src/controllers/workouts.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../middleware/auth.js'?

src/controllers/workouts.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/controllers/workouts.ts(4,25): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/Program.js'?

src/controllers/workouts.ts(5,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActivityTemplate.js'?

src/controllers/workouts.ts(6,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/BenchmarkTemplate.js'?

src/controllers/workouts.ts(119,30): error TS7006: Parameter 'day' implicitly has an 'any' type.

src/controllers/workouts.ts(120,30): error TS7006: Parameter 'activity' implicitly has an 'any' type.

src/controllers/workouts.ts(134,29): error TS7006: Parameter 'template' implicitly has an 'any' type.

src/controllers/workouts.ts(141,31): error TS7006: Parameter 'template' implicitly has an 'any' type.

src/controllers/workouts.ts(148,44): error TS7006: Parameter 'benchmark' implicitly has an 'any' type.

src/controllers/workouts.ts(169,42): error TS7006: Parameter 'benchmark' implicitly has an 'any' type.

src/controllers/workouts.ts(176,47): error TS7006: Parameter 'day' implicitly has an 'any' type.

src/controllers/workouts.ts(177,53): error TS7006: Parameter 'activity' implicitly has an 'any' type.

src/controllers/workouts.ts(206,42): error TS2339: Property 'benchmarkTemplateId' does not exist on type '{}'.

src/controllers/workouts.ts(211,58): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.

Type 'undefined' is not assignable to type 'string'.
src/controllers/workouts.ts(214,27): error TS2339: Property 'type' does not exist on type '{}'.

src/controllers/workouts.ts(214,70): error TS2339: Property 'weightKg' does not exist on type '{}'.

src/controllers/workouts.ts(215,45): error TS2339: Property 'weightKg' does not exist on type '{}'.

src/controllers/workouts.ts(216,44): error TS2339: Property 'weightKg' does not exist on type '{}'.

src/controllers/workouts.ts(233,34): error TS2339: Property 'name' does not exist on type '{}'.

src/controllers/workouts.ts(234,35): error TS2339: Property 'notes' does not exist on type '{}'.

src/index.ts(7,24): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/auth.js'?

src/index.ts(8,29): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/admin/users.js'?

src/index.ts(9,28): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/admin/gyms.js'?

src/index.ts(10,39): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/activityTemplates.js'?

src/index.ts(11,36): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/activityGroups.js'?

src/index.ts(12,29): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/clients.js'?

src/index.ts(13,28): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/coaches.js'?

src/index.ts(14,40): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/benchmarkTemplates.js'?

src/index.ts(15,30): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/programs.js'?

src/index.ts(16,31): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './routes/gym/schedules.js'?

src/index.ts(17,22): error TS2834: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Consider adding an extension to the import path.

src/middleware/auth.ts(4,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/middleware/requireClient.ts(2,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './auth.js'?

src/models/User.ts(3,47): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../utils/auth.js'?

src/models/User.ts(4,64): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './ClientBenchmark.js'?

src/routes/admin/gyms.ts(8,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/gyms.js'?

src/routes/admin/gyms.ts(9,43): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/admin/users.ts(6,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/admin/users.ts(14,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/users.js'?

src/routes/auth.ts(2,41): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../controllers/auth.js'?

src/routes/gym/activityGroups.ts(6,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/activityGroups.ts(13,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/activityGroups.js'?

src/routes/gym/activityTemplates.ts(6,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/activityTemplates.ts(13,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/activityTemplates.js'?

src/routes/gym/benchmarkTemplates.ts(2,56): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/benchmarkTemplates.ts(9,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/benchmarkTemplates.js'?

src/routes/gym/clients.ts(5,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/clients.ts(14,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/clients.js'?

src/routes/gym/coaches.ts(5,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/coaches.ts(13,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/coaches.js'?

src/routes/gym/programProgress.ts(2,29): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/programProgress.ts(10,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/programProgress.js'?

src/routes/gym/programs.ts(5,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/programs.ts(12,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/programs.js'?

src/routes/gym/programs.ts(13,35): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './programProgress.js'?

src/routes/gym/schedules.ts(6,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/gym/schedules.ts(13,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/scheduleTemplates.js'?

src/routes/gym/schedules.ts(22,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/activeSchedules.js'?

src/routes/gym/schedules.ts(28,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/clientSchedules.js'?

src/routes/me/benchmarks.ts(2,29): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/me/benchmarks.ts(3,31): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/requireClient.js'?

src/routes/me/benchmarks.ts(8,8): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/clientBenchmarks.js'?

src/routes/me/benchmarks.ts(9,38): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/benchmarkProgress.js'?

src/routes/me/index.ts(2,30): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './benchmarks.js'?

src/routes/me/index.ts(3,28): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './workouts.js'?

src/routes/me/workouts.ts(2,29): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/auth.js'?

src/routes/me/workouts.ts(3,31): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../middleware/requireClient.js'?

src/routes/me/workouts.ts(4,40): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../../controllers/workouts.js'?

src/scripts/addClients.ts(3,22): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/User.js'?

src/services/ScheduleResetService.ts(1,32): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActiveSchedule.js'?

src/services/ScheduleResetService.ts(2,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ScheduleTemplate.js'?

src/services/activityGroupCleanup.ts(1,34): error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean '../models/ActivityTemplate.js'?

npm error Lifecycle script `build` failed with error:
