# Database Seeding Scripts

## Overview

This directory contains scripts for seeding the IronLogic4 database with test data.

## Available Scripts

### `seedData.ts`

Generates comprehensive test data for development and testing.

**Usage:**

```bash
# From the server package directory
npm run seed

# Or from the root directory
npm run seed -w packages/server
```

**With data clearing:**

```bash
# Clear existing data before seeding
npm run seed:clear -w packages/server
```

## Generated Data

### Users
- **1 Owner**: `owner@ironlogic.com`
- **5 Coaches**: `coach1@ironlogic.com` - `coach5@ironlogic.com`
- **30 Clients**: `client1@ironlogic.com` - `client30@ironlogic.com`
- **Default Password**: `password123`

### Gym
- **Name**: CrossFit Iron Logic
- **Address**: 123 Fitness Street, Athletic City, AC 12345

### Activity Groups (5 groups, 54 total activities)
1. **Squats** (11 activities)
   - Back Squat, Front Squat, Overhead Squat, Box Squat, Pause Squat, etc.

2. **Bench Press** (11 activities)
   - Flat Bench Press, Incline Bench Press, Decline Bench Press, Close-Grip Bench, etc.

3. **Deadlifts** (11 activities)
   - Conventional Deadlift, Sumo Deadlift, Romanian Deadlift, Deficit Deadlift, etc.

4. **Olympic Lifts** (11 activities)
   - Clean, Power Clean, Snatch, Power Snatch, Clean & Jerk, etc.

5. **Press & Pull** (10 activities)
   - Strict Press, Push Press, Strict Pull-up, Barbell Row, etc.

### Benchmark Templates (12 benchmarks)
- **Squat Benchmarks**: Back Squat 1RM, Front Squat 1RM, Overhead Squat 1RM
- **Bench Press Benchmarks**: Bench Press 1RM, Incline Bench Press 1RM
- **Deadlift Benchmarks**: Deadlift 1RM, Sumo Deadlift 1RM
- **Olympic Lift Benchmarks**: Clean 1RM, Snatch 1RM, Clean & Jerk 1RM
- **Press/Pull Benchmarks**: Strict Press 1RM, Max Strict Pull-ups

### Benchmark Records
- Each client receives 6-8 benchmark records
- Values are realistic and scaled by:
  - Gender (male/female)
  - Experience level (randomly assigned)
  - Benchmark type

### Programs (2 programs)
1. **Strength & Conditioning Program**
   - 4 blocks × 4 weeks × 3 days × 4 activities
   - Focus: Strength, Conditioning, Work Capacity

2. **Power & Endurance Program**
   - 4 blocks × 4 weeks × 3 days × 4 activities
   - Focus: Power, Endurance, Olympic Lifting

### Schedule Templates (5 templates)
- One template per coach
- Monday-Friday schedules
- 4 timeslots per day:
  - 6:00 AM - 7:00 AM
  - 9:00 AM - 10:00 AM
  - 5:00 PM - 6:00 PM
  - 7:00 PM - 8:00 PM
- 12 spots per timeslot

## Notes

- All activities are LIFT type and reference appropriate benchmark templates
- Benchmark values are realistic and vary by gender and experience
- Programs include progressive loading schemes
- Schedule templates are ready to be activated (not automatically activated)
- The script will maintain referential integrity across all collections

## Environment

The script uses the `MONGODB_URI` from your `.env` file. Ensure your environment is properly configured before running.

## Troubleshooting

If the script fails:
1. Check MongoDB connection (`MONGODB_URI` in `.env`)
2. Ensure all required models are properly defined
3. Run with `--clear` flag to start fresh
4. Check console output for specific error messages