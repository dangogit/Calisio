import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CalendarCheck, Clock, AlignStartHorizontal as BarChartHorizontal } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { spacing, borderRadius, shadows } from '@/constants/designTokens';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlansScreen() {
  const workouts = useWorkoutStore(state => state.workouts);
  const addWorkout = useWorkoutStore(state => state.addWorkout);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const cardBgColor = useThemeColor({}, 'cardBackground');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');

  // Simulate fetching workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Add a test workout if none exist for debugging timer issues
        if (workouts.length === 0) {
          const testWorkout = {
            id: 'test-timer-' + Date.now(),
            title: 'Timer Debug Test',
            exercises: [
              {
                id: 'ex1',
                name: 'Test Exercise 1',
                sets: 2,
                workTime: 10,  // 10 seconds work
                restTime: 20,  // 20 seconds rest
              },
              {
                id: 'ex2',
                name: 'Test Exercise 2',
                sets: 1,
                workTime: 15,
                restTime: 30,
              }
            ]
          };
          
          const supersetTestWorkout = {
            id: 'superset-test-' + Date.now(),
            title: 'Superset Debug Test',
            exercises: [
              {
                id: 'ss1',
                name: 'Push-ups',
                sets: 2,
                workTime: 10,  // 10 seconds for first exercise
                restTime: 30,  // 30 seconds rest after complete superset
                isSuperset: true,
                supersetExercise: {
                  name: 'Squats',
                  workTime: 8   // 8 seconds for second exercise
                }
              },
              {
                id: 'reg1',
                name: 'Regular Exercise',
                sets: 2,
                workTime: 12,
                restTime: 25,
              }
            ]
          };
          
          addWorkout(testWorkout);
          addWorkout(supersetTestWorkout);
        }
        
        setIsLoading(false);
      } catch (err) {
        setError("שגיאת רשת: לא ניתן לטעון את התוכניות. בדוק את החיבור לאינטרנט ונסה שוב.");
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
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <ThemedText type="subtitle" color="secondary" style={styles.centerText}>
            טוען תוכניות אימון...
          </ThemedText>
        </Animated.View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ThemedText color="error" style={styles.centerText}>
            {error}
          </ThemedText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.buttonContainer}>
          <ThemedButton title="נסה שוב" onPress={handleRetry} />
        </Animated.View>
      </ThemedView>
    );
  }

  if (workouts.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <ThemedText type="subtitle" style={styles.centerText}>
            אין תוכניות אימון עדיין
          </ThemedText>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.buttonContainer}>
          <ThemedButton 
            title="הוסף תוכנית אימון" 
            onPress={() => router.push('/add-plan')}
            fullWidth
          />
        </Animated.View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <ThemedText type="title" style={styles.headerTitle}>
          תוכניות האימון שלך
        </ThemedText>
      </Animated.View>
      
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedPressable 
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={[styles.workoutCard, { backgroundColor: cardBgColor }, shadows.medium]}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <ThemedText type="heading3" style={styles.workoutTitle}>{item.title}</ThemedText>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=60' }} 
                style={styles.workoutImage}
              />
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.infoItem}>
                <ThemedText color="secondary" style={styles.infoText}>3 פעמים בשבוע</ThemedText>
                <CalendarCheck size={16} color={tintColor} style={styles.infoIcon} />
              </View>
              
              <View style={styles.infoItem}>
                <ThemedText color="secondary" style={styles.infoText}>45 דק' לאימון</ThemedText>
                <Clock size={16} color={tintColor} style={styles.infoIcon} />
              </View>
              
              <View style={styles.infoItem}>
                <ThemedText color="secondary" style={styles.infoText}>{item.exercises.length} תרגילים</ThemedText>
                <BarChartHorizontal size={16} color={tintColor} style={styles.infoIcon} />
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Pressable 
                style={[styles.startButton, { backgroundColor: tintColor }]}
                onPress={() => router.push(`/workout/${item.id}`)}
              >
                <ChevronLeft size={18} color="#FFFFFF" style={styles.infoIcon} />
                <ThemedText style={[styles.startButtonText, { color: '#FFFFFF' }]}>התחל אימון</ThemedText>
              </Pressable>
            </View>
          </AnimatedPressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      <Pressable 
        style={[styles.floatingButton, { backgroundColor: tintColor }, shadows.large]}
        onPress={() => router.push('/add-plan')}
      >
        <ThemedText style={[styles.floatingButtonText, { color: '#FFFFFF' }]}>+</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  headerTitle: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  workoutCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  workoutTitle: {
    flex: 1,
    textAlign: 'right',
  },
  workoutImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    marginLeft: spacing.md,
  },
  cardContent: {
    padding: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    justifyContent: 'flex-end',
  },
  infoIcon: {
    marginLeft: spacing.sm,
    marginRight: 2,
  },
  infoText: {
    fontSize: 14,
  },
  cardFooter: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  startButton: {
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.xxl,
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
});