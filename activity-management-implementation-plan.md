# Activity Management UI Implementation Plan

## Overview
This document outlines the comprehensive implementation plan for the Activity Management UI page in the gym management application. The page will provide a tabbed interface for managing Activity Groups and Activity Templates with full CRUD operations.

## 1. Page Structure & Layout

### Overall Page Layout
- **Container**: Use Mantine's `Container` component with `size="xl"` for consistent sizing with existing pages
- **Shell Integration**: Integrate within the existing `AppShell` structure
- **Navigation**: Add "Activities" link to the navigation panel (restricted to gym owners)
- **Header Section**:
  - Page title with activity icon
  - Descriptive subtitle explaining the page purpose
  - Breadcrumb navigation if needed

### Tab Structure
- **Primary Component**: Use Mantine's `Tabs` component with two main tabs
- **Tab 1**: "Activity Groups" - Manage activity group categories
- **Tab 2**: "Activity Templates" - Manage individual activity templates
- **Tab Persistence**: Maintain active tab state in URL query parameters for bookmarking
- **Default Tab**: Activity Groups tab should be the default landing

### Responsive Design
- **Mobile First**: Design for mobile screens (320px+) with progressive enhancement
- **Breakpoints**:
  - Mobile (xs): Single column layout, simplified toolbar
  - Tablet (sm): Two-column forms, compact table
  - Desktop (md+): Full table layout with all columns
- **Navigation**: Collapsible sidebar on mobile maintains access
- **Tables**: Horizontal scroll on mobile, responsive column hiding

## 2. Component Architecture

### Main Component Structure
```
ActivityManagementPage/
├── index.tsx                     # Main page component
├── components/
│   ├── ActivityGroupsTab/
│   │   ├── ActivityGroupsTable.tsx
│   │   ├── ActivityGroupToolbar.tsx
│   │   ├── AddActivityGroupModal.tsx
│   │   ├── EditActivityGroupModal.tsx
│   │   ├── DeleteActivityGroupModal.tsx
│   │   └── ActivityGroupEmptyState.tsx
│   ├── ActivityTemplatesTab/
│   │   ├── ActivityTemplatesTable.tsx
│   │   ├── ActivityTemplateToolbar.tsx
│   │   ├── AddActivityTemplateModal.tsx
│   │   ├── EditActivityTemplateModal.tsx
│   │   ├── DeleteActivityTemplateModal.tsx
│   │   └── ActivityTemplateEmptyState.tsx
│   └── shared/
│       ├── ConfirmationDialog.tsx
│       └── LoadingOverlay.tsx
└── hooks/
    ├── useActivityGroups.ts
    ├── useActivityTemplates.ts
    ├── useActivityGroupSearch.ts
    └── useActivityTemplateSearch.ts
```

### Component Hierarchy
1. **ActivityManagementPage** (Main container)
   - Handles tab state and navigation
   - Manages shared notifications
   - Provides authentication checks

2. **Tab Components** (ActivityGroupsTab, ActivityTemplatesTab)
   - Manages tab-specific state
   - Handles CRUD operations
   - Coordinates between toolbar, table, and modals

3. **Table Components** (ActivityGroupsTable, ActivityTemplatesTable)
   - Data display and pagination
   - Row-level actions (edit, delete)
   - Sorting and filtering integration

4. **Modal Components** (Add/Edit/Delete modals)
   - Form handling and validation
   - API integration
   - Loading states

### Data Flow
- **Top-down**: Page → Tab → Table/Modal components
- **Event bubbling**: Modal actions bubble up to tab components
- **Shared state**: Notifications managed at page level
- **Hook isolation**: Each entity type has dedicated hooks

## 3. Data Management

### API Integration Strategy
- **Service Layer**: Create `activityApi.ts` following existing `userApi.ts` and `gymApi.ts` patterns
- **Endpoints**:
  - Activity Groups: `/api/gyms/:gymId/activity-groups`
  - Activity Templates: `/api/gyms/:gymId/activity-templates`
- **HTTP Methods**: GET (list), POST (create), PUT (update), DELETE (remove)
- **Error Handling**: Consistent error response format with user-friendly messages

### State Management Approach
- **Local State**: React hooks for component-specific state
- **Data Fetching**: Custom hooks with built-in loading/error states
- **Cache Strategy**: No complex caching initially - refetch on operations
- **Optimistic Updates**: For better UX on edit operations
- **Form State**: Mantine's `useForm` hook for form management

### Data Fetching and Caching
- **Initial Load**: Fetch data on component mount and tab change
- **Pagination**: Server-side pagination with 20 items per page default
- **Search**: Debounced search with 300ms delay
- **Refresh**: Manual refresh button and auto-refresh after mutations
- **Loading States**: Skeleton loaders for tables, spinners for modals

