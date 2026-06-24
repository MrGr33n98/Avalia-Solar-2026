import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { pushTokensApi } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('p2p-chat', {
      name: 'Chat P2P',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (currentPermissions.status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') return null;

  const configuredProjectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  const projectId = configuredProjectId && configuredProjectId !== 'YOUR-PROJECT-ID'
    ? configuredProjectId
    : undefined;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  await pushTokensApi.register({
    token: token.data,
    platform,
    device_id: Device.osInternalBuildId || Device.modelId || null,
  });

  return token.data;
}

export function addP2PNotificationResponseListener(
  handler: (conversationId?: number) => void
) {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const rawConversationId =
      response.notification.request.content.data?.conversation_id;
    const conversationId =
      typeof rawConversationId === 'number'
        ? rawConversationId
        : Number(rawConversationId);

    handler(Number.isFinite(conversationId) ? conversationId : undefined);
  });
}
