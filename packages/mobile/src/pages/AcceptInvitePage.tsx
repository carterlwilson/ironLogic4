import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Grid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser, IconLock } from '@tabler/icons-react';
import { validateInviteToken, acceptInvite } from '../services/authApi';

interface AccountSetupFormValues {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountSetupFormValues>({
    initialValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      firstName: (value) => (!value.trim() ? 'First name is required' : null),
      lastName: (value) => (!value.trim() ? 'Last name is required' : null),
      password: (value) =>
        value.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  useEffect(() => {
    if (!token) {
      setValidationError('No invite token found. Please use the link from your invitation email.');
      setValidating(false);
      return;
    }

    validateInviteToken(token)
      .then((result) => {
        if (result.valid && result.data) {
          setTokenValid(true);
          setEmail(result.data.email);
          if (result.data.firstName) form.setFieldValue('firstName', result.data.firstName);
          if (result.data.lastName) form.setFieldValue('lastName', result.data.lastName);
        } else {
          setValidationError(
            'This invite link is invalid or has expired. Please contact your gym to request a new invitation.'
          );
        }
      })
      .catch(() => {
        setValidationError('Unable to validate your invite link. Please try again later.');
      })
      .finally(() => {
        setValidating(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (values: AccountSetupFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await acceptInvite({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });

      // Store tokens and user — same pattern as normal login
      const tokens = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      };
      const user = { ...result.data.user, role: result.data.user.userType };
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));

      navigate('/', { replace: true });
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validating) {
    return (
      <Container size="xs" py="xl">
        <Paper p="xl" radius="md" withBorder>
          <Text ta="center" c="dimmed">Validating your invite link…</Text>
        </Paper>
      </Container>
    );
  }

  if (validationError) {
    return (
      <Container size="xs" py="xl">
        <Paper p="xl" radius="md" withBorder>
          <Stack gap="md">
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Invalid Invite">
              {validationError}
            </Alert>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" py="xl">
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="lg">
          <div>
            <Title order={2} mb="xs">Create Your Account</Title>
            <Text size="sm" c="dimmed">
              You've been invited to join. Set up your account below.
            </Text>
          </div>

          <TextInput
            label="Email"
            value={email}
            readOnly
            disabled
          />

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="First Name"
                    placeholder="First name"
                    leftSection={<IconUser size={16} />}
                    required
                    {...form.getInputProps('firstName')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Last Name"
                    placeholder="Last name"
                    leftSection={<IconUser size={16} />}
                    required
                    {...form.getInputProps('lastName')}
                  />
                </Grid.Col>
              </Grid>

              <PasswordInput
                label="Password"
                placeholder="At least 8 characters"
                leftSection={<IconLock size={16} />}
                required
                {...form.getInputProps('password')}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Repeat your password"
                leftSection={<IconLock size={16} />}
                required
                {...form.getInputProps('confirmPassword')}
              />

              {submitError && (
                <Alert icon={<IconAlertCircle size={16} />} color="red">
                  {submitError}
                </Alert>
              )}

              <Button
                type="submit"
                color="forestGreen"
                size="lg"
                fullWidth
                loading={isSubmitting}
              >
                Create Account
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
