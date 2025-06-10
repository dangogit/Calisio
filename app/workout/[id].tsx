import { View, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircularTimer } from '@/components/CircularTimer';
import { useTimer } from '@/hooks/useTimer';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft, List, Play, Pause, SkipForward, Home, Pencil } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, useAnimatedProps } from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { spacing, borderRadius, typography, shadows } from '@/constants/designTokens';
import { testTimerLogic } from '@/utils/timerTest';

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

const CircularProgressDisplay = ({
  progress,         // 0 to 1
  size = 200,
  strokeWidth = 8,
  color = '#FFD700',
}: {
  progress: Reanimated.SharedValue<number>;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = interpolate(
      progress.value, 
      [0, 1], 
      [circumference, 0]
    );
    return {
      strokeDashoffset
    };
  });

  // Dynamic color: transparent if progress is 0, else use color
  const dynamicColor = progress.value === 0 ? 'transparent' : color;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#333"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={dynamicColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
    </View>
  );
};

export default function WorkoutTimer() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const workout = useWorkoutStore(state => state.workouts.find(w => w.id === id));
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showPlan, setShowPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Track total elapsed time
  const [supersetPhase, setSupersetPhase] = useState<'first' | 'second'>('first');
  
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const nextExercise = workout?.exercises[currentExerciseIndex + 1];
  const totalSets = currentExercise?.sets || 1;

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBgColor = useThemeColor({}, 'cardBackground');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const workColor = useThemeColor({}, 'workColor');
  const restColor = useThemeColor({}, 'restColor');
  
  // Calculate work time based on superset phase
  const workTime = (() => {
    if (!currentExercise) return 45;
    
    if (currentExercise.isSuperset && supersetPhase === 'second') {
      return currentExercise.supersetExercise?.workTime || 45;
    }
    
    return currentExercise.workTime || 45;
  })();
  
  // Get the appropriate rest time based on current exercise
  const restTime = currentExercise?.restTime || 30;

  // Move to next set or exercise
  const moveToNext = () => {
    console.log('moveToNext called - currentSet:', currentSet, 'totalSets:', totalSets, 'currentExerciseIndex:', currentExerciseIndex);
    
    if (currentSet < totalSets) {
      // Move to next set
      console.log('Moving to next set');
      setCurrentSet(prev => prev + 1);
      setSupersetPhase('first');
      switchPhase('WORK');
    } else {
      // Move to next exercise
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        console.log('Moving to next exercise');
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setSupersetPhase('first');
        switchPhase('WORK');
      } else {
        // Workout completed
        console.log('Workout completed');
        handleWorkoutComplete();
      }
    }
  };

  // Handle workout completion
  const handleWorkoutComplete = () => {
    // For now, just go back to home. In the future, this could show a completion screen
    // or navigate to the next workout in a program
    router.replace('/');
  };

  // Get next workout in the list
  const getNextWorkout = () => {
    const allWorkouts = useWorkoutStore.getState().workouts;
    const currentIndex = allWorkouts.findIndex(w => w.id === id);
    if (currentIndex >= 0 && currentIndex < allWorkouts.length - 1) {
      return allWorkouts[currentIndex + 1];
    }
    return null;
  };

  // Navigate to next workout
  const handleNextWorkout = () => {
    const nextWorkout = getNextWorkout();
    if (nextWorkout) {
      if (isActive || isPaused) {
        stop(); // Stop current timer
      }
      router.replace(`/workout/${nextWorkout.id}`);
    } else {
      // No next workout, go to home
      router.replace('/');
    }
  };

  // Timer completion handler
  const handleTimerComplete = () => {
    if (isRest) {
      // Rest period completed - move to next set/exercise
      moveToNext();
    } else {
      // Work period completed
      if (currentExercise?.isSuperset && supersetPhase === 'first') {
        // First exercise in superset completed, move to the second exercise
        setSupersetPhase('second');
        switchPhase('WORK');
      } else {
        // Regular exercise completed OR second exercise in superset completed
        switchPhase('REST');
      }
    }
  };

  const {
    timeLeft,
    state: timerState,
    phase: timerPhase,
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    isActive,
    isWork,
    isRest,
    start,
    pause,
    resume,
    stop,
    reset,
    switchPhase
  } = useTimer({
    workTime,
    restTime,
    onComplete: handleTimerComplete,
  });

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (isRunning) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      start();
    }
  };

  // Auto-start timer when workout state changes
  useEffect(() => {
    if (isIdle) {
      // Small delay to ensure state has settled
      const timer = setTimeout(() => {
        start();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentExerciseIndex, currentSet, supersetPhase, timerPhase, isIdle, start]);

  useEffect(() => {
    // Increment elapsed time counter when timer is active
    let interval: ReturnType<typeof setTimeout> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime((prev: number) => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const translateX = useSharedValue(0);
  
  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (e.translationX > 100) {
        // Swiped right - go to previous step
        handlePreviousSet();
      } else if (e.translationX < -100) {
        // Swiped left - go to next step
        handleNextSet();
      }
      translateX.value = withTiming(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format seconds to HH:MM:SS
  const formatLongerTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Load workout data
  useEffect(() => {
    if (!workout) {
      setIsLoading(true);
      // Simulate network request to fetch workout
      const timeout = setTimeout(() => {
        setIsLoading(false);
        // If still no workout, set error
        if (!workout) {
          setError("לא ניתן לטעון את האימון. בדוק את החיבור לאינטרנט ונסה שוב.");
        }
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [workout]);

  function handleNext() { // Manual navigation to next exercise
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      stop(); // Stop timer
      setCurrentExerciseIndex((prev: number) => prev + 1);
      setCurrentSet(1);
      setSupersetPhase('first');
    } else {
      // End of workout
      handleWorkoutComplete();
    }
  }

  function handlePrevious() { // Manual navigation to previous exercise/set
    stop(); // Stop timer
    // First check if we can go to previous set
    if (currentSet > 1) {
      setCurrentSet(currentSet - 1);
      setSupersetPhase('first');
    } else if (currentExerciseIndex > 0) {
      // Go to previous exercise, last set
      const prevExerciseIndex = currentExerciseIndex - 1;
      const prevExercise = workout?.exercises[prevExerciseIndex];
      const prevExerciseSets = prevExercise?.sets || 1;
      
      setCurrentExerciseIndex(prevExerciseIndex);
      setCurrentSet(prevExerciseSets);
      setSupersetPhase('first');
    }
  }

  function handlePreviousSet() { // Go back one step in progression
    console.log('handlePreviousSet called - isRest:', isRest, 'currentSet:', currentSet, 'supersetPhase:', supersetPhase);
    
    stop(); // Stop current timer
    
    if (isRest) {
      // Currently in rest mode, go back to the previous work phase
      console.log('In rest mode, going back to work phase');
      if (currentExercise?.isSuperset) {
        // For superset, go back to the second phase
        setSupersetPhase('second');
      }
      switchPhase('WORK');
    } else {
      // Currently in work mode
      if (currentExercise?.isSuperset && supersetPhase === 'second') {
        // In superset phase 2, go back to phase 1
        console.log('Superset phase 2 -> 1');
        setSupersetPhase('first');
        switchPhase('WORK');
      } else {
        // In superset phase 1 or regular exercise
        if (currentSet > 1) {
          // Go to previous set
          console.log('Going to previous set');
          setCurrentSet(prev => prev - 1);
          if (currentExercise?.isSuperset) {
            setSupersetPhase('second'); // Go to second phase of previous set
          }
          switchPhase('REST'); // Go to rest mode (as if we just finished the previous set)
        } else if (currentExerciseIndex > 0) {
          // Go to previous exercise's last set
          console.log('Going to previous exercise');
          const prevExerciseIndex = currentExerciseIndex - 1;
          const prevExercise = workout?.exercises[prevExerciseIndex];
          const prevExerciseSets = prevExercise?.sets || 1;
          
          setCurrentExerciseIndex(prevExerciseIndex);
          setCurrentSet(prevExerciseSets);
          
          if (prevExercise?.isSuperset) {
            setSupersetPhase('second'); // Go to second phase of last set
          } else {
            setSupersetPhase('first');
          }
          switchPhase('REST'); // Go to rest mode
        }
      }
    }
  }

  function handleNextExercise() { // Skip to next exercise entirely
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      stop(); // Stop current timer
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setSupersetPhase('first');
      switchPhase('WORK');
    } else {
      // End of workout
      handleWorkoutComplete();
    }
  }

  function handlePreviousExercise() { // Go to previous exercise entirely
    if (currentExerciseIndex > 0) {
      stop(); // Stop current timer
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setSupersetPhase('first');
      switchPhase('WORK');
    }
  }

  function handleNextSet() { // Skip button - moves to next step in current progression
    console.log('handleNextSet called - isRest:', isRest, 'currentSet:', currentSet, 'totalSets:', totalSets);
    
    if (isRest) {
      // If currently in rest period, go to next set or exercise (which starts work)
      console.log('In rest mode, calling moveToNext()');
      moveToNext();
    } else {
      // If currently in work period, check if it's a superset
      if (currentExercise?.isSuperset && supersetPhase === 'first') {
        // In superset phase 1, move to phase 2
        console.log('Superset phase 1 -> 2');
        setSupersetPhase('second');
        switchPhase('WORK');
      } else {
        // Regular exercise OR superset phase 2 completed, go to rest
        console.log('Going to rest mode');
        switchPhase('REST');
      }
    }
  }

  function handleRetry() {
    setError(null);
    setIsLoading(true);
    // Simulate network retry
    setTimeout(() => {
      setIsLoading(false);
      if (Math.random() > 0.5) {
        // Simulate successful retry
        router.replace('/');
      } else {
        // Simulate failed retry
        setError("לא ניתן לטעון את האימון. בדוק את החיבור לאינטרנט ונסה שוב.");
      }
    }, 1500);
  }

  // Add progress animation value
  const progress = useSharedValue(0);
  
  // Update progress when timeLeft changes
  useEffect(() => {
    const totalTime = isRest ? restTime : workTime;
    const currentProgress = 1 - (timeLeft / totalTime);
    // If timer just reset (timeLeft === totalTime), set progress to 0 instantly
    if (timeLeft === totalTime) {
      progress.value = 0;
    } else {
      progress.value = withTiming(currentProgress, { duration: 300 });
    }
  }, [timeLeft, isRest, workTime, restTime]);

  // Ensure progress resets instantly on skip/next/reset and when timer mode changes
  useEffect(() => {
    progress.value = 0;
  }, [currentExerciseIndex, currentSet, isRest]);

  // Also reset progress to 0 when timer is (re)started
  useEffect(() => {
    if (!isActive && timeLeft > 0) {
      progress.value = 0;
    }
  }, [isActive, timeLeft]);

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText type="subtitle" style={styles.centerText}>טוען אימון...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText color="error" style={styles.centerText}>{error}</ThemedText>
        <View style={styles.buttonContainer}>
          <ThemedButton title="נסה שוב" onPress={handleRetry} />
          <ThemedButton title="חזור" variant="secondary" onPress={() => router.back()} />
        </View>
      </ThemedView>
    );
  }

  if (!workout || !currentExercise) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ThemedText color="error" style={styles.centerText}>האימון לא נמצא</ThemedText>
        <View style={styles.buttonContainer}>
          <ThemedButton title="חזור" onPress={() => router.back()} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.topNavBar, { backgroundColor: cardBgColor }]}>
        {/* Edit button - Left */}
        <Pressable
          style={[styles.topNavButton, { backgroundColor: cardBgColor }]}
          onPress={() => router.push(`/workout/edit/${id}`)}
        >
          <Pencil size={20} color={workColor} />
        </Pressable>
        
        {/* Workout Plan title - Center */}
        <Pressable
          style={[styles.topNavCenter, { backgroundColor: cardBgColor }]}
          onPress={() => setShowPlan(true)}
        >
          <List color={textColor} size={20} />
          <ThemedText style={styles.topNavText}>תוכנית אימון</ThemedText>
        </Pressable>
        
        {/* Home button - Right */}
        <Pressable
          style={[styles.topNavButton, { backgroundColor: cardBgColor }]}
          onPress={() => router.replace('/')}
        >
          <Home color={textColor} size={20} />
        </Pressable>
      </View>

      {showPlan ? (
        <View style={styles.planContainer}>
          <ThemedText type="title" style={styles.planTitle}>תוכנית האימון</ThemedText>
          {workout.exercises.map((exercise: any, index: number) => (
            <Pressable 
              key={exercise.id}
              style={[
                styles.planExercise,
                { backgroundColor: cardBgColor },
                currentExerciseIndex === index && { backgroundColor: tintColor }
              ]}
              onPress={() => {
                if (isActive) {
                  stop(); // Stop timer and set to idle work mode
                }
                setCurrentExerciseIndex(index);
                setCurrentSet(1);
                setSupersetPhase('first');
                switchPhase('WORK');
                setShowPlan(false);
              }}
            >
              <ThemedText style={styles.planExerciseName}>{exercise.name}</ThemedText>
              <ThemedText color="secondary" style={styles.planExerciseSets}>{exercise.sets} סטים</ThemedText>
            </Pressable>
          ))}
          <ThemedButton 
            title="סגור"
            variant="secondary"
            onPress={() => setShowPlan(false)}
            fullWidth
          />
        </View>
      ) : (
        <GestureDetector gesture={swipeGesture}>
          <Reanimated.View style={[styles.workoutContainer, animatedStyle]}>
            {/* Top stats section */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <ThemedText color="secondary" style={styles.statLabel}>זמן שעבר</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>{formatLongerTime(elapsedTime)}</ThemedText>
              </View>
              
              <View style={styles.statBox}>
                <ThemedText color="secondary" style={styles.statLabel}>סטים</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>{currentSet}/{totalSets}</ThemedText>
              </View>
              
              <View style={styles.statBox}>
                <ThemedText color="secondary" style={styles.statLabel}>זמן שנותר</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.statValue}>{formatLongerTime(timeLeft)}</ThemedText>
              </View>
            </View>

            {/* Next up section */}
            <View style={styles.nextUpContainer}>            
              <ThemedText type="title" style={styles.currentExerciseName}>
                {currentExercise.isSuperset && supersetPhase === 'second' && currentExercise.supersetExercise 
                  ? currentExercise.supersetExercise.name 
                  : currentExercise.name}
                {currentExercise.isSuperset && !isRest && (
                  <ThemedText color="secondary" style={{ fontSize: 18 }}>
                    {` (${supersetPhase === 'first' ? '1' : '2'}/2)`}
                  </ThemedText>
                )}
              </ThemedText>

              {/* Superset indicator */}
              {currentExercise.isSuperset && (
                <View style={[styles.supersetIndicator, { backgroundColor: cardBgColor }]}>
                  <ThemedText color="info" style={styles.supersetText}>סופרסט</ThemedText>
                  <View style={styles.supersetProgress}>
                    <View style={[
                      styles.supersetDot, 
                      { backgroundColor: textSecondaryColor },
                      supersetPhase === 'first' && !isRest && { backgroundColor: workColor }
                    ]} />
                    <View style={[
                      styles.supersetDot, 
                      { backgroundColor: textSecondaryColor },
                      supersetPhase === 'second' && !isRest && { backgroundColor: workColor }
                    ]} />
                  </View>
                </View>
              )}

              <ThemedText color="secondary" style={styles.nextUpLabel}>הבא</ThemedText>
              <ThemedText 
                color={isRest ? "info" : "success"} 
                type="defaultSemiBold" 
                style={styles.nextExerciseName}
              >
                {isRest ?
                  // Currently resting, next is work
                  (currentSet < totalSets ?
                    `${currentExercise.name} - סט ${currentSet + 1}` : // Next is same exercise, next set
                    (nextExercise?.name || "סיום האימון") // Next is next exercise or end
                  ) :
                  // Currently working, next is...
                  (currentExercise.isSuperset && supersetPhase === 'first' && currentExercise.supersetExercise ?
                    `${currentExercise.supersetExercise.name} (2/2)` : // Next is the 2nd part of the superset
                    `מנוחה (${currentExercise.restTime}s)` // Next is rest
                  )
                }
              </ThemedText>
            </View>

            {/* Exercise visualization and timer */}
            <View style={[styles.timerContainer, { marginBottom: 140 }]}>
              <View style={styles.exerciseImageContainer}>
                <CircularProgressDisplay 
                  progress={progress}
                  size={200} 
                  strokeWidth={8}
                  color={isRest ? restColor : workColor}
                />
                <View style={[styles.exerciseIconContainer, { backgroundColor: cardBgColor }]}>
                  {isRest ? (
                    <ThemedText style={styles.exerciseIcon}>🥤</ThemedText>
                  ) : (
                    <ThemedText style={styles.exerciseIcon}>💪</ThemedText>
                  )}
                </View>
              </View>
              
              {/* Exercise name and timer */}
              <View style={styles.timerInfoContainer}>
                <ThemedText type="massive" style={styles.timerValue}>{formatTime(timeLeft)}</ThemedText>
                <ThemedText color="secondary" type="subtitle" style={styles.timerMode}>
                  {isRest ? 'מנוחה' : 'עבודה'}
                </ThemedText>
              </View>
            </View>
          </Reanimated.View>
        </GestureDetector>
      )}
      
      {/* Fixed Footer Controls - Positioned absolutely at bottom */}
      {!showPlan && (
        <View style={[styles.footerControls, { paddingBottom: insets.bottom + spacing.xl }]}>
          {/* Secondary controls row - Exercise navigation */}
          <View style={styles.secondaryControlsContainer}>
            {/* Previous Set/Phase - Left */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonTertiary, { backgroundColor: textSecondaryColor }]} 
              onPress={handlePreviousSet}
            >
              <ChevronLeft color="#FFFFFF" size={14} />
            </Pressable>
            
            {/* Next Set/Phase - Right */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonTertiary, { backgroundColor: textSecondaryColor }]} 
              onPress={handleNextSet}
            >
              <ChevronRight color="#FFFFFF" size={14} />
            </Pressable>
          </View>

          {/* Main control buttons row - Primary media controls */}
          <View style={styles.mainControlsContainer}>
            {/* Previous Exercise - Left */}
            <Pressable 
              style={[
                styles.footerButton, 
                styles.footerButtonSecondary,
                { backgroundColor: currentExerciseIndex === 0 ? '#1A1A1A' : '#777777' }
              ]} 
              onPress={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
            >
              <ChevronsLeft color={currentExerciseIndex === 0 ? '#777' : '#FFFFFF'} size={16} />
            </Pressable>
            
            {/* Play/Pause - Center (Primary button) */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonPrimary, { backgroundColor: workColor }]} 
              onPress={handlePlayPause}
            >
              {isRunning ? (
                <Pause color="#FFFFFF" size={20} />
              ) : (
                <Play color="#FFFFFF" size={20} />
              )}
            </Pressable>
            
            {/* Next Exercise - Right */}
            <Pressable 
              style={[
                styles.footerButton, 
                styles.footerButtonSecondary,
                { backgroundColor: currentExerciseIndex >= (workout?.exercises.length || 0) - 1 ? '#1A1A1A' : '#777777' }
              ]} 
              onPress={handleNextExercise}
              disabled={currentExerciseIndex >= (workout?.exercises.length || 0) - 1}
            >
              <ChevronsRight color={currentExerciseIndex >= (workout?.exercises.length || 0) - 1 ? '#777' : '#FFFFFF'} size={16} />
            </Pressable>
          </View>
          
          {/* Next workout button - Separate row */}
          {getNextWorkout() && (
            <View style={styles.nextWorkoutContainer}>
              <Pressable 
                style={[styles.footerButton, styles.nextWorkoutFooterButton, { backgroundColor: '#1F7D53' }]}
                onPress={handleNextWorkout}
              >
                <SkipForward color="#FFFFFF" size={16} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerText: {
    textAlign: 'center',
    marginTop: 100,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  workoutContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
  },
  nextUpContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  currentExerciseName: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  nextUpLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  nextExerciseName: {
    fontSize: typography.fontSize.lg,
  },
  supersetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  supersetText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  supersetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supersetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInfoContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  timerValue: {
    fontSize: typography.fontSize.huge,
    fontWeight: typography.fontWeight.bold,
  },
  timerMode: {
    fontSize: typography.fontSize.xl,
    marginTop: spacing.sm,
  },
  exerciseImageContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIconContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIcon: {
    fontSize: 40,
  },
  // Fixed Footer Controls
  footerControls: {
    position: 'relative',
    flexDirection: 'column',
    bottom: 0,
    left: 0,
    right: 0,
  },
  mainControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 25,
    gap: spacing.md,
  },
  secondaryControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: 1,
  },
  nextWorkoutContainer: {
    alignItems: 'center',
    width: '100%',
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.large,
  },
  footerButtonPrimary: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#0056CC',
  },
  footerButtonTertiary: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 3,
    borderColor: '#888888',
  },
  footerButtonSecondary: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 3,
    borderColor: '#999999',
  },
  nextWorkoutFooterButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 4,
    borderColor: '#248A3D',
    alignSelf: 'auto',
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  topNavButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flex: 1,
    marginHorizontal: spacing.md,
    justifyContent: 'center',
  },
  topNavText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
  },
  planContainer: {
    flex: 1,
    padding: spacing.xl,
  },
  planTitle: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  planExercise: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planExerciseName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  planExerciseSets: {
    fontSize: typography.fontSize.md,
  },
});