// Bootstraps fixtures for the integration suite: a test gym, a CLIENT-type user, and one
// BenchmarkTemplate per BenchmarkType. Writes directly to MongoDB (bypassing the real app's
// models) because there is no seed script and no way to create the first user via the API
// alone. Runs once, in Jest's main process, before any test file starts.
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_CLIENT_EMAIL = 'test-integration-client@ironlogic4.test';
const TEST_CLIENT_PASSWORD = 'TestPassword123!';
const TEST_GYM_NAME = 'TEST_IntegrationSuite_Gym';

// Ad-hoc schemas mirroring packages/server/src/models/{User,Gym,BenchmarkTemplate}.ts closely
// enough to produce valid documents. Deliberately not importing the real src/ models: this repo
// compiles as native ESM (package.json "type": "module") and Jest's default runtime is CommonJS,
// so importing real src/ files here would hit an ESM/CJS mismatch. If those model files' required
// fields change, mirror the change here too.
const userSchema = new mongoose.Schema(
  {
    email: String,
    firstName: String,
    lastName: String,
    userType: String,
    password: String,
    gymId: String,
    currentBenchmarks: { type: Array, default: [] },
    historicalBenchmarks: { type: Array, default: [] },
  },
  { timestamps: true }
);

const gymSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    phoneNumber: String,
    ownerId: String,
  },
  { timestamps: true }
);

const templateRepMaxSchema = new mongoose.Schema({ reps: Number, name: String });
const templateTimeSubMaxSchema = new mongoose.Schema({ name: String });
const templateDistanceSubMaxSchema = new mongoose.Schema({ name: String });

const benchmarkTemplateSchema = new mongoose.Schema(
  {
    name: String,
    notes: String,
    type: String,
    tags: { type: [String], default: [] },
    templateRepMaxes: { type: [templateRepMaxSchema], default: [] },
    templateTimeSubMaxes: { type: [templateTimeSubMaxSchema], default: [] },
    templateDistanceSubMaxes: { type: [templateDistanceSubMaxSchema], default: [] },
    distanceUnit: String,
    gymId: String,
    createdBy: String,
  },
  { timestamps: true }
);

module.exports = async function globalSetup() {
  await mongoose.connect(MONGODB_URI);

  const UserModel = mongoose.model('User', userSchema);
  const GymModel = mongoose.model('Gym', gymSchema);
  const BenchmarkTemplateModel = mongoose.model('BenchmarkTemplate', benchmarkTemplateSchema);

  // Safety sweep: clean up any leftover fixture from a crashed prior run.
  const leftoverUser = await UserModel.findOne({ email: TEST_CLIENT_EMAIL });
  if (leftoverUser) {
    await GymModel.deleteMany({ ownerId: leftoverUser._id.toString() });
    await BenchmarkTemplateModel.deleteMany({ createdBy: leftoverUser._id.toString() });
    await UserModel.deleteOne({ _id: leftoverUser._id });
  }

  const hashedPassword = await bcrypt.hash(TEST_CLIENT_PASSWORD, 12);
  const user = await UserModel.create({
    email: TEST_CLIENT_EMAIL,
    firstName: 'TEST_Integration',
    lastName: 'Client',
    userType: 'client',
    password: hashedPassword,
  });

  const gym = await GymModel.create({
    name: TEST_GYM_NAME,
    address: '123 Test St',
    phoneNumber: '555-0100',
    ownerId: user._id.toString(),
  });

  user.gymId = gym._id.toString();
  await user.save();

  const weightTemplate = await BenchmarkTemplateModel.create({
    name: 'TEST_Weight_Benchmark',
    type: 'weight',
    templateRepMaxes: [
      { reps: 1, name: '1RM' },
      { reps: 3, name: '3RM' },
      { reps: 5, name: '5RM' },
      { reps: 10, name: '10RM' },
    ],
    gymId: gym._id.toString(),
    createdBy: user._id.toString(),
  });

  const distanceTemplate = await BenchmarkTemplateModel.create({
    name: 'TEST_Distance_Benchmark',
    type: 'distance',
    templateTimeSubMaxes: [{ name: '1 min' }, { name: '3 min' }, { name: '5 min' }],
    distanceUnit: 'meters',
    gymId: gym._id.toString(),
    createdBy: user._id.toString(),
  });

  const timeTemplate = await BenchmarkTemplateModel.create({
    name: 'TEST_Time_Benchmark',
    type: 'time',
    templateDistanceSubMaxes: [{ name: '100m' }, { name: '500m' }, { name: '1 mile' }],
    distanceUnit: 'meters',
    gymId: gym._id.toString(),
    createdBy: user._id.toString(),
  });

  const repsTemplate = await BenchmarkTemplateModel.create({
    name: 'TEST_Reps_Benchmark',
    type: 'reps',
    gymId: gym._id.toString(),
    createdBy: user._id.toString(),
  });

  const otherTemplate = await BenchmarkTemplateModel.create({
    name: 'TEST_Other_Benchmark',
    type: 'other',
    gymId: gym._id.toString(),
    createdBy: user._id.toString(),
  });

  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_CLIENT_EMAIL, password: TEST_CLIENT_PASSWORD }),
  }).catch(() => {
    throw new Error(
      `Could not reach the dev server at ${BASE_URL}. Start it with: npm run dev -w packages/server`
    );
  });

  if (!loginResponse.ok) {
    throw new Error(`Login for test fixture user failed with status ${loginResponse.status}`);
  }

  const loginBody = await loginResponse.json();
  const accessToken = loginBody.data.accessToken;

  process.env.__TEST_FIXTURE__ = JSON.stringify({
    userId: user._id.toString(),
    gymId: gym._id.toString(),
    accessToken,
    templates: {
      weight: {
        templateId: weightTemplate._id.toString(),
        oneRM: weightTemplate.templateRepMaxes[0]._id.toString(),
        threeRM: weightTemplate.templateRepMaxes[1]._id.toString(),
        fiveRM: weightTemplate.templateRepMaxes[2]._id.toString(),
        tenRM: weightTemplate.templateRepMaxes[3]._id.toString(),
      },
      distance: {
        templateId: distanceTemplate._id.toString(),
        min1: distanceTemplate.templateTimeSubMaxes[0]._id.toString(),
        min3: distanceTemplate.templateTimeSubMaxes[1]._id.toString(),
        min5: distanceTemplate.templateTimeSubMaxes[2]._id.toString(),
      },
      time: {
        templateId: timeTemplate._id.toString(),
        m100: timeTemplate.templateDistanceSubMaxes[0]._id.toString(),
        m500: timeTemplate.templateDistanceSubMaxes[1]._id.toString(),
        mile1: timeTemplate.templateDistanceSubMaxes[2]._id.toString(),
      },
      reps: { templateId: repsTemplate._id.toString() },
      other: { templateId: otherTemplate._id.toString() },
    },
  });

  await mongoose.disconnect();
};
