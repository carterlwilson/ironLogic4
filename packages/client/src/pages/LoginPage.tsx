import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Anchor,
  Alert,
  LoadingOverlay,
  Group,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconLock, IconAlertCircle, IconShield } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();

  // Note: Redirect logic is handled by AuthGuard component

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Please enter a valid email address';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    clearError();
    await login(values);
    // Navigation will be handled automatically by AuthGuard when isAuthenticated becomes true
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
      <Container size={420} style={{ width: '100%' }}>
        <Paper
          withBorder
          shadow="lg"
          p={40}
          radius="lg"
          style={{ backgroundColor: 'white' }}
        >
          <LoadingOverlay visible={isLoading} overlayProps={{ radius: 'lg', blur: 2 }} />

          {/* Header Section */}
          <Group justify="center" mb="xl">
            <IconShield size={40} stroke={1.5} color="#22c55e" />
          </Group>

          <Title order={1} ta="center" mb="xs" style={{ color: '#1f2937', fontWeight: 700 }}>
            Welcome Back
          </Title>

          <Text ta="center" size="sm" c="dimmed" mb="xl">
            Sign in to your IronLogic4 account
          </Text>

          {/* Error Alert */}
          {error && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              mb="md"
              radius="md"
            >
              {error.message}
            </Alert>
          )}

          {/* Login Form */}
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
                onChange={(event) => {
                  form.getInputProps('email').onChange(event);
                  handleInputChange();
                }}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                leftSection={<IconLock size={16} stroke={1.5} />}
                size="md"
                radius="md"
                required
                {...form.getInputProps('password')}
                onChange={(event) => {
                  form.getInputProps('password').onChange(event);
                  handleInputChange();
                }}
              />

              <Group justify="space-between" mt="xs">
                <Anchor
                  component="button"
                  type="button"
                  c="green.6"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement forgot password functionality
                    console.log('Forgot password clicked');
                  }}
                >
                  Forgot your password?
                </Anchor>
              </Group>

              <Button
                type="submit"
                size="md"
                radius="md"
                fullWidth
                mt="md"
                loading={isLoading}
                disabled={!form.isValid() || isLoading}
                color="green"
              >
                Sign In
              </Button>
            </Stack>
          </form>

          {/* Footer */}
          <Text ta="center" mt="xl" size="sm" c="dimmed">
            Don't have an account?{' '}
            <Anchor
              component="button"
              type="button"
              c="forestGreen.6"
              fw={500}
              onClick={() => {
                // TODO: Navigate to registration page
                console.log('Register clicked');
              }}
            >
              Contact your administrator
            </Anchor>
          </Text>
        </Paper>

        {/* Security Notice */}
        <Paper
          withBorder
          p="md"
          radius="md"
          mt="lg"
          style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
        >
          <Group gap="xs">
            <IconShield size={16} color="#22c55e" />
            <Text size="xs" c="dimmed">
              Your connection is secure and encrypted
            </Text>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
}