"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/admin/users"));
const gyms_1 = __importDefault(require("./routes/admin/gyms"));
const activityTemplates_1 = __importDefault(require("./routes/gym/activityTemplates"));
const activityGroups_1 = __importDefault(require("./routes/gym/activityGroups"));
const clients_1 = __importDefault(require("./routes/gym/clients"));
const coaches_1 = __importDefault(require("./routes/gym/coaches"));
const benchmarkTemplates_1 = __importDefault(require("./routes/gym/benchmarkTemplates"));
const programs_1 = __importDefault(require("./routes/gym/programs"));
const schedules_1 = __importDefault(require("./routes/gym/schedules"));
const me_1 = __importDefault(require("./routes/me"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 in prod, 1000 in dev
    message: 'Too many requests from this IP, please try again later.'
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Only apply rate limiting if not explicitly disabled
if (process.env.DISABLE_RATE_LIMIT !== 'true') {
    app.use(limiter);
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/admin/users', users_1.default);
app.use('/api/admin/gyms', gyms_1.default);
app.use('/api/gym/activity-templates', activityTemplates_1.default);
app.use('/api/gym/activity-groups', activityGroups_1.default);
app.use('/api/gym/clients', clients_1.default);
app.use('/api/gym/coaches', coaches_1.default);
app.use('/api/gym/benchmark-templates', benchmarkTemplates_1.default);
app.use('/api/gym/programs', programs_1.default);
app.use('/api/gym/schedules', schedules_1.default);
app.use('/api/me', me_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};
startServer().catch(console.error);
//# sourceMappingURL=index.js.map