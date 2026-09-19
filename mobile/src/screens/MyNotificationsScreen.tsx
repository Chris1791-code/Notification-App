import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export function MyNotificationsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>{t('mine.title')}</Text>
      <View style={styles.emptyWrap}>
        <Text style={styles.empty}>{t('mine.empty')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 20, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, color: '#003B70' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  empty: { textAlign: 'center', color: '#94A3B8' }
});
