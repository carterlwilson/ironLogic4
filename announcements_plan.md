# Implementation Plan: Gym Announcements Feature

## Feature Overview

Allow gym owners to create/edit an announcement that displays on the mobile app home page for all clients.

**User Requirements:**
- Gym owners can edit a single announcement with rich text formatting (bold, italic, links)
- Announcement managed from Settings or Dashboard in the web app
- Announcement displayed prominently on mobile app home page
- Single announcement per gym (not a list)

---

## Architecture Summary

This feature follows existing patterns discovered in the codebase:

### Data Flow
1. **Server**: MongoDB model → Controller → Routes
2. **Shared**: TypeScript types + Zod schemas
3. **Client Web**: API Service → Hook → UI Component
4. **Mobile**: API Request → Hook → Display Component

### Database Model
- Collection: `announcements`
- Unique index on `gymId` (one announcement per gym)
- Fields: `gymId`, `content` (HTML string), `updatedAt`, `createdAt`

### API Endpoints
- `GET /api/gym/announcements` - Get announcement for authenticated user's gym
- `PUT /api/gym/announcements` - Create or update announcement (owner/admin only)
- `DELETE /api/gym/announcements` - Delete announcement (owner/admin only)

---

## Implementation Breakdown

### Phase 1: Shared Package (Foundation)

**Files to create:**
1. `/packages/shared/src/types/announcements.ts`
2. `/packages/shared/src/schemas/announcements.ts`

**Files to modify:**
1. `/packages/shared/src/index.ts` - Add exports
2. `/packages/shared/package.json` - Add package exports

**Type Definitions (`types/announcements.ts`):**
```typescript
export interface Announcement {
  id: string;
  gymId: string;
  content: string; // HTML content from rich text editor
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertAnnouncementRequest {
  content: string; // HTML string
}
```

**Zod Schema (`schemas/announcements.ts`):**
```typescript
import { z } from 'zod';

export const UpsertAnnouncementSchema = z.object({
  content: z
    .string()
    .min(1, 'Announcement content is required')
    .max(10000, 'Content must be less than 10,000 characters'),
});

export type UpsertAnnouncementInput = z.infer<typeof UpsertAnnouncementSchema>;
```

**Package Exports (package.json):**
```json
{
  "exports": {
    "./types/announcements": {
      "types": "./dist/types/announcements.d.ts",
      "import": "./dist/types/announcements.js",
      "require": "./dist/types/announcements.js"
    },
    "./schemas/announcements": {
      "types": "./dist/schemas/announcements.d.ts",
      "import": "./dist/schemas/announcements.js",
      "require": "./dist/schemas/announcements.js"
    }
  }
}
```

---

### Phase 2: Server Implementation

**Files to create:**
1. `/packages/server/src/models/Announcement.ts`
2. `/packages/server/src/controllers/announcements.ts`
3. `/packages/server/src/routes/gym/announcements.ts`
4. `/packages/server/src/utils/sanitizeHtml.ts` (security)

**Files to modify:**
1. `/packages/server/src/index.ts` - Register routes

**Dependencies to add:**
- `sanitize-html` - For HTML sanitization (prevent XSS)

#### Model (`models/Announcement.ts`)

Pattern: Follow Gym model structure

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import type { Announcement as AnnouncementType } from '@ironlogic4/shared/types/announcements';

