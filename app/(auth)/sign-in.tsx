import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmail } from '@/lib/auth';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';
import { colors, typography, radius, spacing } from '@/constants/theme';

const SignInScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email.trim(), password);
      // Navigation is handled by the (auth) layout redirect once the auth
      // store updates with the signed-in user — navigating here manually
      // raced ahead of the store and bounced users back to sign-in.
    } catch (e: any) {
      const msg = e?.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : e?.message || 'Sign in failed';
      setError(msg);
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    Alert.alert('Coming Soon', `${provider} sign-in will be configured with your Firebase project credentials.`);
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
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to begin your first session</Text>

        <TouchableOpacity style={styles.appleButton} onPress={() => handleSocialAuth('Apple')} activeOpacity={0.8}>
          <Text style={styles.appleButtonText}> Continue with Apple</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={() => handleSocialAuth('Google')} activeOpacity={0.8}>
          <Text style={styles.googleButtonText}>G  Continue with Google</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ height: 20 }} />

        <Button title="Sign In" onPress={handleSignIn} loading={loading} />

        <TouchableOpacity
          style={styles.footer}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text style={styles.footerLink}>Create one</Text>
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
  welcome: {
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
  appleButton: {
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonText: {
    ...typography.button.primary,
    color: colors.black,
  },
  googleButton: {
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.bg.input,
    borderWidth: 1,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  googleButtonText: {
    ...typography.button.primary,
    color: colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.DEFAULT,
  },
  dividerText: {
    ...typography.body.small,
    color: colors.text.faint,
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

export default SignInScreen;