### Real-time Updates Between Tabs
- **Tab Switching**: Refetch data when switching between tabs
- **Cross-tab Updates**: Activity Template operations may affect Group references
- **Notification System**: Success/error notifications for all operations
- **Data Validation**: Client-side validation with server-side confirmation

## 4. UI/UX Design

### Table/List Layouts
**Activity Groups Table:**
- Columns: Name, Notes, Created Date, Actions
- Row Actions: Edit (pencil icon), Delete (trash icon)
- Empty State: Illustration with "Create your first activity group" CTA

**Activity Templates Table:**
- Columns: Name, Type (badge), Group (chip), Notes, Created Date, Actions
- Filters: Type dropdown, Group dropdown, Search
- Row Actions: Edit, Delete
- Empty State: "No activity templates found" with create CTA

### Form Designs
**Activity Group Form:**
- Name (required): Text input with validation
- Notes (optional): Textarea for additional details
- Validation: Name uniqueness within gym

**Activity Template Form:**
- Name (required): Text input
- Type (required): Select dropdown (Lift, Cardio, Benchmark, Other)
- Group (optional): Select dropdown showing activity group names
- Notes (optional): Textarea
- Validation: Name uniqueness within gym and type combination

### Modal vs Inline Editing
- **Modal Approach**: All create/edit operations use modals for focus and consistency
- **Modal Size**: Medium (md) for forms, small (sm) for confirmations
- **Form Layout**: Single column for simplicity, proper field spacing
- **Modal Actions**: Cancel (left), Save/Create (right, primary)

### Loading States and Error Handling
- **Table Loading**: Mantine's Skeleton component for table rows
- **Form Loading**: Disable form controls, show loading overlay
- **Button Loading**: Loading state on action buttons
- **Error States**:
  - Form validation errors inline
  - API errors in notification toast
  - Network errors with retry option

### Confirmation Dialogs
- **Delete Confirmations**: Modal with entity name, warning text, and confirmation
- **Bulk Operations**: If implemented later, confirmation for bulk actions
- **Unsaved Changes**: Warn when closing forms with unsaved data

## 5. Mantine Components

### Core Components
- **AppShell**: Existing layout structure
- **Container**: Page-level container with xl size
- **Tabs**: Main tabbed interface with clean styling
- **Stack**: Vertical layout for page sections
- **Group**: Horizontal layout for headers and actions

### Data Display
- **Table**:
  - Striped rows for better readability
  - Hover effects for row highlighting
  - Responsive design with column hiding
- **Badge**: For activity type display (colored badges)
- **Chip**: For activity group display in templates table
- **Text**: Various sizes for content hierarchy

### Form Components
- **TextInput**: Standard text inputs with validation
- **Textarea**: Multi-line text for notes
- **Select**: Dropdowns for type and group selection
- **Button**: Primary and secondary variants
- **Modal**: Standard modal sizes and behaviors

### Navigation and Actions
- **NavLink**: For sidebar navigation integration
- **ActionIcon**: For table row actions (edit, delete)
- **Menu**: Dropdown menus if bulk actions needed
- **Pagination**: Built-in pagination component

### Feedback Components
- **Notification**: Success and error notifications
- **Loader**: Loading states for async operations
- **Skeleton**: Loading placeholders for tables
- **Alert**: Important information or warnings

## 6. User Interactions

### Navigation Flow
1. **Entry**: User clicks "Activity Management" in sidebar
2. **Default View**: Lands on Activity Groups tab
3. **Tab Switching**: Click tabs to switch between Groups and Templates
4. **URL State**: Tab state preserved in URL for bookmarking

### CRUD Operation Flows

**Create Flow:**
1. Click "Add [Entity]" button in toolbar
2. Modal opens with form
3. Fill required fields
4. Submit form
5. Success notification + table refresh
6. Modal closes automatically

**Edit Flow:**
1. Click edit icon in table row
2. Modal opens pre-populated with data
3. Modify fields as needed
4. Submit changes
5. Success notification + table refresh
6. Modal closes automatically

**Delete Flow:**
1. Click delete icon in table row
2. Confirmation modal opens
3. Confirm deletion
4. Success notification + table refresh
5. Table updates to remove deleted item

### Form Validation and Submission
- **Real-time Validation**: Field validation on blur
- **Submit Validation**: Full form validation before submission
- **Error Display**: Inline error messages under fields
- **Required Fields**: Clear visual indicators (asterisk)
- **Submit States**: Loading button states during submission

