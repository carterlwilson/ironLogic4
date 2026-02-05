# Frontend Implementation Plan: DISTANCE Benchmark Type

## Overview

Implement UI components and screens to support the new DISTANCE benchmark type. This allows users to create distance benchmark templates (e.g., Rowing, Running) with time sub-maxes (1 min, 3 min, 5 min) and record how far they traveled in those time periods.

**Backend Status:** ✅ Complete
**Frontend Status:** 🚧 To be implemented

---

## Key UI/UX Decisions

1. **Template Creation:**
   - Provide default time sub-maxes (1 min, 3 min, 5 min) that can be customized
   - Allow adding/removing/editing time sub-maxes
   - Distance unit selector (meters or kilometers)

2. **Recording Benchmarks:**
   - Show each time sub-max from the template
   - Input field for distance covered in that time
   - Auto-convert display based on template's distance unit preference
   - Date/time picker for when the benchmark was recorded

3. **Display Format:**
   - Show distances with proper unit (m or km)
   - Display time sub-maxes in a clear, scannable format
   - Highlight best/longest distance

4. **Progress Charts:**
   - Show longest distance over time
   - Proper unit labels based on template preference
   - Auto-convert values for display

---

## Files to Modify/Create

### 1. Create Benchmark Template Screen (Coach)

**File:** `/packages/client/src/pages/coach/CreateBenchmarkTemplate.tsx`

**Current State:** Handles WEIGHT, TIME, REPS, OTHER types

**Changes Needed:**

```typescript
// Add DISTANCE to type selector
const benchmarkTypes = [
  { value: BenchmarkType.WEIGHT, label: 'Weight' },
  { value: BenchmarkType.DISTANCE, label: 'Distance' }, // NEW
  { value: BenchmarkType.TIME, label: 'Time' },
  { value: BenchmarkType.REPS, label: 'Reps' },
  { value: BenchmarkType.OTHER, label: 'Other' },
];

// Add conditional rendering for DISTANCE type
{selectedType === BenchmarkType.DISTANCE && (
  <>
    {/* Distance Unit Selector */}
    <Select
      label="Distance Unit"
      data={[
        { value: 'meters', label: 'Meters' },
        { value: 'kilometers', label: 'Kilometers' },
      ]}
      required
    />

    {/* Time Sub-Maxes Builder */}
    <Stack>
      <Group justify="space-between">
        <Text fw={500}>Time Sub-Maxes</Text>
        <Button size="xs" onClick={addTimeSubMax}>
          Add Time Sub-Max
        </Button>
      </Group>

      {timeSubMaxes.map((tsm, index) => (
        <Group key={index}>
          <TextInput
            label="Name"
            placeholder="e.g., 1 min, 500m"
            value={tsm.name}
            onChange={(e) => updateTimeSubMax(index, 'name', e.target.value)}
            required
          />
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => removeTimeSubMax(index)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}
    </Stack>
  </>
)}
```

**Implementation Details:**
- State for `timeSubMaxes: { name: string }[]`
- Default values: `[{ name: '1 min' }, { name: '3 min' }, { name: '5 min' }]`
- Validation: At least 1 time sub-max required
- Add/remove time sub-max functions
- Include in form submission when type is DISTANCE

---

### 2. Edit Benchmark Template Screen (Coach)

**File:** `/packages/client/src/pages/coach/EditBenchmarkTemplate.tsx`

**Current State:** Handles editing existing templates

**Changes Needed:**
- Same UI components as create screen
- Load existing `templateTimeSubMaxes` and `distanceUnit` from template
- Handle updates to time sub-maxes (add/edit/delete)
- Warning if removing time sub-maxes that have recorded data

---

### 3. Benchmark Template Details Screen (Coach)

**File:** `/packages/client/src/pages/coach/BenchmarkTemplateDetails.tsx` (if exists)

**Changes Needed:**
- Display time sub-maxes list for DISTANCE templates
- Show distance unit preference
- Format: "Time Sub-Maxes: 1 min, 3 min, 5 min (meters)"

---

### 4. Record Benchmark Screen (Mobile - Client)

**File:** `/packages/mobile/src/pages/RecordBenchmark.tsx`

**Current State:** Handles recording WEIGHT (rep maxes), TIME, REPS, OTHER

**Changes Needed:**

