import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

export function NotificationDetailScreen({ route }: Props) {
  const { t, i18n } = useTranslation();
  const { notification } = route.params;

  const title = i18n.language === 'en' && notification.titleEn ? notification.titleEn : notification.titleVi;
  const body = i18n.language === 'en' && notification.bodyEn ? notification.bodyEn : notification.bodyVi;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        {notification.attachments.length > 0 && (
          <View style={styles.attachments}>
            <Text style={styles.attachmentsLabel}>{t('detail.attachments')}</Text>
            {notification.attachments.map((a) => (
              <Text key={a.url} style={styles.attachmentItem}>
                📎 {a.name}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 16 },
  title: { fontSize: 19, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, color: '#334155' },
  attachments: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12 },
  attachmentsLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  attachmentItem: { fontSize: 14, color: '#00529B', marginBottom: 4 }
});
