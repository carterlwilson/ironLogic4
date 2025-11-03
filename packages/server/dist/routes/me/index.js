import express from 'express';
import benchmarksRouter from './benchmarks.js';
import workoutsRouter from './workouts.js';
const router = express.Router();
// Mount sub-routers
router.use('/benchmarks', benchmarksRouter);
router.use('/workouts', workoutsRouter);
// Future self-service endpoints can be added here:
// router.use('/profile', profileRouter);
export default router;
//# sourceMappingURL=index.js.map