export interface AnnouncementDocument extends Document, Omit<AnnouncementType, 'id'> {
  _id: string;
}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    gymId: {
      type: String,
      required: true,
      unique: true, // ONE announcement per gym
      ref: 'Gym',
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Announcement = mongoose.model<AnnouncementDocument>('Announcement', announcementSchema);
```

#### Controller (`controllers/announcements.ts`)

Pattern: Follow coaches controller structure

**Operations:**
1. `getAnnouncement` - GET for current user's gym
2. `upsertAnnouncement` - PUT to create/update (owner/admin only)
3. `deleteAnnouncement` - DELETE (owner/admin only)

**Key logic:**
- Validate with Zod schema
- Sanitize HTML content (prevent XSS)
- Scope to `req.user.gymId` for owners
- Use `findOneAndUpdate` with `upsert: true` for PUT
- Return `ApiResponse<Announcement>` format

```typescript
// Example upsert logic
export const upsertAnnouncement = async (req: Request, res: Response) => {
  // 1. Validate
  const validation = UpsertAnnouncementSchema.safeParse(req.body);
  if (!validation.success) { /* return 400 */ }

  // 2. Get gymId (owner has gymId, admin can specify)
  const gymId = req.user?.userType === 'owner'
    ? req.user.gymId
    : req.body.gymId;

  // 3. Sanitize HTML
  const sanitizedContent = sanitizeHtml(validation.data.content);

  // 4. Upsert (create or update)
  const announcement = await Announcement.findOneAndUpdate(
    { gymId },
    { content: sanitizedContent },
    { new: true, upsert: true, runValidators: true }
  );

  // 5. Return
  res.status(200).json({ success: true, data: announcement.toJSON() });
};
```

#### Routes (`routes/gym/announcements.ts`)

Pattern: Follow coaches route structure

```typescript
import express from 'express';
import { verifyToken, requireOwnerOrAdminForGym } from '../../middleware/auth.js';
import { getAnnouncement, upsertAnnouncement, deleteAnnouncement } from '../../controllers/announcements.js';

const router = express.Router();

// GET /api/gym/announcements - Any authenticated user can read
router.get('/', verifyToken, getAnnouncement);

// PUT /api/gym/announcements - Owner/Admin only
router.put('/', verifyToken, requireOwnerOrAdminForGym, upsertAnnouncement);

// DELETE /api/gym/announcements - Owner/Admin only
router.delete('/', verifyToken, requireOwnerOrAdminForGym, deleteAnnouncement);

export default router;
```

#### HTML Sanitization (`utils/sanitizeHtml.ts`)

**Important**: Prevent XSS attacks by sanitizing HTML

```typescript
import sanitizeHtml from 'sanitize-html';

export function sanitizeAnnouncementHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    // Force external links to open in new tab
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
}
```

#### Route Registration (`index.ts`)

Add to route registration section (around line 74-85):

```typescript
import gymAnnouncementRoutes from './routes/gym/announcements.js';
// ...
app.use('/api/gym/announcements', gymAnnouncementRoutes);
```

---

### Phase 3: Client Web App Implementation

**Files to create:**
1. `/packages/client/src/services/announcementApi.ts`
2. `/packages/client/src/hooks/useAnnouncement.ts`
3. `/packages/client/src/components/AnnouncementEditor.tsx` (rich text editor component)

**Files to modify:**
1. `/packages/client/src/pages/Dashboard.tsx` - Add announcement section
2. `/packages/client/package.json` - Add Tiptap dependencies

**Dependencies to add:**
```json
{
  "@mantine/tiptap": "^7.0.0",
  "@tiptap/react": "^2.1.0",
  "@tiptap/starter-kit": "^2.1.0",
  "@tiptap/extension-link": "^2.1.0"
}
```

#### API Service (`services/announcementApi.ts`)

Pattern: Follow coachApi structure

```typescript
import type { ApiResponse } from '@ironlogic4/shared';
import type { Announcement, UpsertAnnouncementRequest } from '@ironlogic4/shared/types/announcements';

class AnnouncementApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/announcements`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) throw new Error('No auth token');
    const { accessToken } = JSON.parse(authTokens);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  async getAnnouncement(): Promise<ApiResponse<Announcement | null>> {
    const response = await fetch(this.baseUrl, {
      headers: await this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch announcement');
    return response.json();
  }

  async upsertAnnouncement(data: UpsertAnnouncementRequest): Promise<ApiResponse<Announcement>> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to save announcement');
    return response.json();
  }

  async deleteAnnouncement(): Promise<ApiResponse<void>> {
    const response = await fetch(this.baseUrl, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete announcement');
    return response.json();
  }
}

export const announcementApi = new AnnouncementApiService();
```

#### Hook (`hooks/useAnnouncement.ts`)

Pattern: Follow useCoachManagement structure

