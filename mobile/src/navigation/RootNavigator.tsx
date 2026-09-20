import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/firebase';
import { HomeScreen } from '@/screens/HomeScreen';
import { CategoriesScreen } from '@/screens/CategoriesScreen';
import { SavedScreen } from '@/screens/SavedScreen';
import { MyNotificationsScreen } from '@/screens/MyNotificationsScreen';
import { AccountScreen } from '@/screens/AccountScreen';
import { NotificationDetailScreen } from '@/screens/NotificationDetailScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import type { AppNotification } from '@/types';

export type RootStackParamList = {
  Tabs: undefined;
  NotificationDetail: { notification: AppNotification };
};

export type TabParamList = {
  Home: undefined;
  Categories: undefined;
  Saved: undefined;
  Mine: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Categories" component={CategoriesScreen} options={{ title: t('tabs.categories') }} />
      <Tab.Screen name="Saved" component={SavedScreen} options={{ title: t('tabs.saved') }} />
      <Tab.Screen name="Mine" component={MyNotificationsScreen} options={{ title: t('tabs.mine') }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: t('tabs.account') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setCheckingAuth(false);
      }),
    []
  );

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator color="#00529B" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