```typescript
// Add DISTANCE type handling
{template.type === BenchmarkType.DISTANCE && (
  <Stack>
    <Text size="sm" c="dimmed">
      Record the distance you covered for each time duration in {template.distanceUnit}
    </Text>

    {template.templateTimeSubMaxes?.map((tsm) => (
      <NumberInput
        key={tsm.id}
        label={tsm.name}
        description={`Distance in ${template.distanceUnit}`}
        placeholder="Enter distance"
        min={0}
        step={template.distanceUnit === 'kilometers' ? 0.1 : 10}
        decimalScale={template.distanceUnit === 'kilometers' ? 2 : 0}
        value={timeSubMaxValues[tsm.id] || ''}
        onChange={(value) => setTimeSubMaxValue(tsm.id, value)}
        rightSection={<Text size="sm" c="dimmed">{template.distanceUnit === 'kilometers' ? 'km' : 'm'}</Text>}
        required
      />
    ))}
  </Stack>
)}
```

**Implementation Details:**
- State: `timeSubMaxValues: Record<string, number>` (maps templateTimeSubMaxId to distanceMeters)
- Convert kilometers to meters before API submission (if template uses kilometers)
- Validation: At least one time sub-max must be filled
- Store in proper format:
  ```typescript
  timeSubMaxes: template.templateTimeSubMaxes.map(tsm => ({
    templateTimeSubMaxId: tsm.id,
    distanceMeters: template.distanceUnit === 'kilometers'
      ? timeSubMaxValues[tsm.id] * 1000
      : timeSubMaxValues[tsm.id],
    recordedAt: new Date().toISOString()
  }))
  ```

---

### 5. Benchmark Display Component (Mobile - Client)

**File:** `/packages/mobile/src/components/BenchmarkCard.tsx`

**Current State:** Displays benchmark data for all types

**Changes Needed:**

```typescript
// Add DISTANCE display
{benchmark.type === BenchmarkType.DISTANCE && (
  <Stack gap="xs">
    {benchmark.timeSubMaxes?.map((tsm) => {
      // Find template time sub-max to get the name
      const template = templates.find(t => t.id === benchmark.templateId);
      const templateTsm = template?.templateTimeSubMaxes?.find(t => t.id === tsm.templateTimeSubMaxId);

      // Convert meters to display unit
      const distanceValue = template?.distanceUnit === 'kilometers'
        ? (tsm.distanceMeters / 1000).toFixed(2)
        : tsm.distanceMeters.toFixed(0);

      const unit = template?.distanceUnit === 'kilometers' ? 'km' : 'm';

      return (
        <Group key={tsm.id} justify="space-between">
          <Text size="sm" c="dimmed">{templateTsm?.name || 'Unknown'}</Text>
          <Text fw={500}>{distanceValue} {unit}</Text>
        </Group>
      );
    })}
  </Stack>
)}
```

**Display Format Example:**
```
Rowing Distance
━━━━━━━━━━━━━━
1 min     250 m
3 min     700 m
5 min   1,150 m
━━━━━━━━━━━━━━
Best: 1,150 m
Recorded: Jan 20, 2025
```

---

### 6. Edit Benchmark Screen (Mobile - Client)

**File:** `/packages/mobile/src/pages/EditBenchmark.tsx`

**Changes Needed:**
- Similar to record screen, but pre-populate with existing values
- Load existing `timeSubMaxes` and convert for display
- Handle updates to individual time sub-max values

---

### 7. Benchmark Progress Chart (Mobile - Client)

**File:** `/packages/mobile/src/pages/BenchmarkProgress.tsx`

**Current State:** Fetches and displays progress data from backend

**Changes Needed:**
- Minimal changes - backend already handles DISTANCE type
- Ensure chart displays correct unit label (m or km)
- Backend returns longest distance from timeSubMaxes
- Chart should show progression over time

**Example Chart:**
```
Rowing Distance Progress (km)
1.5 ┤     ╭─
1.2 ┤   ╭─╯
0.9 ┤ ╭─╯
0.6 ┼─╯
    Jan 1  Jan 8  Jan 15  Jan 20
```

---

### 8. Benchmark List/Grid Views

**Files:**
- `/packages/client/src/pages/coach/BenchmarkTemplates.tsx` (Coach view)
- `/packages/mobile/src/pages/MyBenchmarks.tsx` (Client view)

**Changes Needed:**
- Badge already updated (cyan color for DISTANCE)
- Add filtering by DISTANCE type
- Display format in cards:
  - Show template name
  - Show distance unit badge/label
  - Show time sub-maxes count (e.g., "3 time intervals")

---

## Data Flow

### Creating a Template
1. Coach selects "Distance" type
2. Selects distance unit (meters or kilometers)
3. Adds/edits time sub-maxes (e.g., "1 min", "3 min", "5 min")
4. Submits → API creates template with `templateTimeSubMaxes` and `distanceUnit`

