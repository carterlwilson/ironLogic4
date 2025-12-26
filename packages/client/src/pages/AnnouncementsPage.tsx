import { Container, Title, Text, Stack, Paper, Button, Group, Notification } from '@mantine/core';
import { IconSpeakerphone, IconCheck, IconX } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { RichTextEditor } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { authenticatedRequest } from '../services/tokenRefresh';
import type { Announcement } from '@ironlogic4/shared/types/announcements';
import type { ApiResponse } from '@ironlogic4/shared/types/api';

export function AnnouncementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Redirect non-owner/admin users
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

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
    content: '',
  });

  // Fetch existing announcement on mount
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const response = await authenticatedRequest<ApiResponse<Announcement | null>>('/api/gym/announcements');
        if (response.success && response.data) {
          setAnnouncement(response.data);
          editor?.commands.setContent(response.data.content);
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      }
    };

    if (editor) {
      fetchAnnouncement();
    }
  }, [editor]);

  const handleSave = async () => {
    if (!editor) return;

    const content = editor.getHTML();

    setLoading(true);
    try {
      const response = await authenticatedRequest<ApiResponse<Announcement>>('/api/gym/announcements', {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });

      if (response.success && response.data) {
        setAnnouncement(response.data);
        setNotification({ type: 'success', message: 'Announcement saved successfully!' });
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to save announcement. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    editor?.commands.clearContent();
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Notification */}
        {notification && (
          <Notification
            icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
            color={notification.type === 'success' ? 'green' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        )}

        {/* Page Header */}
        <Group gap="sm">
          <IconSpeakerphone size={32} color="#22c55e" />
          <Title order={1}>Gym Announcement</Title>
        </Group>

        <Text size="lg" c="dimmed">
          Create or edit an announcement that will be displayed on the mobile app home screen for all gym members.
        </Text>

        {/* Editor */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text fw={500} size="sm">Announcement Content</Text>

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

              <RichTextEditor.Content
                style={{ minHeight: '200px' }}
              />
            </RichTextEditor>

            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
              >
                Save Announcement
              </Button>
            </Group>
          </Stack>
        </Paper>

        {announcement && (
          <Paper shadow="sm" p="lg" radius="md" withBorder>
            <Stack gap="xs">
              <Text fw={500} size="sm" c="dimmed">
                Last updated: {new Date(announcement.updatedAt).toLocaleString()}
              </Text>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
