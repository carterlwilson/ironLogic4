import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Alert,
  Box,
  Anchor,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconMail,
  IconArrowLeft,
  IconCircleCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { forgotPassword } from '../services/authApi';

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      await forgotPassword(values.email);
      setIsSuccess(true);
    } catch (err) {
      // Always show success message to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSuccess) {
    return (
      <Container size="xs" px="md" py="xl">
        <Stack gap="xl">
          <Box ta="center">
            <IconCircleCheck
              size={64}
              style={{ color: 'var(--mantine-color-green-6)', margin: '0 auto' }}
            />
            <Title order={1} size="h2" mt="md" mb="xs">
              Check Your Email
            </Title>
            <Text size="md" c="dimmed">
              If an account exists with that email address, we've sent password reset
              instructions.
            </Text>
          </Box>

          <Paper shadow="md" p="xl" radius="md" withBorder>
            <Stack gap="lg">
              <Alert
                icon={<IconMail size={20} />}
                title="Email Link Opens in Browser"
                color="blue"
                variant="light"
              >
                The password reset link in the email will open in your web browser, not
                in this mobile app.
              </Alert>

              <Button
                size="lg"
                fullWidth
                variant="outline"
                leftSection={<IconArrowLeft size={20} />}
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xs" px="md" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={1} size="h2" mb="xs">
            Reset Password
          </Title>
          <Text size="md" c="dimmed">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </Box>

        <Paper shadow="md" p="xl" radius="md" withBorder>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {error && (
                <Alert
                  icon={<IconAlertCircle size={20} />}
                  title="Error"
                  color="red"
                  variant="light"
                >
                  {error}
                </Alert>
              )}

              <TextInput
                label="Email"
                placeholder="your@email.com"
                size="lg"
                required
                leftSection={<IconMail size={20} />}
                {...form.getInputProps('email')}
                disabled={isLoading}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isLoading}
                style={{ backgroundColor: 'var(--mantine-color-green-6)' }}
              >
                Send Reset Link
              </Button>

              <Anchor
                component="button"
                type="button"
                size="sm"
                ta="center"
                onClick={handleBackToLogin}
                disabled={isLoading}
              >
                Back to Login
              </Anchor>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
