import { Tabs } from 'expo-router';
import { Home, List } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const tabIconDefaultColor = useThemeColor({}, 'tabIconDefault');
  const textColor = useThemeColor({}, 'text');

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor },
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: tabIconDefaultColor,
        headerStyle: { backgroundColor },
        headerTintColor: textColor,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'אימונים',
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'הוסף אימון',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}