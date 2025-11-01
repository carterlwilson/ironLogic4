import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconLogin } from '@tabler/icons-react';
import { useAuth } from '../providers/AuthProvider';
import { useAppTitle } from '../hooks/useAppTitle';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const appTitle = useAppTitle();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+$/.test(value)) return 'Invalid email format';
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
    setLoginError(null);

    const result = await login(values);

    if (result.success) {
      navigate('/');
    } else {
      setLoginError(result.error?.message || 'Login failed');
    }
  };

  return (
    <Container size="xs" px="md" py="xl">
      <Stack gap="xl">
        <Box ta="center">
          <Title order={1} size="h2" mb="xs">
            Welcome Back
          </Title>
          <Text size="md" c="dimmed">
            Sign in to access your account
          </Text>
        </Box>

        <Paper shadow="md" p="xl" radius="md" withBorder>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="lg">
              {(loginError || error) && (
                <Alert
                  icon={<IconAlertCircle size={20} />}
                  title="Login Error"
                  color="red"
                  variant="light"
                >
                  {loginError || error?.message}
                </Alert>
              )}

              <TextInput
                label="Email"
                placeholder="your@email.com"
                size="lg"
                required
                {...form.getInputProps('email')}
                disabled={isLoading}
              />

              <PasswordInput
                label="Password"
                placeholder="Your password"
                size="lg"
                required
                {...form.getInputProps('password')}
                disabled={isLoading}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isLoading}
                leftSection={<IconLogin size={20} />}
              >
                Sign In
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text size="sm" ta="center" c="dimmed">
          {appTitle}
        </Text>
      </Stack>
    </Container>
  );
}