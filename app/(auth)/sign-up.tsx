import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { signUpWithEmail } from '@/lib/auth';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { colors, typography, radius } from '@/constants/theme';

const SignUpScreen = () => {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUpWithEmail(email.trim(), password, displayName.trim());
      router.replace('/(app)/(session)');
    } catch (e: any) {
      const msg = e?.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists'
        : e?.message || 'Sign up failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={['rgba(120,80,200,0.08)', colors.bg.primary]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Begin your introspection journey</Text>

        <TextInput
          placeholder="Display name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <View style={{ height: 10 }} />

        <TextInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={{ height: 10 }} />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <View style={{ height: 10 }} />

        <TextInput
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: 20 }} />

        <Button title="Create Account" onPress={handleSignUp} loading={loading} />

        <TouchableOpacity
          style={styles.footer}
          onPress={() => router.back()}
        >
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 28,
    color: colors.white,
  },
  subtitle: {
    ...typography.body.default,
    color: colors.text.muted,
    marginTop: 6,
    marginBottom: 40,
  },
  error: {
    ...typography.body.small,
    color: colors.danger,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    ...typography.body.default,
    color: colors.text.muted,
  },
  footerLink: {
    color: colors.purple.DEFAULT,
  },
});

export default SignUpScreen;