### Search and Filtering
- **Search Input**: Debounced search across entity names
- **Filter Dropdowns**: Type and group filters for templates
- **Clear Filters**: One-click filter reset
- **Filter Persistence**: Maintain filters during session

### Pagination
- **Page Size Options**: 10, 20, 50 items per page
- **Page Navigation**: Previous/Next buttons + page numbers
- **Total Count**: Display total items found
- **Jump to Page**: Direct page number input for large datasets

## 7. Technical Implementation

### File Structure
```
packages/client/src/
├── pages/
│   └── ActivityManagementPage.tsx
├── components/
│   └── activities/
│       ├── ActivityGroupsTab/
│       ├── ActivityTemplatesTab/
│       └── shared/
├── hooks/
│   ├── useActivityGroups.ts
│   ├── useActivityTemplates.ts
│   ├── useActivityGroupSearch.ts
│   └── useActivityTemplateSearch.ts
├── services/
│   └── activityApi.ts
└── types/ (if local types needed)
```

### Routing Setup
```typescript
// Add to App.tsx
<Route path="/activities" element={<ActivityManagementPage />} />
```

### API Service Layer
```typescript
// activityApi.ts structure
export const activityGroupsApi = {
  list: (gymId: string, params: ActivityGroupListParams) => Promise<PaginatedResponse<ActivityGroup>>,
  create: (gymId: string, data: CreateActivityGroupRequest) => Promise<ActivityGroup>,
  update: (gymId: string, id: string, data: UpdateActivityGroupRequest) => Promise<ActivityGroup>,
  delete: (gymId: string, id: string) => Promise<void>
};

export const activityTemplatesApi = {
  list: (gymId: string, params: ActivityTemplateListParams) => Promise<PaginatedResponse<ActivityTemplate>>,
  create: (gymId: string, data: CreateActivityTemplateRequest) => Promise<ActivityTemplate>,
  update: (gymId: string, id: string, data: UpdateActivityTemplateRequest) => Promise<ActivityTemplate>,
  delete: (gymId: string, id: string) => Promise<void>
};
```

### Type Safety with TypeScript
- **Existing Types**: Use types from `@ironlogic4/shared`
- **Component Props**: Strict typing for all component interfaces
- **API Responses**: Type all API responses and requests
- **Form Data**: Type form submission data
- **Hook Returns**: Type custom hook return values

### Navigation Integration
```typescript
// Update Navigation.tsx to include activity management link
// Only show for gym owners (role === 'owner')
const handleActivitiesClick = () => {
  navigate('/activities');
};

// Add NavLink for activities with appropriate icon
```

### Authentication and Authorization
- **Route Protection**: Verify user has 'owner' role for gym
- **Navigation Visibility**: Only show navigation link to authorized users
- **API Security**: All API calls include authentication headers
- **Gym Context**: Filter data by user's gym automatically

### Performance Considerations
- **Code Splitting**: Lazy load activity management page
- **Debounced Search**: Prevent excessive API calls
- **Memoization**: Memo expensive calculations and components
- **Pagination**: Limit data transfer with server-side pagination
- **Optimistic Updates**: Show changes immediately, revert on error

### Error Handling Strategy
- **Network Errors**: Retry mechanism with exponential backoff
- **Validation Errors**: Display field-specific error messages
- **Authorization Errors**: Redirect to login if token expired
- **Server Errors**: User-friendly error messages with support contact
- **Offline Handling**: Basic offline detection and messaging

### Testing Strategy
- **Unit Tests**: Test individual components and hooks
- **Integration Tests**: Test component interactions
- **API Tests**: Mock API responses for consistent testing
- **Accessibility Tests**: Ensure keyboard navigation and screen reader compatibility
- **Visual Regression**: Screenshot tests for UI consistency

## Success Criteria

### Functional Requirements Met
- ✅ Navigation link appears for gym owners
- ✅ Tabbed interface with Activity Groups and Templates
- ✅ Full CRUD operations for both entity types
- ✅ Activity Template group assignment uses dropdown
- ✅ Search and filtering capabilities
- ✅ Pagination for large datasets

### User Experience Goals
- ✅ Intuitive navigation and workflow
- ✅ Responsive design across all devices
- ✅ Fast loading and smooth interactions
- ✅ Clear feedback for all user actions
- ✅ Accessible interface for all users

### Technical Standards
- ✅ TypeScript type safety throughout
- ✅ Consistent with existing codebase patterns
- ✅ Proper error handling and loading states
- ✅ Clean, maintainable code structure
- ✅ Performance optimization implemented

This implementation plan provides a comprehensive roadmap for building a robust, user-friendly Activity Management interface that integrates seamlessly with the existing gym management application.