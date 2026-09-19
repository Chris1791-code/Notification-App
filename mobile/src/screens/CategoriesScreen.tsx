import { FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/hooks/useCategories';

export function CategoriesScreen() {
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>{t('categories.title')}</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Text style={styles.row}>{i18n.language === 'en' ? item.nameEn : item.nameVi}</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 20, fontWeight: '600', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, color: '#003B70' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 14,
    color: '#0F172A'
  }
});