### Recording a Benchmark
1. Client selects DISTANCE template
2. App displays input fields for each time sub-max
3. Client enters distances (displayed in template's unit)
4. App converts to meters if needed
5. Submits → API creates benchmark with `timeSubMaxes` array
   ```json
   {
     "templateId": "...",
     "timeSubMaxes": [
       { "templateTimeSubMaxId": "...", "distanceMeters": 250, "recordedAt": "..." },
       { "templateTimeSubMaxId": "...", "distanceMeters": 700, "recordedAt": "..." },
       { "templateTimeSubMaxId": "...", "distanceMeters": 1150, "recordedAt": "..." }
     ]
   }
   ```

### Viewing Progress
1. Client views benchmark progress
2. Frontend fetches data from `/api/me/benchmarks/:templateId/progress`
3. Backend extracts longest distance from each timeSubMaxes array
4. Backend converts to template's unit (meters or kilometers)
5. Frontend displays chart with correct unit label

---

## Component Hierarchy

```
CreateBenchmarkTemplate (Coach)
├── TypeSelector (includes DISTANCE)
├── DistanceConfigSection (conditional on type === DISTANCE)
│   ├── DistanceUnitSelector
│   └── TimeSubMaxesBuilder
│       └── TimeSubMaxInput[] (add/remove)

RecordBenchmark (Mobile)
├── TemplateInfo (shows type, unit)
├── DistanceInputSection (conditional on type === DISTANCE)
│   └── TimeSubMaxInput[] (one per templateTimeSubMax)

BenchmarkCard (Mobile)
├── BenchmarkHeader (name, date)
├── DistanceDisplay (conditional on type === DISTANCE)
│   └── TimeSubMaxRow[] (shows name and distance)

BenchmarkProgress (Mobile)
├── ChartDisplay (automatically handles DISTANCE)
└── ProgressMetrics (shows unit, best value)
```

---

## Validation Rules

### Template Creation/Edit
- ✅ At least 1 time sub-max required for DISTANCE type
- ✅ Time sub-max name cannot be empty
- ✅ Time sub-max name max 30 characters
- ✅ Distance unit must be selected (meters or kilometers)

### Benchmark Recording
- ✅ At least 1 time sub-max must have a distance value
- ✅ Distance values must be non-negative
- ✅ Distance values reasonable (e.g., < 100km)
- ✅ All distances for same recordedAt timestamp

---

## Helper Functions to Create

```typescript
// Convert distance for display
export function formatDistance(
  distanceMeters: number,
  displayUnit: 'meters' | 'kilometers'
): { value: string; unit: string } {
  if (displayUnit === 'kilometers') {
    return {
      value: (distanceMeters / 1000).toFixed(2),
      unit: 'km'
    };
  }
  return {
    value: distanceMeters.toFixed(0),
    unit: 'm'
  };
}

// Convert distance for submission
export function convertDistanceToMeters(
  value: number,
  inputUnit: 'meters' | 'kilometers'
): number {
  return inputUnit === 'kilometers' ? value * 1000 : value;
}

// Get longest distance from timeSubMaxes
export function getLongestDistance(
  timeSubMaxes: TimeSubMax[]
): number | null {
  if (!timeSubMaxes || timeSubMaxes.length === 0) return null;
  return Math.max(...timeSubMaxes.map(tsm => tsm.distanceMeters));
}

// Format time sub-maxes for display
export function formatTimeSubMaxes(
  timeSubMaxes: TimeSubMax[],
  template: BenchmarkTemplate
): Array<{ name: string; distance: string; unit: string }> {
  return timeSubMaxes.map(tsm => {
    const templateTsm = template.templateTimeSubMaxes?.find(
      t => t.id === tsm.templateTimeSubMaxId
    );
    const { value, unit } = formatDistance(
      tsm.distanceMeters,
      template.distanceUnit!
    );
    return {
      name: templateTsm?.name || 'Unknown',
      distance: value,
      unit
    };
  });
}
```

---

## UI/UX Considerations

1. **Input Step Values:**
   - Meters: step=10 (allow 10m increments)
   - Kilometers: step=0.1, decimalScale=2 (allow 0.1km increments)

2. **Placeholder Values:**
   - Show realistic examples: "250" for meters, "1.5" for kilometers

3. **Validation Feedback:**
   - Real-time validation on inputs
   - Clear error messages: "Distance must be greater than 0"
   - Highlight required fields

4. **Empty States:**
   - "No time sub-maxes added yet" → Show add button
   - "Record your first distance benchmark" → Show record button

5. **Mobile Optimization:**
   - Number keyboard for distance inputs
   - Large touch targets for add/remove buttons
   - Swipe to delete time sub-maxes (optional)

---

## Implementation Order

**Phase 1: Coach Template Management**
1. Update CreateBenchmarkTemplate screen
2. Update EditBenchmarkTemplate screen
3. Test template creation/editing with DISTANCE type

**Phase 2: Mobile Recording & Display**
4. Update RecordBenchmark screen
5. Update BenchmarkCard component
6. Test recording and viewing DISTANCE benchmarks

**Phase 3: Progress & Charts**
7. Verify BenchmarkProgress screen works with DISTANCE
8. Test unit conversion and display
9. Add helper functions for formatting

**Phase 4: Polish**
10. Add validation and error handling
11. Improve mobile UX (keyboard types, touch targets)
12. Add empty states and loading states

---

## Testing Checklist

### Template Management
- [ ] Create DISTANCE template with meters
- [ ] Create DISTANCE template with kilometers
- [ ] Add custom time sub-maxes (e.g., "30 sec", "10 min")
- [ ] Edit existing DISTANCE template
- [ ] Delete template with recorded benchmarks (should warn/prevent)

### Recording Benchmarks
- [ ] Record benchmark with meters (3 time sub-maxes)
- [ ] Record benchmark with kilometers (3 time sub-maxes)
- [ ] Partial recording (only 1-2 time sub-maxes filled)
- [ ] Edit existing DISTANCE benchmark
- [ ] Replace current with new benchmark

### Display & Progress
- [ ] View DISTANCE benchmark in list (correct format)
- [ ] View DISTANCE benchmark details (all time sub-maxes shown)
- [ ] View progress chart (correct unit, values converted)
- [ ] Multiple recordings over time (chart shows progression)
- [ ] Historical benchmarks display correctly

### Edge Cases
- [ ] Template with 1 time sub-max
- [ ] Template with 10 time sub-maxes
- [ ] Very large distances (e.g., 50km)
- [ ] Very small distances (e.g., 10m)
- [ ] Switching between meters and kilometers mid-template

---

## Design Examples

### Create Template (Coach)
```
┌─────────────────────────────────────┐
│ Create Benchmark Template           │
├─────────────────────────────────────┤
│ Name: [Rowing Distance            ] │
│ Type: [Distance ▼]                  │
│                                     │
│ Distance Unit: ○ Meters ● Kilometers│
│                                     │
│ Time Sub-Maxes                 [+]  │
│ ┌─────────────────────────────┐    │
│ │ 1 min                     [×]│    │
│ │ 3 min                     [×]│    │
│ │ 5 min                     [×]│    │
│ └─────────────────────────────┘    │
│                                     │
│ Tags: [cardio] [rowing]             │
│                                     │
│          [Create Template]          │
└─────────────────────────────────────┘
```

### Record Benchmark (Mobile)
```
┌─────────────────────────────────────┐
│ ← Record Benchmark                  │
├─────────────────────────────────────┤
│ Rowing Distance                     │
│ Distance • Kilometers               │
│                                     │
│ Enter distances for each time:     │
│                                     │
│ 1 min                               │
│ [0.25] km                           │
│                                     │
│ 3 min                               │
│ [0.70] km                           │
│                                     │
│ 5 min                               │
│ [1.15] km                           │
│                                     │
│ Date: [Jan 20, 2025 ▼]             │
│ Notes: [Optional notes...]          │
│                                     │
│           [Record Benchmark]        │
└─────────────────────────────────────┘
```

### Benchmark Card (Mobile)
```
┌─────────────────────────────────────┐
│ Rowing Distance           [DISTANCE]│
│                                     │
│ 1 min ················· 250 m      │
│ 3 min ················· 700 m      │
│ 5 min ················ 1,150 m     │
│                                     │
│ ★ Best: 1,150 m                     │
│ 📅 Jan 20, 2025                     │
│                                     │
│    [View Progress]    [Edit]        │
└─────────────────────────────────────┘
```

---

## Summary

**Files to Create/Modify:** ~8-10 files
**Estimated Complexity:** Medium (similar to existing WEIGHT/RepMax patterns)
**Key Dependencies:** Backend API complete ✅

**Critical Path:**
1. Template creation/editing (Coach)
2. Benchmark recording (Mobile)
3. Benchmark display (Mobile)
4. Progress charts (Mobile)

The implementation follows established patterns from the WEIGHT type with rep maxes, making it straightforward to implement. The main complexity is in proper unit conversion and ensuring the UI clearly communicates the distance unit to users.
