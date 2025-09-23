# IronLogic4 UI Design Specification

## Project Overview
IronLogic4 is a React application built with TypeScript and Mantine v7, featuring role-based authentication with four user types: admin, owner, coach, and client. This specification outlines a comprehensive UI layout with navigation sidebar, role-based access control, and admin user management functionality.

## Current Tech Stack Analysis
- **React 18** with TypeScript
- **Mantine v7** UI components with custom forest green theme
- **React Router** for navigation
- **AuthProvider** with JWT-based authentication
- **Role-based access**: admin, owner, coach, client
- **Custom theme**: Forest green primary color (#3d9f5e) with professional styling

## Design Philosophy
- **Simplicity First**: Clean, uncluttered interface that prioritizes functionality
- **Role-Based Progressive Disclosure**: Show only relevant features based on user permissions
- **Professional Aesthetic**: Leveraging the existing forest green theme for consistency
- **Mobile-Responsive**: Desktop-first design with mobile considerations
- **Accessibility**: Proper contrast ratios, semantic structure, and keyboard navigation

---

## Overall Layout Architecture

### Application Shell Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Header (60px)                        │
│  [Logo: IronLogic4]              [User Menu] [Logout]   │
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│  Sidebar    │           Main Content Area               │
│  (280px)    │                                           │
│             │                                           │
│             │                                           │
│             │                                           │
│             │                                           │
│             │                                           │
└─────────────┴───────────────────────────────────────────┘
```

### Component Hierarchy
- **AppShell** (Mantine root container)
  - **AppShell.Header** (Fixed top header)
  - **AppShell.Navbar** (Collapsible left sidebar)
  - **AppShell.Main** (Main content area with routing)

---

## Header Design Specification

### Layout Structure
- **Height**: 60px (consistent with current implementation)
- **Background**: White (#ffffff) with subtle bottom border
- **Padding**: 16px horizontal

### Content Elements
1. **Left Section**: Application branding
   - Logo/Icon: 32x32px forest green icon or text logo
   - App Name: "IronLogic4" - Title size, semibold weight

2. **Right Section**: User controls
   - **User Menu Button**: Avatar or user icon with dropdown
     - Display: User's first name or email
     - Role badge: Small text showing current role
   - **Logout Button**: Red outline button with logout icon

### Mantine Components
- `AppShell.Header`
- `Group` with `justify="space-between"`
- `Text` for app name
- `Menu` for user dropdown
- `Button` for logout action
- `Avatar` for user representation

---

## Sidebar Navigation Design

### Layout Specifications
- **Width**: 280px (desktop), collapsible on mobile
- **Background**: Light gray (#fafafa) with subtle right border
- **Padding**: 16px vertical, 12px horizontal

### Navigation Structure

#### Admin Users Navigation
```
┌─────────────────────────┐
│  🏠 Dashboard           │
│  👥 Users              │
│  📊 Reports            │
│  ⚙️  Settings          │
└─────────────────────────┘
```

#### Owner Users Navigation
```
┌─────────────────────────┐
│  🏠 Dashboard           │
│  👨‍💼 Coaches             │
│  👤 Clients            │
│  📊 Business Reports   │
│  ⚙️  Settings          │
└─────────────────────────┘
```

#### Coach Users Navigation
```
┌─────────────────────────┐
│  🏠 Dashboard           │
│  👤 My Clients         │
│  📋 Programs           │
│  📊 Progress Reports   │
└─────────────────────────┘
```

#### Client Users Navigation
```
┌─────────────────────────┐
│  🏠 Dashboard           │
│  💪 My Program         │
│  📈 Progress           │
│  📅 Schedule           │
└─────────────────────────┘
```

### Navigation Item Specifications
- **Height**: 44px per item
- **Padding**: 12px horizontal, 8px vertical
- **Typography**: Medium weight, 14px font size
- **Icons**: 20x20px Tabler icons, forest green color
- **Hover State**: Light forest green background (#f0f7f4)
- **Active State**: Forest green background (#e1f0e8) with darker text
- **Spacing**: 4px gap between items

### Mantine Components
- `AppShell.Navbar`
- `NavLink` for navigation items
- `Stack` for vertical item layout
- Tabler icons for visual hierarchy

---

## Role-Based Access Control Design

### Navigation Visibility Logic
```typescript
interface NavigationItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: UserRole[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', icon: IconHome, href: '/', roles: ['admin', 'owner', 'coach', 'client'] },
  { label: 'Users', icon: IconUsers, href: '/users', roles: ['admin'] },
  { label: 'Coaches', icon: IconUserCheck, href: '/coaches', roles: ['owner'] },
  { label: 'Clients', icon: IconUser, href: '/clients', roles: ['owner', 'coach'] },
  { label: 'My Clients', icon: IconUser, href: '/my-clients', roles: ['coach'] },
  { label: 'Reports', icon: IconChartBar, href: '/reports', roles: ['admin', 'owner'] },
  { label: 'My Program', icon: IconBarbell, href: '/program', roles: ['client'] },
  { label: 'Progress', icon: IconTrendingUp, href: '/progress', roles: ['client', 'coach'] },
  { label: 'Settings', icon: IconSettings, href: '/settings', roles: ['admin', 'owner'] }
];
```

### Route Protection Strategy
- **Public Routes**: Login page only
- **Protected Routes**: All application routes require authentication
- **Role-Specific Routes**: Admin routes return 403 for non-admin users
- **Redirect Logic**: Unauthorized users redirect to dashboard with notification

---

## Admin Users Page Design

### Page Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Users Management                                           │
│  ─────────────────                                         │
│                                                             │
│  [🔍 Search] [📅 Filter] [+ Add User]                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Name          Email              Role      Actions   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ John Smith    john@example.com   Admin    [Edit][Del]│   │
│  │ Jane Doe      jane@example.com   Coach    [Edit][Del]│   │
│  │ Bob Johnson   bob@example.com    Client   [Edit][Del]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Pagination: « 1 2 3 ... 10 »]                           │
└─────────────────────────────────────────────────────────────┘
```

### Page Components
1. **Page Header**
   - Title: "Users Management" (H1, 32px)
   - Subtitle: "Manage system users and permissions"

2. **Action Bar**
   - Search input: Full-text search across name/email
   - Role filter: Dropdown to filter by user role
   - Add User button: Primary green button with plus icon

3. **Users Table**
   - Columns: Avatar, Name, Email, Role, Last Login, Actions
   - Row height: 56px for comfortable interaction
   - Alternating row colors for readability
   - Sortable columns for name, email, role, last login

4. **User Actions**
   - Edit: Pencil icon, opens user edit modal
   - Delete: Trash icon, shows confirmation modal
   - View Details: Eye icon for detailed user view

### Table Specifications
- **Border**: Light gray borders (#e0e0e0)
- **Header**: Medium gray background (#f5f5f5)
- **Row Hover**: Light forest green (#f0f7f4)
- **Actions**: Icon buttons, 32x32px hit targets
- **Responsive**: Stack vertically on mobile

### Mantine Components
- `Container` with size="xl"
- `Stack` for page layout
- `Group` for action bar
- `TextInput` with search icon
- `Select` for role filter
- `Button` for add user action
- `Table` with custom styling
- `ActionIcon` for table actions
- `Pagination` component

---

## Empty States Design

### Non-Admin User Empty State
For coach, owner, and client users who don't have navigation items yet:

```
┌─────────────────────────────────────────────────────────────┐
│                     🚀 Welcome!                             │
│                                                             │
│              Your dashboard is being prepared               │
│                                                             │
│    New features and tools for your role are coming soon.   │
│              Stay tuned for exciting updates!              │
│                                                             │
│                   [View Profile]                           │
└─────────────────────────────────────────────────────────────┘
```

### Empty State Specifications
- **Icon**: Large emoji or Tabler icon (64px)
- **Heading**: "Welcome!" or role-specific greeting
- **Message**: Encouraging, explains current state
- **Action**: Single primary button for available action
- **Styling**: Centered content, light background card

---

## Color Scheme & Styling Guidelines

### Primary Colors (From Existing Theme)
- **Primary Green**: #3d9f5e (buttons, active states)
- **Light Green**: #f0f7f4 (hover states, subtle backgrounds)
- **Forest Green Palette**: Use existing MantineColorsTuple

### Secondary Colors
- **Text Primary**: #212121 (headings, important text)
- **Text Secondary**: #616161 (body text, descriptions)
- **Text Muted**: #9e9e9e (labels, meta information)
- **Border**: #e0e0e0 (dividers, input borders)
- **Background**: #fafafa (sidebar, card backgrounds)

### Typography Scale
- **H1**: 32px, semibold (page titles)
- **H2**: 24px, semibold (section headers)
- **H3**: 20px, medium (card titles)
- **Body**: 14px, regular (normal text)
- **Small**: 12px, regular (metadata, labels)

### Spacing System (Existing Mantine Theme)
- **xs**: 8px (tight spacing)
- **sm**: 12px (compact layouts)
- **md**: 16px (standard spacing)
- **lg**: 24px (section spacing)
- **xl**: 32px (page-level spacing)

### Border Radius
- **sm**: 6px (small elements)
- **md**: 8px (standard elements)
- **lg**: 12px (cards, modals)

---

## Responsive Design Specifications

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
1. **Header**: Hamburger menu for navigation toggle
2. **Sidebar**: Overlay navigation that slides in from left
3. **Table**: Convert to stacked card layout
4. **Spacing**: Reduce padding and margins
5. **Typography**: Maintain readability with same font sizes

### Component Responsive Behavior
- **AppShell**: Use `AppShell.Navbar` with mobile collapse
- **Table**: Implement `Table.ScrollContainer` for horizontal scroll
- **Cards**: Full-width on mobile, grid layout on desktop
- **Buttons**: Full-width on mobile for primary actions

---

## Accessibility Considerations

### ARIA Implementation
- **Navigation**: Proper `nav` landmarks and `aria-current`
- **Tables**: Column headers with `scope` attributes
- **Buttons**: Descriptive `aria-label` for icon-only buttons
- **Forms**: Associated labels and error messages

### Keyboard Navigation
- **Tab Order**: Logical flow through interactive elements
- **Focus Indicators**: Visible focus rings with forest green accent
- **Shortcuts**: Consider common shortcuts (Ctrl+/ for search)

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio
- **Interactive Elements**: Clear visual distinction
- **Error States**: Red color with additional visual indicators

---

## Component Integration Strategy

### Existing Code Modifications Required
1. **App.tsx**: Update AppShell to include Navbar
2. **New Components**: NavigationSidebar, UsersPage, EmptyState
3. **Router Updates**: Add new routes with role protection
4. **Theme Extensions**: Add navigation-specific component styles

### New Component Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── NavigationSidebar.tsx
│   │   ├── AppHeader.tsx
│   │   └── EmptyState.tsx
│   ├── users/
│   │   ├── UsersTable.tsx
│   │   ├── UserActionMenu.tsx
│   │   └── AddUserModal.tsx
│   └── common/
│       ├── RoleGuard.tsx
│       └── PageContainer.tsx
├── pages/
│   ├── admin/
│   │   └── UsersPage.tsx
│   └── EmptyDashboard.tsx
└── hooks/
    └── useNavigation.ts
```

### State Management
- **AuthProvider**: Already handles user role state
- **Navigation State**: Simple local state for sidebar collapse
- **Users Data**: Consider React Query or similar for server state

---

## Implementation Priority

### Phase 1: Core Layout (High Priority)
1. Update AppShell with navigation sidebar
2. Implement role-based navigation items
3. Create empty states for non-admin users
4. Add responsive sidebar collapse

### Phase 2: Admin Features (Medium Priority)
1. Create Users page with table layout
2. Implement user search and filtering
3. Add user management actions (view, edit, delete)
4. Create add user functionality

### Phase 3: Polish & Enhancement (Low Priority)
1. Add loading states and skeleton screens
2. Implement keyboard shortcuts
3. Add subtle animations and transitions
4. Optimize mobile experience

---

## Success Metrics

### User Experience Goals
- **Role Clarity**: Users immediately understand their permission level
- **Navigation Efficiency**: < 2 clicks to reach any available feature
- **Visual Hierarchy**: Clear content prioritization through design
- **Accessibility**: WCAG 2.1 AA compliance

### Technical Goals
- **Performance**: < 100ms navigation between routes
- **Maintainability**: Component reusability > 80%
- **Responsiveness**: Seamless experience across all device sizes
- **Code Quality**: TypeScript strict mode with no any types

This design specification provides a comprehensive foundation for implementing a professional, role-based navigation system that scales with the application's growth while maintaining the existing forest green branding and Mantine component consistency.