import { Modal, Stack, Text, Button, Alert, Code, Group, CopyButton, ActionIcon, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconCopy, IconCheck } from '@tabler/icons-react';

interface PasswordDisplayModalProps {
  opened: boolean;
  onClose: () => void;
  temporaryPassword: string | null;
}

export function PasswordDisplayModal({
  opened,
  onClose,
  temporaryPassword,
}: PasswordDisplayModalProps) {
  if (!temporaryPassword) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Temporary Password Created"
      size="md"
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
      withCloseButton={false}
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title="Important: Save This Password"
          color="orange"
        >
          <Text size="sm">
            This temporary password will only be shown once.
            <br />
            Make sure to save it before closing this window.
          </Text>
        </Alert>

        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Temporary Password:
          </Text>

          <Group gap="xs" align="center">
            <Code
              block
              style={{
                flex: 1,
                fontSize: '18px',
                fontWeight: 600,
                padding: '12px 16px',
                fontFamily: 'monospace',
                userSelect: 'all',
              }}
            >
              {temporaryPassword}
            </Code>

            <CopyButton value={temporaryPassword} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy password'} withArrow>
                  <ActionIcon
                    color={copied ? 'green' : 'blue'}
                    variant="filled"
                    onClick={copy}
                    size="lg"
                  >
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>

        <Alert color="forestGreen" variant="light">
          <Text size="sm">
            The coach should change this password after their first login for security.
          </Text>
        </Alert>

        {/* Actions */}
        <Group justify="center" gap="md" mt="md">
          <Button
            color="green"
            onClick={onClose}
            size="md"
          >
            I've Saved the Password
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}