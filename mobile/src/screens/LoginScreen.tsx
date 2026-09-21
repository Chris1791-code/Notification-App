import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';

// Danh sách domain email được phép tự đăng ký, cách nhau bằng dấu phẩy (vd.
// "hcmut.edu.vn,oisp.hcmut.edu.vn"). Để trống = không giới hạn. Hạn chế theo
// domain trường giúp giảm tài khoản rác/bot tự đăng ký — không thay thế được
// Firebase App Check, chỉ là lớp chặn đơn giản phía client.
const ALLOWED_EMAIL_DOMAINS: string[] = (process.env.EXPO_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? '')
  .split(',')
  .map((d: string) => d.trim().toLowerCase())
  .filter((d: string) => d.length > 0);

function isAllowedEmail(email: string) {
  if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const domain = email.trim().toLowerCase().split('@')[1];
  return !!domain && ALLOWED_EMAIL_DOMAINS.some((allowed: string) => domain === allowed || domain.endsWith(`.${allowed}`));
}

export function LoginScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        if (!isAllowedEmail(email)) {
          setError(t('auth.domainNotAllowed', { domains: ALLOWED_EMAIL_DOMAINS.join(', ') }));
          setSubmitting(false);
          return;
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: displayName.trim() });
        // role phải là 'student' — Firestore rules chỉ cho phép self-signup với role này,
        // ngăn người dùng tự đặt mình làm admin/editor.
        await setDoc(doc(db, 'users', credential.user.uid), {
          displayName: displayName.trim(),
          email: credential.user.email,
          role: 'student'
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

      {mode === 'signUp' && (
        <View style={styles.field}>
          <Text style={styles.label}>{t('auth.displayName')}</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{mode === 'signIn' ? t('auth.signInButton') : t('auth.signUpButton')}</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.switchButton}
        onPress={() => {
          setError(null);
          setMode(mode === 'signIn' ? 'signUp' : 'signIn');
        }}
      >
        <Text style={styles.switchText}>{mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#003B70', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: '#334155', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF'
  },
  error: { color: '#DC2626', fontSize: 13, marginBottom: 12 },
  button: {
    backgroundColor: '#00529B',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  switchButton: { marginTop: 16, alignItems: 'center' },
  switchText: { color: '#00529B', fontSize: 13, fontWeight: '500' }
});
