import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Home, Cpu, Battery, Wrench, User } from 'lucide-react-native';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  // Cores personalizadas baseadas no app de referência
  const activeColor = colors.brandDarkBlue || '#003E7E'; // Azul Escuro da referência
  const inactiveColor = scheme === 'dark' ? '#64748B' : '#94A3B8';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
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
        name="inversores"
        options={{
          title: 'Inversores',
          tabBarIcon: ({ color, focused }) => (
            <Cpu color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="baterias"
        options={{
          title: 'Baterias',
          tabBarIcon: ({ color, focused }) => (
            <Battery color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="instalacao"
        options={{
          title: 'Instalação',
          tabBarIcon: ({ color, focused }) => (
            <Wrench color={color} size={focused ? 24 : 22} strokeWidth={focused ? 2.5 : 2} />
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
      
      {/* Esconde as rotas auxiliares da TabBar, mas mantém no Router */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
export { AppTabs };
