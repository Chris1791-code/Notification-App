import '@/i18n';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';
import { registerForPushNotificationsAsync } from '@/notifications';
import { RootNavigator } from '@/navigation/RootNavigator';

export default function App() {
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        registerForPushNotificationsAsync(user.uid).catch(() => {
          // Không xin được quyền hoặc không lấy được token — bỏ qua, người
          // dùng vẫn dùng app bình thường, chỉ không nhận push.
        });
      }
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
