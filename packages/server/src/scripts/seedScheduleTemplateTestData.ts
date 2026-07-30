import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

// Local dev DB only — never point this script at MONGODB_PROD_URI.
await mongoose.connect(process.env.MONGODB_URI!);
console.log('Connected to', process.env.MONGODB_URI);

const db = mongoose.connection.db!;

const START_HOUR = 7;
const END_HOUR = 16; // slots run 7-8, 8-9, ..., 15-16
const CAPACITY = 16;
const HALF_FULL = Math.floor(CAPACITY / 2);

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function sampleClients(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildDays(clientPool: string[]) {
  const days = [];
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const timeSlots = [];
    if (isWeekday) {
      for (let hour = START_HOUR; hour < END_HOUR; hour++) {
        timeSlots.push({
          _id: new mongoose.Types.ObjectId(),
          startTime: `${pad(hour)}:00`,
          endTime: `${pad(hour + 1)}:00`,
          capacity: CAPACITY,
          assignedClients: sampleClients(clientPool, HALF_FULL),
        });
      }
    }
    days.push({ dayOfWeek, timeSlots });
  }
  return days;
}

const coaches = await db.collection('users').find({ userType: 'coach' }).toArray();
console.log(`Found ${coaches.length} coach(es)`);

for (const coach of coaches) {
  const coachId = coach._id.toString();
  const gymId = coach.gymId;

  const clients = await db
    .collection('users')
    .find({ userType: 'client', gymId }, { projection: { _id: 1 } })
    .toArray();
  const clientPool = clients.map((c) => c._id.toString());

  if (clientPool.length === 0) {
    console.log(`SKIPPED ${coach.firstName} ${coach.lastName} (no clients in gym ${gymId})`);
    continue;
  }

  const days = buildDays(clientPool);

  const existing = await db.collection('scheduletemplates').findOne({ coachIds: coachId });

  let templateId;
  if (existing) {
    templateId = existing._id;
    await db.collection('scheduletemplates').updateOne(
      { _id: existing._id },
      { $set: { days, updatedAt: new Date() } }
    );
    console.log(`UPDATED template "${existing.name}" for ${coach.firstName} ${coach.lastName} (${clientPool.length} clients in pool)`);
  } else {
    const name = `${coach.firstName} ${coach.lastName}`;
    const inserted = await db.collection('scheduletemplates').insertOne({
      gymId,
      name,
      coachIds: [coachId],
      days,
      createdBy: coachId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    templateId = inserted.insertedId;
    console.log(`CREATED template "${name}" for ${coach.firstName} ${coach.lastName} (${clientPool.length} clients in pool)`);
  }

  // Keep any already-activated schedule for this template in sync — the mobile app
  // reads from ActiveSchedule, not ScheduleTemplate, and they don't auto-sync.
  const activeSchedules = await db
    .collection('activeschedules')
    .find({ templateId: templateId.toString() })
    .toArray();

  for (const active of activeSchedules) {
    await db.collection('activeschedules').updateOne(
      { _id: active._id },
      { $set: { days, updatedAt: new Date() } }
    );
    console.log(`  UPDATED active schedule ${active._id} to match template`);
  }
}

await mongoose.disconnect();
console.log('Done');
