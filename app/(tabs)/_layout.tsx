import { Tabs } from 'expo-router';
import { ClipboardList, CirclePlus as PlusCircle, Clock } from 'lucide-react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const tabIconDefaultColor = useThemeColor({}, 'tabIconDefault');

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { 
          backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          height: 60, // Reduced height for icon-only design
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: tabIconDefaultColor,
        tabBarShowLabel: false, // Hide text labels
        headerStyle: { 
          backgroundColor,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'תוכניות', // Keep for accessibility
          tabBarIcon: ({ color, focused }) => (
            <ClipboardList 
              size={focused ? 28 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'תוכניות אימון', // Accessibility label
        }}
      />
      <Tabs.Screen
        name="add-plan"
        options={{
          title: 'הוסף תוכנית',
          tabBarIcon: ({ color, focused }) => (
            <PlusCircle 
              size={focused ? 28 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'הוסף תוכנית אימון חדשה',
        }}
      />
      <Tabs.Screen
        name="past-workouts"
        options={{
          title: 'אימונים קודמים',
          tabBarIcon: ({ color, focused }) => (
            <Clock 
              size={focused ? 28 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'היסטוריית אימונים',
        }}
      />
    </Tabs>
  );
}