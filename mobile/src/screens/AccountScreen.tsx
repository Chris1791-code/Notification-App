import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from '@/firebase';

const LANGUAGES: { code: 'vi' | 'en'; label: string }[] = [
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' }
];

export function AccountScreen() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>{t('account.title')}</Text>

      <Text style={styles.sectionLabel}>{t('account.language')}</Text>
      <View style={styles.langRow}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => i18n.changeLanguage(lang.code)}
            style={[styles.langChip, i18n.language === lang.code && styles.langChipActive]}
          >
            <Text style={[styles.langChipText, i18n.language === lang.code && styles.langChipTextActive]}>
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.spacer} />

      {user && (
        <View>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Pressable style={styles.button} onPress={() => signOut(auth)}>
            <Text style={styles.buttonText}>{t('account.logout')}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16 },
  header: { fontSize: 20, fontWeight: '600', paddingTop: 12, paddingBottom: 16, color: '#003B70' },
  sectionLabel: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  langRow: { flexDirection: 'row', gap: 8 },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1'
  },
  langChipActive: { backgroundColor: '#00529B', borderColor: '#00529B' },
  langChipText: { color: '#334155', fontSize: 13 },
  langChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  spacer: { height: 24 },
  userEmail: { fontSize: 14, color: '#0F172A', marginBottom: 12 },
  button: { backgroundColor: '#00529B', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: '600' }
});
