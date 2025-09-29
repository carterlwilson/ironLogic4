# Gym Management UI Design Specification

## Overview
This document outlines the complete UI design for gym management functionality in the admin panel. The design follows the established patterns from the existing user management system while being optimized for gym-specific data and workflows.

## Design Philosophy
- **Consistency First**: Mirror the existing user management patterns for familiarity
- **Data-Driven Layout**: Optimize for gym data display (name, address, phone, owner)
- **Progressive Disclosure**: Show essential info first, details on demand
- **Mobile-First Responsive**: Ensure usability across all screen sizes
- **Accessible by Default**: WCAG 2.1 AA compliance throughout

## Component Architecture

### 1. Navigation Integration
**Location**: `/packages/client/src/components/Navigation.tsx`

**Modification Needed**: Add gym navigation item to admin navigation
```tsx
// Add to imports
import { IconBuilding } from '@tabler/icons-react';

// Add after Users NavLink
<NavLink
  href="/gyms"
  label="Gyms"
  leftSection={<IconBuilding size={16} />}
  active={location.pathname === '/gyms'}
  onClick={(event) => {
    event.preventDefault();
    handleGymsClick();
  }}
  style={{ borderRadius: '8px' }}
/>
```

### 2. Main Page Structure
**Component**: `GymsPage.tsx`
**Location**: `/packages/client/src/pages/GymsPage.tsx`

**Layout Structure**:
```
Container (size="xl", py="xl")
├── Notification (conditional)
├── Page Header (Group with Icon + Title)
├── Description Text
├── GymToolbar
├── GymTable
└── Modals (Add, Edit, Delete)
```

**Page Header**:
- Icon: `IconBuilding` from `@tabler/icons-react`
- Title: "Gym Management"
- Color: `#22c55e` (green, matching user management)
- Description: "Manage gym locations and assign ownership for your organization."

### 3. Gym Toolbar Component
**Component**: `GymToolbar.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/GymToolbar.tsx`

**Features**:
- Search by gym name/address (width: 400px)
- Filter by owner (dropdown with user names)
- Clear filters button (when filters active)
- "Add Gym" button (green, with `IconBuildingPlus` icon)

**Search Placeholder**: "Search gyms by name or address..."
**Owner Filter**: Dropdown populated with users who have `owner` role
**Layout**: Same Group structure as UserToolbar with space-between justify

### 4. Gym Table Component
**Component**: `GymTable.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/GymTable.tsx`

**Table Columns**:
1. **Gym Name** - Primary identifier, bold text
2. **Address** - Full address, truncated if too long
3. **Phone** - Formatted phone number
4. **Owner** - Owner name with fallback for unassigned
5. **Created** - Relative date (e.g., "2 days ago")
6. **Actions** - Edit and Delete buttons

**Table Features**:
- Striped rows with hover highlighting
- Responsive scroll container (minWidth: 900px)
- Loading skeleton (10 rows)
- Empty state handling
- Pagination with page size options

**Column Specifications**:
- **Gym Name**: `<Text fw={500}>{gym.name}</Text>`
- **Address**: `<Text lineClamp={1} title={gym.address}>{gym.address}</Text>`
- **Phone**: `<Text c="dimmed">{formatPhoneNumber(gym.phoneNumber)}</Text>`
- **Owner**: `<Text c="blue">{ownerName || 'Unassigned'}</Text>`
- **Created**: `<Text c="dimmed" size="sm">{formatRelativeDate(gym.createdAt)}</Text>`

### 5. Gym Row Component
**Component**: `GymRow.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/GymRow.tsx`

**Action Buttons**:
- Edit: `IconEdit` with blue color, tooltip "Edit gym"
- Delete: `IconTrash` with red color, tooltip "Delete gym"
- Size: 16px icons in 28px buttons
- Gap: xs between buttons

### 6. Add Gym Modal
**Component**: `AddGymModal.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/AddGymModal.tsx`

**Modal Properties**:
- Title: "Add New Gym"
- Size: "md"
- Centered: true

**Form Fields**:
1. **Gym Name** (required)
   - TextInput with `IconBuilding` leftSection
   - Placeholder: "Enter gym name"
   - Validation: Required, min 1 character

2. **Address** (required)
   - TextInput with `IconMapPin` leftSection
   - Placeholder: "Enter full address"
   - Validation: Required, min 5 characters

3. **Phone Number** (required)
   - TextInput with `IconPhone` leftSection
   - Placeholder: "(555) 123-4567"
   - Validation: Required, phone format

4. **Owner** (required)
   - Select dropdown with owner users
   - Placeholder: "Select gym owner"
   - Data: Users with role 'owner'
   - Display: `${firstName} ${lastName} (${email})`

**Form Actions**:
- Cancel button: variant="subtle", disabled when loading
- Create button: color="green", loading state, disabled when invalid

**Validation Rules**:
- Name: Required, 1-100 characters
- Address: Required, 5-200 characters
- Phone: Required, valid phone format
- Owner: Required selection

### 7. Edit Gym Modal
**Component**: `EditGymModal.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/EditGymModal.tsx`

**Same as Add Modal but**:
- Title: "Edit Gym"
- Form pre-populated with existing data
- Update button: "Save Changes"
- Additional "Delete Gym" button (red, outline) in footer

### 8. Delete Gym Modal
**Component**: `DeleteGymModal.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/DeleteGymModal.tsx`

**Modal Properties**:
- Title: "Delete Gym"
- Size: "sm"
- Centered: true

