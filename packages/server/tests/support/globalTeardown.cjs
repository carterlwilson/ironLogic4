// Deletes exactly the fixture documents globalSetup.cjs created. Runs once, after all test
// files finish, in Jest's main process (same process globalSetup ran in, so __TEST_FIXTURE__
// is still populated on process.env).
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';

module.exports = async function globalTeardown() {
  const fixtureRaw = process.env.__TEST_FIXTURE__;
  if (!fixtureRaw) return;

  const fixture = JSON.parse(fixtureRaw);

  await mongoose.connect(MONGODB_URI);

  // Raw collection access, not Mongoose models: globalSetup.cjs runs in this same process and
  // already registered 'User'/'Gym'/'BenchmarkTemplate' models, so calling mongoose.model()
  // again here would throw OverwriteModelError.
  const db = mongoose.connection;
  const templateIds = Object.values(fixture.templates).map((t) => new mongoose.Types.ObjectId(t.templateId));

  await db.collection('users').deleteOne({ _id: new mongoose.Types.ObjectId(fixture.userId) });
  await db.collection('gyms').deleteOne({ _id: new mongoose.Types.ObjectId(fixture.gymId) });
  await db.collection('benchmarktemplates').deleteMany({ _id: { $in: templateIds } });

  await mongoose.disconnect();
};
