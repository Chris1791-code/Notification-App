import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { arrayRemove, arrayUnion, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

/**
 * Xin quyền, lấy Expo push token, và lưu vào users/{uid}.expoPushTokens.
 * Cloud Function `onNotificationPublished` (firebase/functions) đọc mảng này
 * để gửi push qua Expo Push Service (tự chuyển tiếp qua FCM/APNs).
 */
export async function registerForPushNotificationsAsync(uid: string): Promise<string | null> {
  if (!Device.isDevice) {
    // Simulator/emulator không nhận được push token thật.
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  // setDoc + merge thay vì updateDoc: hồ sơ users/{uid} có thể chưa tồn tại
  // ngay sau khi đăng nhập lần đầu.
  await setDoc(doc(db, 'users', uid), { expoPushTokens: arrayUnion(token) }, { merge: true });

  return token;
}

export async function unregisterPushToken(uid: string, token: string) {
  await updateDoc(doc(db, 'users', uid), { expoPushTokens: arrayRemove(token) });
}
