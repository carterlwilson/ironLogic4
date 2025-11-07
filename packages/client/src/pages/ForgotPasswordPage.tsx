import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Anchor,
  Box,
  Group,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconArrowLeft, IconCircleCheck } from '@tabler/icons-react';
import { forgotPassword } from '../services/authApi';

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address';
        return null;
      },
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      await forgotPassword(values.email);

      // Always show success message to prevent email enumeration
      setEmailSent(true);

      notifications.show({
        title: 'Email Sent',
        message: 'If an account exists with this email, you will receive password reset instructions.',
        color: 'forestGreen',
        autoClose: 5000,
      });
    } catch (error: any) {
      // Even on error, we show success to prevent enumeration
      // But we can log the error for debugging
      console.error('Forgot password error:', error);
      setEmailSent(true);

      notifications.show({
        title: 'Request Submitted',
        message: 'If an account exists with this email, you will receive password reset instructions.',
        color: 'forestGreen',
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9fa'
      }}
    >
      <Container size={420} style={{ width: '100%' }}>
        <Paper
          withBorder
          shadow="lg"
          p={40}
          radius="lg"
          style={{ backgroundColor: 'white' }}
        >
          {!emailSent ? (
            <>
              {/* Header Section */}
              <Title order={1} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
                Forgot Password?
              </Title>

              <Text ta="center" size="sm" c="dimmed" mb="xl">
                Enter your email address and we'll send you instructions to reset your password.
              </Text>

              {/* Form */}
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <TextInput
                    label="Email Address"
                    placeholder="your.email@company.com"
                    leftSection={<IconMail size={16} stroke={1.5} />}
                    size="md"
                    radius="md"
                    required
                    {...form.getInputProps('email')}
                  />

                  <Button
                    type="submit"
                    size="md"
                    radius="md"
                    fullWidth
                    mt="md"
                    loading={isLoading}
                    disabled={!form.isValid() || isLoading}
                    color="forestGreen"
                  >
                    Send Reset Link
                  </Button>

                  <Anchor
                    component={Link}
                    to="/login"
                    size="sm"
                    c="forestGreen.6"
                    ta="center"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <IconArrowLeft size={16} stroke={1.5} />
                    Back to Login
                  </Anchor>
                </Stack>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <Group justify="center" mb="md">
                <IconCircleCheck size={48} stroke={1.5} color="var(--mantine-color-forestGreen-6)" />
              </Group>

              <Title order={2} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
                Check Your Email
              </Title>

              <Text ta="center" size="sm" c="dimmed" mb="xl">
                If an account exists with the email <strong>{form.values.email}</strong>, you will receive password reset instructions shortly.
              </Text>

              <Alert color="blue" variant="light" mb="md">
                <Text size="sm">
                  The reset link will expire in 1 hour. If you don't receive an email, please check your spam folder.
                </Text>
              </Alert>

              <Button
                component={Link}
                to="/login"
                size="md"
                radius="md"
                fullWidth
                variant="outline"
                color="forestGreen"
                leftSection={<IconArrowLeft size={16} stroke={1.5} />}
              >
                Back to Login
              </Button>
            </>
          )}
        </Paper>

        {/* Help Text */}
        <Paper
          withBorder
          p="md"
          radius="md"
          mt="lg"
          style={{
            backgroundColor: 'var(--mantine-color-forestGreen-0)',
            borderColor: 'var(--mantine-color-forestGreen-2)'
          }}
        >
          <Text size="xs" c="dimmed" ta="center">
            Need help? Contact your system administrator for assistance.
          </Text>
        </Paper>
      </Container>
    </Box>
  );
}
