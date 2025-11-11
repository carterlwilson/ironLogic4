import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Box,
  Alert,
  LoadingOverlay,
  Group,
  Progress,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconLock, IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';
import { validateResetToken, resetPassword } from '../services/authApi';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.newPassword) return 'Passwords do not match';
        return null;
      },
    },
  });

  // Calculate password strength
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return 'red';
    if (strength < 70) return 'yellow';
    return 'forestGreen';
  };

  const passwordStrength = getPasswordStrength(form.values.newPassword);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength);

  // Validate token on mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setErrorMessage('No reset token found in URL');
        setIsValidating(false);
        return;
      }

      try {
        const response = await validateResetToken(token);

        if (response.success && response.valid) {
          setIsTokenValid(true);
          setErrorMessage(null);
        } else {
          setIsTokenValid(false);
          setErrorMessage('This password reset link is invalid or has expired.');
        }
      } catch (error: any) {
        console.error('Token validation error:', error);
        setIsTokenValid(false);
        setErrorMessage('Unable to validate reset token. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    checkToken();
  }, [token]);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      notifications.show({
        title: 'Error',
        message: 'No reset token found',
        color: 'red',
        autoClose: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(token, values.newPassword);

      if (response.success) {
        setResetSuccess(true);

        notifications.show({
          title: 'Password Reset Successful',
          message: 'Your password has been updated.',
          color: 'forestGreen',
          autoClose: 5000,
        });
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);

      notifications.show({
        title: 'Password Reset Failed',
        message: error.message || 'Unable to reset password. Please try again or request a new reset link.',
        color: 'red',
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    navigate('/forgot-password');
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
          style={{ backgroundColor: 'white', position: 'relative' }}
        >
          <LoadingOverlay visible={isValidating} overlayProps={{ radius: 'lg', blur: 2 }} />

          {!isValidating && !isTokenValid && (
            <>
              {/* Error State - Invalid Token */}
              <Group justify="center" mb="md">
                <IconAlertCircle size={48} stroke={1.5} color="var(--mantine-color-red-6)" />
              </Group>

              <Title order={2} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
                Invalid Reset Link
              </Title>

              <Alert color="red" variant="light" mb="xl" icon={<IconAlertCircle size={16} />}>
                <Text size="sm">
                  {errorMessage || 'This password reset link is invalid or has expired.'}
                </Text>
              </Alert>

              <Text ta="center" size="sm" c="dimmed" mb="xl">
                Password reset links expire after 1 hour. Please request a new link to reset your password.
              </Text>

              <Button
                onClick={handleRequestNewLink}
                size="md"
                radius="md"
                fullWidth
                color="forestGreen"
              >
                Request New Reset Link
              </Button>

              <Anchor
                component={Link}
                to="/login"
                size="sm"
                c="forestGreen.6"
                ta="center"
                mt="md"
                style={{ display: 'block' }}
              >
                Back to Login
              </Anchor>
            </>
          )}

          {!isValidating && isTokenValid && !resetSuccess && (
            <>
              {/* Valid Token - Show Form */}
              <Title order={1} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
                Reset Password
              </Title>

              <Text ta="center" size="sm" c="dimmed" mb="xl">
                Enter your new password below.
              </Text>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <PasswordInput
                    label="New Password"
                    placeholder="Enter new password"
                    leftSection={<IconLock size={16} stroke={1.5} />}
                    size="md"
                    radius="md"
                    required
                    {...form.getInputProps('newPassword')}
                  />

                  {form.values.newPassword && (
                    <Box>
                      <Group justify="space-between" mb={5}>
                        <Text size="xs" c="dimmed">Password strength</Text>
                        <Text size="xs" c="dimmed">
                          {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Fair' : 'Strong'}
                        </Text>
                      </Group>
                      <Progress
                        value={passwordStrength}
                        color={passwordStrengthColor}
                        size="sm"
                        radius="md"
                      />
                      <Text size="xs" c="dimmed" mt={5}>
                        Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
                      </Text>
                    </Box>
                  )}

                  <PasswordInput
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    leftSection={<IconLock size={16} stroke={1.5} />}
                    size="md"
                    radius="md"
                    required
                    {...form.getInputProps('confirmPassword')}
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
                    Reset Password
                  </Button>
                </Stack>
              </form>
            </>
          )}

          {resetSuccess && (
            <>
              {/* Success State */}
              <Group justify="center" mb="md">
                <IconCircleCheck size={48} stroke={1.5} color="var(--mantine-color-forestGreen-6)" />
              </Group>

              <Title order={2} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
                Password Reset Complete
              </Title>

              <Text ta="center" size="sm" c="dimmed" mb="xl">
                Your password has been successfully updated. Choose your app below to continue.
              </Text>

              <Stack gap="md">
                <Button
                  component="a"
                  href={import.meta.env.VITE_CLIENT_APP_URL || 'http://localhost:3000'}
                  size="md"
                  radius="md"
                  fullWidth
                  color="forestGreen"
                >
                  Go to Coach/Admin Dashboard
                </Button>

                <Button
                  component="a"
                  href={import.meta.env.VITE_MOBILE_APP_URL || 'http://localhost:3002'}
                  size="md"
                  radius="md"
                  fullWidth
                  variant="outline"
                  color="forestGreen"
                >
                  Go to Client Mobile App
                </Button>
              </Stack>
            </>
          )}
        </Paper>

        {/* Help Text */}
        {!resetSuccess && (
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
        )}
      </Container>
    </Box>
  );
}