```typescript
import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { announcementApi } from '../services/announcementApi';
import type { Announcement } from '@ironlogic4/shared/types/announcements';

export const useAnnouncement = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const loadAnnouncement = useCallback(async () => {
    setLoading(true);
    try {
      const response = await announcementApi.getAnnouncement();
      if (response.success) {
        setAnnouncement(response.data ?? null);
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAnnouncement = useCallback(async (content: string) => {
    setLoading(true);
    try {
      const response = await announcementApi.upsertAnnouncement({ content });
      if (response.success) {
        setAnnouncement(response.data);
        setIsEditing(false);
        notifications.show({
          title: 'Success',
          message: 'Announcement saved successfully',
          color: 'green',
        });
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAnnouncement = useCallback(async () => {
    setLoading(true);
    try {
      await announcementApi.deleteAnnouncement();
      setAnnouncement(null);
      notifications.show({
        title: 'Success',
        message: 'Announcement deleted',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncement();
  }, [loadAnnouncement]);

  return {
    announcement,
    loading,
    isEditing,
    setIsEditing,
    saveAnnouncement,
    deleteAnnouncement,
    reload: loadAnnouncement,
  };
};
```

#### Rich Text Editor Component (`components/AnnouncementEditor.tsx`)

Using Mantine Tiptap (compatible with Mantine v7):

```typescript
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Stack, Group } from '@mantine/core';

interface AnnouncementEditorProps {
  initialContent: string;
  onSave: (html: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AnnouncementEditor({ initialContent, onSave, onCancel, loading }: AnnouncementEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: initialContent,
  });

  const handleSave = () => {
    if (editor) {
      const html = editor.getHTML();
      onSave(html);
    }
  };

  return (
    <Stack>
      <RichTextEditor editor={editor}>
        <RichTextEditor.Toolbar sticky stickyOffset={60}>
          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Bold />
            <RichTextEditor.Italic />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.Link />
            <RichTextEditor.Unlink />
          </RichTextEditor.ControlsGroup>

          <RichTextEditor.ControlsGroup>
            <RichTextEditor.BulletList />
            <RichTextEditor.OrderedList />
          </RichTextEditor.ControlsGroup>
        </RichTextEditor.Toolbar>

        <RichTextEditor.Content />
      </RichTextEditor>

      <Group justify="flex-end">
        <Button variant="subtle" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={loading}>
          Save Announcement
        </Button>
      </Group>
    </Stack>
  );
}
```

#### Dashboard Integration (`pages/Dashboard.tsx`)

Add announcement section to Dashboard page:

```typescript
import { useAnnouncement } from '../hooks/useAnnouncement';
import { AnnouncementEditor } from '../components/AnnouncementEditor';

// Inside Dashboard component:
const { announcement, loading, isEditing, setIsEditing, saveAnnouncement, deleteAnnouncement } = useAnnouncement();
const { user } = useAuth();

const canEditAnnouncement = user?.role === 'owner' || user?.role === 'admin';

// Add to render (as a Card or Paper):
{canEditAnnouncement && (
  <Paper shadow="sm" p="lg" withBorder>
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Gym Announcement</Title>
        {!isEditing && (
          <Group>
            <Button size="sm" onClick={() => setIsEditing(true)}>
              {announcement ? 'Edit' : 'Create'} Announcement
            </Button>
            {announcement && (
              <Button size="sm" color="red" variant="subtle" onClick={deleteAnnouncement}>
                Delete
              </Button>
            )}
          </Group>
        )}
      </Group>

      {isEditing ? (
        <AnnouncementEditor
          initialContent={announcement?.content || ''}
          onSave={saveAnnouncement}
          onCancel={() => setIsEditing(false)}
          loading={loading}
        />
      ) : (
        <>
          {announcement ? (
            <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
          ) : (
            <Text c="dimmed">No announcement set</Text>
          )}
        </>
      )}
    </Stack>
  </Paper>
)}
```

---

### Phase 4: Mobile App Implementation

**Files to create:**
1. `/packages/mobile/src/hooks/useAnnouncement.ts`

**Files to modify:**
1. `/packages/mobile/src/pages/MobileHomePage.tsx` - Display announcement

#### Hook (`hooks/useAnnouncement.ts`)

Pattern: Follow existing mobile hooks, using shared `apiRequest` helper

