import { Tabs } from 'expo-router';
import { Chrome as Home, CirclePlus as PlusCircle, Clock } from 'lucide-react-native';
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
          title: 'בית', // Keep for accessibility
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={focused ? 28 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'דף הבית', // Accessibility label
        }}
      />
      <Tabs.Screen
        name="add-plan"
        options={{
          title: 'צור אימון',
          tabBarIcon: ({ color, focused }) => (
            <PlusCircle 
              size={focused ? 28 : 24} 
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
          tabBarAccessibilityLabel: 'צור אימון חדש',
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