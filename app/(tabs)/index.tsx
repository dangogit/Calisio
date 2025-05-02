import { View, StyleSheet, FlatList, Pressable, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WorkoutList() {
  const workouts = useWorkoutStore(state => state.workouts);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const secondaryTextColor = '#666';
  const buttonTextColor = useThemeColor({}, 'background');

  // Simulate fetching workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (err) {
        setError("שגיאת רשת: לא ניתן לטעון את האימונים. בדוק את החיבור לאינטרנט ונסה שוב.");
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Text style={[styles.loadingText, { color: textColor }]}>טוען אימונים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={[styles.retryButton, { backgroundColor: tintColor }]} onPress={handleRetry}>
          <Text style={[styles.retryButtonText, { color: buttonTextColor }]}>נסה שוב</Text>
        </Pressable>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Text style={[styles.emptyText, { color: textColor }]}>אין אימונים עדיין</Text>
        <Pressable 
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={() => router.push('/upload')}
        >
          <Text style={[styles.addButtonText, { color: buttonTextColor }]}>הוסף אימון</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.workoutItem}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            <Text style={[styles.workoutTitle, { color: textColor }]}>{item.title}</Text>
            <Text style={[styles.workoutExercises, { color: secondaryTextColor }]}>{item.exercises.length} תרגילים</Text>
            <ChevronLeft size={20} color={tintColor} />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      <Pressable 
        style={[styles.floatingButton, { backgroundColor: tintColor }]}
        onPress={() => router.push('/create-workout')}
      >
        <Text style={[styles.floatingButtonText, { color: buttonTextColor }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  workoutItem: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#222',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  workoutExercises: {
    fontSize: 14,
    marginRight: 8,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});