**Content**:
- Warning icon: `IconAlertTriangle` (size: 32, color: red)
- Warning text: "Are you sure you want to delete **{gym.name}**?"
- Consequence text: "This action cannot be undone. All associated data will be permanently removed."

**Actions**:
- Cancel button: variant="subtle"
- Delete button: color="red", loading state, "Delete Gym"

### 9. Empty State Component
**Component**: `GymEmptyState.tsx`
**Location**: `/packages/client/src/components/admin/GymManagement/GymEmptyState.tsx`

**Empty States**:

**No Gyms (Clean State)**:
- Icon: `IconBuilding` (size: 64, gray)
- Title: "No gyms yet"
- Description: "Get started by adding your first gym location. You can manage multiple locations and assign owners from here."
- Action: "Add First Gym" button (green with `IconBuildingPlus`)

**No Results (Filtered State)**:
- Icon: `IconBuilding` (size: 64, gray)
- Title: "No gyms found"
- Description: "No gyms match your current search criteria. Try adjusting your filters or search terms."
- Action: "Clear Filters" button (subtle)

## Responsive Design Specifications

### Desktop (1200px+)
- Full table layout with all columns
- Toolbar items in single row
- Modal width: 500px

### Tablet (768px - 1199px)
- Horizontal scroll for table
- Toolbar may wrap to two rows
- Modal width: 90% max 500px

### Mobile (< 768px)
- Stack table vertically as cards
- Single column toolbar layout
- Full-width modal with adjusted padding

**Mobile Card Layout**:
```
Card (shadow="sm", p="md", withBorder)
├── Group (justify="space-between", align="start")
│   ├── Stack (gap="xs", flex: 1)
│   │   ├── Text (fw={500}, size="lg") - Gym Name
│   │   ├── Text (c="dimmed", size="sm") - Address
│   │   ├── Text (c="dimmed", size="sm") - Phone
│   │   └── Badge (color="blue", size="sm") - Owner
│   └── Group (gap="xs") - Action buttons
└── Text (ta="right", c="dimmed", size="xs") - Created date
```

## Color Scheme & Typography

### Primary Colors
- **Success/Add**: `#22c55e` (green)
- **Primary/Edit**: `#3b82f6` (blue)
- **Danger/Delete**: `#ef4444` (red)
- **Neutral**: `#64748b` (slate)

### Typography Scale
- **Page Title**: size="xl", fw={500}
- **Section Headers**: size="lg", fw={500}
- **Table Headers**: size="sm", fw={500}, c="dimmed"
- **Body Text**: size="sm"
- **Helper Text**: size="xs", c="dimmed"

### Spacing System
- **Container Padding**: py="xl"
- **Section Gaps**: gap="xl"
- **Component Gaps**: gap="md"
- **Form Field Gaps**: gap="md"
- **Button Groups**: gap="xs"

## Loading States

### Initial Load
- Table shows 10 skeleton rows
- Toolbar disabled during load
- Add button shows loading spinner

### Form Submissions
- Modal buttons show loading spinner
- Form fields remain enabled
- Submit button disabled with loading text

### Action States
- Action buttons show individual loading
- Row remains interactive for other actions
- Success/error notifications appear

## Error Handling

### Form Validation
- Real-time validation on blur
- Error messages below fields
- Form submit blocked until valid
- Clear error styling and messaging

### API Errors
- Network errors: "Connection failed. Please try again."
- Validation errors: Display field-specific messages
- Server errors: "Something went wrong. Please contact support."
- 404 errors: "Gym not found. It may have been deleted."

### Error Recovery
- Retry buttons for network failures
- Form state preserved during errors
- Clear error states on successful actions

## Accessibility Considerations

### Keyboard Navigation
- Full keyboard support for all interactive elements
- Logical tab order throughout interface
- Escape key closes modals and dropdowns
- Enter key submits forms

### Screen Reader Support
- Semantic HTML structure
- ARIA labels for complex interactions
- Table headers properly associated
- Form field labels and descriptions
- Loading state announcements

### Visual Accessibility
- Minimum 4.5:1 contrast ratios
- Focus indicators on all interactive elements
- Icons accompanied by text labels
- Error states clearly indicated
- No color-only information conveyance

## Performance Considerations

### Data Loading
- Pagination to limit initial load
- Debounced search to reduce API calls
- Optimistic updates for better UX
- Loading skeletons maintain layout

### Memory Management
- Proper cleanup of event listeners
- Modal state reset on close
- Search query cleanup on page navigation

## Implementation Priority

### Phase 1: Core Functionality
1. Navigation integration
2. Main page layout and routing
3. Basic table with mock data
4. Add gym modal with validation

### Phase 2: Full CRUD
1. Edit gym modal
2. Delete confirmation
3. API integration
4. Error handling

### Phase 3: Enhanced UX
1. Search and filtering
2. Pagination
3. Loading states
4. Empty states

### Phase 4: Polish
1. Mobile responsiveness
2. Accessibility testing
3. Performance optimization
4. User testing and refinement

## File Structure

```
packages/client/src/
├── pages/
│   └── GymsPage.tsx
├── components/admin/GymManagement/
│   ├── GymTable.tsx
│   ├── GymRow.tsx
│   ├── GymToolbar.tsx
│   ├── AddGymModal.tsx
│   ├── EditGymModal.tsx
│   ├── DeleteGymModal.tsx
│   └── GymEmptyState.tsx
├── hooks/
│   ├── useGymManagement.ts
│   └── useGymSearch.ts
└── services/
    └── gymApi.ts
```

This design provides a comprehensive, accessible, and maintainable gym management interface that seamlessly integrates with the existing admin panel while optimizing for gym-specific data and workflows.