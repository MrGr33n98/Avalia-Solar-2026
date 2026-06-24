import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { Home, Compass, MessageSquare, User } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const user = useAuthStore((state) => state.user);
  const canUseP2PChat = user?.role === 'review';
  
  // Cores personalizadas baseadas no app de referência
  const activeColor = colors.brandDarkBlue || colors.brandDarkBlue; // Azul Escuro da referência
  const inactiveColor = scheme === 'dark' ? colors.textSecondary : colors.textSecondary;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.backgroundElement,
          borderTopColor: 'transparent',
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Radar',
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="p2p_chat/index"
        options={{
          href: canUseP2PChat ? undefined : null,
          title: 'Mensagens',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      
      {/* Rotas secundárias ocultas da Tab Bar (precisam ter um arquivo .tsx correspondente na raiz do app) */}
      <Tabs.Screen name="calculadora" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="inversores" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="baterias" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="instalacao" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="requests" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="guides" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="notifications" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="scanner" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dashboard" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="request-quote" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="compare" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat/index" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="company/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="company/[id]/lead" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="company/[id]/services" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="checkout" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      
      {/* Novas rotas de fechamento do sitemap */}
      <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="forgot-password" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="search" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="company/[id]/reviews" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="company/[id]/rate" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="products/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dashboard/leads" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dashboard/reviews" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dashboard/settings" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="dashboard/plans" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="select-location" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="select-city" options={{ href: null, tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
export { AppTabs };
