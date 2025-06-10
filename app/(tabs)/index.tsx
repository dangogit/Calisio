import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CalendarCheck, Clock, AlignStartHorizontal as BarChartHorizontal, TrendingUp } from 'lucide-react-native';
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
const { width: screenWidth } = Dimensions.get('window');

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
            title: 'אימון כח עליון',
            exercises: [
              {
                id: 'ex1',
                name: 'מתח עליון',
                sets: 3,
                workTime: 45,
                restTime: 60,
              },
              {
                id: 'ex2',
                name: 'שכיבות שמיכה',
                sets: 3,
                workTime: 30,
                restTime: 45,
              }
            ]
          };
          
          const supersetTestWorkout = {
            id: 'superset-test-' + Date.now(),
            title: 'אימון סופרסט מתקדם',
            exercises: [
              {
                id: 'ss1',
                name: 'שכיבות שמיכה',
                sets: 3,
                workTime: 45,
                restTime: 90,
                isSuperset: true,
                supersetExercise: {
                  name: 'כפיפות בטן',
                  workTime: 30
                }
              },
              {
                id: 'reg1',
                name: 'מתח רחב',
                sets: 3,
                workTime: 45,
                restTime: 60,
              }
            ]
          };

          const fullBodyWorkout = {
            id: 'full-body-' + Date.now(),
            title: 'אימון גוף מלא',
            exercises: [
              {
                id: 'fb1',
                name: 'סקוואט',
                sets: 4,
                workTime: 60,
                restTime: 90,
              },
              {
                id: 'fb2',
                name: 'לחיצת חזה',
                sets: 3,
                workTime: 45,
                restTime: 75,
              },
              {
                id: 'fb3',
                name: 'חתירה',
                sets: 3,
                workTime: 45,
                restTime: 75,
              }
            ]
          };
          
          addWorkout(testWorkout);
          addWorkout(supersetTestWorkout);
          addWorkout(fullBodyWorkout);
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

  const calculateWorkoutDuration = (exercises: any[]) => {
    let totalMinutes = 0;
    exercises.forEach(exercise => {
      const workTime = exercise.workTime * exercise.sets;
      const restTime = exercise.restTime * (exercise.sets - 1);
      const supersetTime = exercise.isSuperset && exercise.supersetExercise 
        ? exercise.supersetExercise.workTime * exercise.sets 
        : 0;
      totalMinutes += (workTime + restTime + supersetTime) / 60;
    });
    return Math.round(totalMinutes);
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <ThemedText type="subtitle" color="secondary" style={styles.centerText}>
              טוען תוכניות אימון...
            </ThemedText>
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <ThemedText color="error" style={styles.centerText}>
              {error}
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.buttonContainer}>
            <ThemedButton title="נסה שוב" onPress={handleRetry} />
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  if (workouts.length === 0) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.emptyContainer}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.emptyContent}>
            <View style={[styles.emptyIcon, { backgroundColor: cardBgColor }]}>
              <BarChartHorizontal size={48} color={tintColor} />
            </View>
            <ThemedText type="title" style={styles.emptyTitle}>
              התחל את המסע שלך
            </ThemedText>
            <ThemedText color="secondary" style={styles.emptySubtitle}>
              צור את תוכנית האימון הראשונה שלך{'\n'}והתחל להתאמן היום
            </ThemedText>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.emptyActions}>
            <ThemedButton 
              title="צור תוכנית אימון" 
              onPress={() => router.push('/add-plan')}
              size="large"
              fullWidth
            />
          </Animated.View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Section */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.headerContent}>
          <ThemedText type="title" style={styles.headerTitle}>
            תוכניות האימון
          </ThemedText>
          <ThemedText color="secondary" style={styles.headerSubtitle}>
            {workouts.length} תוכניות זמינות
          </ThemedText>
        </View>
        
        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: cardBgColor }, shadows.medium]}>
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <TrendingUp size={20} color={tintColor} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>12</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>אימונים השבוע</ThemedText>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: textSecondaryColor }]} />
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <Clock size={20} color={tintColor} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>8.5</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>שעות השבוע</ThemedText>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: textSecondaryColor }]} />
          
          <View style={styles.statItem}>
            <View style={styles.statIconContainer}>
              <BarChartHorizontal size={20} color={tintColor} />
            </View>
            <ThemedText type="defaultSemiBold" style={styles.statValue}>85%</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>השלמה</ThemedText>
          </View>
        </View>
      </Animated.View>
      
      {/* Workout Plans List */}
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedPressable 
            entering={FadeInDown.delay(index * 100 + 200).duration(400)}
            style={[styles.workoutCard, { backgroundColor: cardBgColor }, shadows.medium]}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            {/* Card Image */}
            <View style={styles.cardImageContainer}>
              <Image 
                source={{ uri: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
                style={styles.cardImage}
              />
              <View style={styles.cardImageOverlay}>
                <View style={[styles.difficultyBadge, { backgroundColor: tintColor }]}>
                  <ThemedText style={[styles.difficultyText, { color: '#FFFFFF' }]}>
                    {item.exercises.length > 4 ? 'מתקדם' : item.exercises.length > 2 ? 'בינוני' : 'מתחיל'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <ThemedText type="heading3" style={styles.workoutTitle}>{item.title}</ThemedText>
              
              <View style={styles.workoutMeta}>
                <View style={styles.metaItem}>
                  <BarChartHorizontal size={14} color={textSecondaryColor} />
                  <ThemedText color="secondary" style={styles.metaText}>
                    {item.exercises.length} תרגילים
                  </ThemedText>
                </View>
                
                <View style={styles.metaItem}>
                  <Clock size={14} color={textSecondaryColor} />
                  <ThemedText color="secondary" style={styles.metaText}>
                    {calculateWorkoutDuration(item.exercises)} דק'
                  </ThemedText>
                </View>
                
                <View style={styles.metaItem}>
                  <CalendarCheck size={14} color={textSecondaryColor} />
                  <ThemedText color="secondary" style={styles.metaText}>
                    3 פעמים בשבוע
                  </ThemedText>
                </View>
              </View>

              {/* Action Button */}
              <Pressable 
                style={[styles.startButton, { backgroundColor: tintColor }]}
                onPress={() => router.push(`/workout/${item.id}`)}
              >
                <ThemedText style={[styles.startButtonText, { color: '#FFFFFF' }]}>התחל אימון</ThemedText>
                <ChevronLeft size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </AnimatedPressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 300,
  },
  centerText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    textAlign: 'right',
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 125, 83, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    opacity: 0.3,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  workoutCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 120,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardImageOverlay: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: spacing.lg,
  },
  workoutTitle: {
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});