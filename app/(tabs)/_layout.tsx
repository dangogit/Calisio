import { Tabs } from 'expo-router';
import { ClipboardList, PlusCircle, Clock } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const tabIconDefaultColor = useThemeColor({}, 'tabIconDefault');
  const textColor = useThemeColor({}, 'text');

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { 
          backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: tabIconDefaultColor,
        headerStyle: { 
          backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: textColor,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'תוכניות',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
          tabBarLabelStyle: { fontWeight: 'bold', fontSize: 12, marginTop: 0 },
        }}
      />
      <Tabs.Screen
        name="add-plan"
        options={{
          title: 'הוסף תוכנית',
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
          tabBarLabelStyle: { fontWeight: 'bold', fontSize: 12, marginTop: 0 },
        }}
      />
      <Tabs.Screen
        name="past-workouts"
        options={{
          title: 'אימונים קודמים',
          tabBarIcon: ({ color }) => <Clock size={24} color={color} />,
          tabBarLabelStyle: { fontWeight: 'bold', fontSize: 12, marginTop: 0 },
        }}
      />
    </Tabs>
  );
}