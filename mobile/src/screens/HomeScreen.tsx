import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNotifications } from '@/hooks/useNotifications';
import { useCategories } from '@/hooks/useCategories';
import type { RootStackParamList, TabParamList } from '@/navigation/RootNavigator';
import type { AppNotification } from '@/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { notifications, loading } = useNotifications();
  const { categories } = useCategories();

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.nameVi ?? id;
  const title = (n: AppNotification) => (i18n.language === 'en' && n.titleEn ? n.titleEn : n.titleVi);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>{t('home.title')}</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{t('home.empty')}</Text> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate('NotificationDetail', { notification: item })}
          >
            {item.priority === 'urgent' && <Text style={styles.urgentBadge}>{t('home.urgent')}</Text>}
            <Text style={styles.cardTitle}>{title(item)}</Text>
            <Text style={styles.cardCategory}>{categoryName(item.categoryId)}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 20, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, color: '#003B70' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  cardCategory: { marginTop: 4, fontSize: 12, color: '#64748B' },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 6
  },
  empty: { textAlign: 'center', color: '#94A3B8', marginTop: 40 }
});
