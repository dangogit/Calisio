import { View, StyleSheet, FlatList, Pressable, Text, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

export default function WorkoutList() {
  const workouts = useWorkoutStore(state => state.workouts);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#00FF7F" />
        <Text style={styles.loadingText}>טוען אימונים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>נסה שוב</Text>
        </Pressable>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>אין אימונים עדיין</Text>
        <Pressable 
          style={styles.addButton}
          onPress={() => router.push('/upload')}
        >
          <Text style={styles.addButtonText}>הוסף אימון</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable 
            style={styles.workoutItem}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            <Text style={styles.workoutTitle}>{item.title}</Text>
            <Text style={styles.workoutExercises}>{item.exercises.length} תרגילים</Text>
            <ChevronLeft size={20} color="#00FF7F" />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      <Pressable 
        style={styles.floatingButton}
        onPress={() => router.push('/create-workout')}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  workoutExercises: {
    color: '#666',
    fontSize: 14,
    marginRight: 8,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#00FF7F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
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
    backgroundColor: '#00FF7F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#fff',
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
    backgroundColor: '#00FF7F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});