```typescript
import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { ApiResponse } from '@ironlogic4/shared';
import type { Announcement } from '@ironlogic4/shared/types/announcements';

interface UseAnnouncementResult {
  announcement: Announcement | null;
  loading: boolean;
  error: Error | null;
}

export function useAnnouncement(): UseAnnouncementResult {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await apiRequest<ApiResponse<Announcement | null>>('/api/gym/announcements');

        if (response.success) {
          setAnnouncement(response.data ?? null);
        }
      } catch (err: any) {
        setError(err);
        console.error('Failed to fetch announcement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  return { announcement, loading, error };
}
```

#### Home Page Display (`pages/MobileHomePage.tsx`)

Add announcement card at top of home page:

```typescript
import { useAnnouncement } from '../hooks/useAnnouncement';
import { IconSpeakerphone } from '@tabler/icons-react';

// Inside MobileHomePage component:
const { announcement, loading: announcementLoading } = useAnnouncement();

// Add to render (near the top of Stack):
{announcement && !announcementLoading && (
  <Card shadow="sm" padding="lg" radius="md" withBorder style={{ backgroundColor: '#f0fdf4' }}>
    <Stack gap="sm">
      <Group gap="sm">
        <IconSpeakerphone size={24} color="#22c55e" />
        <Text fw={600} size="lg">Announcement</Text>
      </Group>
      <div
        dangerouslySetInnerHTML={{ __html: announcement.content }}
        style={{
          color: '#374151',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      />
      <Text size="xs" c="dimmed" mt="xs">
        Updated {new Date(announcement.updatedAt).toLocaleDateString()}
      </Text>
    </Stack>
  </Card>
)}
```

---

## Security Considerations

1. **HTML Sanitization**: Server-side using `sanitize-html` package
2. **Authentication**: All routes protected with `verifyToken` middleware
3. **Authorization**: PUT/DELETE require `requireOwnerOrAdminForGym`
4. **Gym Scoping**: Announcements automatically scoped to user's gymId
5. **XSS Prevention**: Sanitize HTML before storing, use safe allowed tags only
6. **Link Safety**: Force external links to open in new tab with `rel="noopener noreferrer"`

---

## Testing Checklist

### Server
- [ ] Create announcement as owner
- [ ] Update announcement as owner
- [ ] Delete announcement as owner
- [ ] Verify admin can manage any gym's announcement
- [ ] Verify coach/client cannot create/update/delete
- [ ] Verify HTML sanitization removes dangerous tags
- [ ] Verify unique constraint (one per gym)

### Client Web
- [ ] Owner can create announcement
- [ ] Owner can edit announcement
- [ ] Owner can delete announcement
- [ ] Rich text formatting works (bold, italic, links)
- [ ] Announcement persists across page reloads
- [ ] Coach/client cannot see announcement editor

### Mobile
- [ ] Announcement displays on home page
- [ ] HTML renders correctly
- [ ] Links open in new tab
- [ ] No announcement shows nothing (graceful)
- [ ] Updates appear after owner edits

---

## Files Summary

### To Create (10 files)
1. `packages/shared/src/types/announcements.ts`
2. `packages/shared/src/schemas/announcements.ts`
3. `packages/server/src/models/Announcement.ts`
4. `packages/server/src/controllers/announcements.ts`
5. `packages/server/src/routes/gym/announcements.ts`
6. `packages/server/src/utils/sanitizeHtml.ts`
7. `packages/client/src/services/announcementApi.ts`
8. `packages/client/src/hooks/useAnnouncement.ts`
9. `packages/client/src/components/AnnouncementEditor.tsx`
10. `packages/mobile/src/hooks/useAnnouncement.ts`

### To Modify (6 files)
1. `packages/shared/src/index.ts`
2. `packages/shared/package.json`
3. `packages/server/src/index.ts`
4. `packages/client/package.json`
5. `packages/client/src/pages/Dashboard.tsx`
6. `packages/mobile/src/pages/MobileHomePage.tsx`

### Dependencies to Install
- Server: `sanitize-html` + `@types/sanitize-html`
- Client: `@mantine/tiptap`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`

---

## Implementation Order

**Recommended approach: Bottom-up (foundation first)**

1. **Shared Package** - Types and schemas (no dependencies)
2. **Server** - Backend API (depends on shared)
3. **Client Web** - Owner management UI (depends on server API)
4. **Mobile App** - Client display (depends on server API)

This allows testing each layer before moving to the next.
