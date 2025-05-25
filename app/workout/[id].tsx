import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, Animated } from 'react-native';
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
import colors from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { testTimerLogic } from '@/utils/timerTest';
import * as Haptics from 'expo-haptics';

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
  const backgroundColor = "#121212"; // Use a dark background
  const tintColor = "#1F7D53";
  const textColor = "#fff";
  const accentColor = "#00AAFF"; // Blue color for accents
  const restColor = "#7AB555"; // Green color for rest periods
  
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
    if (currentSet < totalSets) {
      // Move to next set
      setCurrentSet(prev => prev + 1);
      setSupersetPhase('first');
      reset(false); // Reset to work mode
    } else {
      // Move to next exercise
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
        setSupersetPhase('first');
        reset(false); // Reset to work mode
      } else {
        // Workout completed
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
    // Haptic feedback on timer completion
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    if (isResting) {
      // Rest period completed - move to next set/exercise
      moveToNext();
    } else {
      // Work period completed
      if (currentExercise?.isSuperset && supersetPhase === 'first') {
        // First exercise in superset completed, move to the second exercise
        setSupersetPhase('second');
        reset(false); // Reset to work mode for superset part 2
        start();
      } else {
        // Regular exercise completed OR second exercise in superset completed
        reset(true); // Reset to rest mode
        start();
      }
    }
  };

  const {
    timeLeft,
    isActive,
    isResting,
    isPaused,
    start,
    pause,
    reset,
    stop,
    toggleMode
  } = useTimer({
    workTime,
    restTime,
    onComplete: handleTimerComplete,
  });

  // Handle play/pause toggle
  const handlePlayPause = () => {
    // Haptic feedback for play/pause
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (isActive) {
      pause();
    } else {
      start();
    }
  };

  useEffect(() => {
    // Increment elapsed time counter when timer is active
    let interval: ReturnType<typeof setTimeout> | null = null; // Changed NodeJS.Timeout to ReturnType<typeof setTimeout>
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime((prev: number) => prev + 1); // Added type for prev
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
    }  }, [workout]);

  function handleNext() { // Manual navigation to next exercise
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      if (isActive || isPaused) {
        stop(); // Stop timer
      }
      setCurrentExerciseIndex((prev: number) => prev + 1); // Added type for prev
      setCurrentSet(1);
      setSupersetPhase('first');
    } else {
      // End of workout
      handleWorkoutComplete();
    }
  }

  function handlePrevious() { // Manual navigation to previous exercise/set
    if (isActive || isPaused) {
      stop(); // Stop timer
    }
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
    if (isActive || isPaused) {
      stop(); // Stop timer
    }
    
    if (isResting) {
      // Currently resting, go back to last work phase
      if (currentExercise?.isSuperset) {
        setSupersetPhase('second'); // Go back to superset phase 2
      }
      reset(false); // Reset to work mode
    } else {
      // Currently working
      if (currentExercise?.isSuperset && supersetPhase === 'second') {
        // In superset phase 2, go back to phase 1
        setSupersetPhase('first');
        reset(false); // Reset to work mode
      } else {
        // In superset phase 1 or regular exercise, go to previous set's rest if exists
        if (currentSet > 1 || currentExerciseIndex > 0) {
          // Go to previous "step" which would be the rest period before this work
          reset(true); // Go to rest mode
        }
      }
    }
  }

  function handleNextExercise() { // Skip to next exercise entirely
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      if (isActive || isPaused) {
        stop(); // Stop timer
      }
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setSupersetPhase('first');
      reset(false); // Reset to work mode
    } else {
      // End of workout
      handleWorkoutComplete();
    }
  }

  function handlePreviousExercise() { // Go to previous exercise entirely
    if (currentExerciseIndex > 0) {
      if (isActive || isPaused) {
        stop(); // Stop timer
      }
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setSupersetPhase('first');
      reset(false); // Reset to work mode
    }
  }

  function handleNextSet() { // Skip button - moves to next step in current progression
    console.log('🔥 HANDLE NEXT SET called with state:', { 
      isResting, 
      supersetPhase,
      isSuperset: currentExercise?.isSuperset,
      workTime, 
      restTime, 
      currentExerciseName: currentExercise?.name,
      currentExerciseWorkTime: currentExercise?.workTime,
      currentExerciseRestTime: currentExercise?.restTime
    });
    
    // Haptic feedback for navigation
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (isResting) {
      // If currently in rest period, go to next set or exercise (which starts work)
      moveToNext();
    } else {
      // If currently in work period, check if it's a superset
      if (currentExercise?.isSuperset && supersetPhase === 'first') {
        // In superset phase 1, move to phase 2
        setSupersetPhase('second');
        reset(false); // Reset to work mode for superset part 2
        setTimeout(() => start(), 0);
      } else {
        // Regular exercise OR superset phase 2 completed, go to rest
        reset(true); // Reset to rest mode
        setTimeout(() => start(), 0);
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
    const totalTime = isResting ? restTime : workTime;
    const currentProgress = 1 - (timeLeft / totalTime);
    // If timer just reset (timeLeft === totalTime), set progress to 0 instantly
    if (timeLeft === totalTime) {
      progress.value = 0;
    } else {
      progress.value = withTiming(currentProgress, { duration: 300 });
    }
  }, [timeLeft, isResting, workTime, restTime]);

  // Ensure progress resets instantly on skip/next/reset and when timer mode changes
  useEffect(() => {
    progress.value = 0;
  }, [currentExerciseIndex, currentSet, isResting]);

  // Also reset progress to 0 when timer is (re)started
  useEffect(() => {
    if (!isActive && timeLeft > 0) {
      progress.value = 0;
    }
  }, [isActive, timeLeft]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Text style={styles.loadingText}>טוען אימון...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>נסה שוב</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>חזור</Text>
        </Pressable>
      </View>
    );
  }

  if (!workout || !currentExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Text style={styles.errorText}>האימון לא נמצא</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>חזור</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
        {/* Edit button - Left */}
        <Pressable
          style={styles.topNavButton}
          onPress={() => router.push(`/workout/edit/${id}`)}
        >
          <Pencil size={20} color="#00AAFF" />
        </Pressable>
        
        {/* Workout Plan title - Center */}
        <Pressable
          style={styles.topNavCenter}
          onPress={() => setShowPlan(true)}
        >
          <List color={textColor} size={20} />
          <Text style={styles.topNavText}>תוכנית אימון</Text>
        </Pressable>
        
        {/* Home button - Right */}
        <Pressable
          style={styles.topNavButton}
          onPress={() => router.replace('/')}
        >
          <Home color={textColor} size={20} />
        </Pressable>
      </View>
      {showPlan ? (
        <View style={styles.planContainer}>
          <Text style={styles.planTitle}>תוכנית האימון</Text>
          {workout.exercises.map((exercise: any, index: number) => ( // Added types for exercise and index
            <Pressable 
              key={exercise.id}
              style={[
                styles.planExercise,
                currentExerciseIndex === index && styles.planExerciseActive
              ]}
              onPress={() => {
                if (isActive || isPaused) {
                  reset(false); // Stop timer and set to idle work mode
                }
                setCurrentExerciseIndex(index);
                setCurrentSet(1);
                setSupersetPhase('first');
                // The useEffect for idle timer reset will handle setting correct duration
                setShowPlan(false);
              }}
            >
              <Text style={styles.planExerciseName}>{exercise.name}</Text>
              <Text style={styles.planExerciseSets}>{exercise.sets} סטים</Text>
            </Pressable>
          ))}
          <Pressable 
            style={styles.closePlanButton}
            onPress={() => setShowPlan(false)}
          >
            <Text style={styles.closePlanButtonText}>סגור</Text>
          </Pressable>
        </View>
      ) : (
        <GestureDetector gesture={swipeGesture}>
          <Reanimated.View style={[styles.workoutContainer, animatedStyle]}>
            {/* Top stats section */}
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>זמן שעבר</Text>
                <Text style={styles.statValue}>{formatLongerTime(elapsedTime)}</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>סטים</Text>
                <Text style={styles.statValue}>{currentSet}/{totalSets}</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>זמן שנותר</Text>
                <Text style={styles.statValue}>{formatLongerTime(timeLeft)}</Text>
              </View>
            </View>
            {/* Next up section */}
            <View style={styles.nextUpContainer}>            
              <Text style={styles.currentExerciseName}>
                {currentExercise.isSuperset && supersetPhase === 'second' && currentExercise.supersetExercise 
                  ? currentExercise.supersetExercise.name 
                  : currentExercise.name}
                {currentExercise.isSuperset && !isResting && (
                  <Text style={{ fontSize: 18, color: '#888' }}>
                    {` (${supersetPhase === 'first' ? '1' : '2'}/2)`}
                  </Text>
                )}
              </Text>

              {/* Superset indicator */}
              {currentExercise.isSuperset && (
                <View style={styles.supersetIndicator}>
                  <Text style={styles.supersetText}>סופרסט</Text>
                  <View style={styles.supersetProgress}>
                    <View style={[styles.supersetDot, supersetPhase === 'first' && !isResting && styles.supersetDotActive]} />
                    <View style={[styles.supersetDot, supersetPhase === 'second' && !isResting && styles.supersetDotActive]} />
                  </View>
                </View>
              )}

              <Text style={styles.nextUpLabel}>הבא</Text>
              <Text style={isResting ? styles.nextExerciseName : styles.nextRestName}>
                {isResting ?
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
              </Text>
            </View>

            {/* Exercise visualization and timer */}
            <View style={[styles.timerContainer, { marginBottom: 140 }]}>
              <View style={styles.exerciseImageContainer}>
                <CircularProgressDisplay 
                  progress={progress}
                  size={200} 
                  strokeWidth={8}
                  color={isResting ? '#7AB555' : '#00AAFF'}
                />
                <View style={styles.exerciseIconContainer}>
                  {isResting ? (
                    <Text style={styles.exerciseIcon}>🥤</Text>
                  ) : (
                    <Text style={styles.exerciseIcon}>💪</Text>
                  )}
                </View>
              </View>
              
              {/* Exercise name and timer */}
              <View style={styles.timerInfoContainer}>
                <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timerMode}>
                  {isResting ? 'מנוחה' : 'עבודה'}
                </Text>
              </View>
            </View>
          </Reanimated.View>
        </GestureDetector>
      )}
      
      {/* Fixed Footer Controls - Positioned absolutely at bottom */}
      {!showPlan && (
        <View style={[styles.footerControls, { paddingBottom: insets.bottom + 20 }]}>
          {/* Secondary controls row - Exercise navigation */}
          <View style={styles.secondaryControlsContainer}>

            {/* Previous Set/Phase - Left */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonTertiary]} 
              onPress={handlePreviousSet}
            >
              <ChevronLeft color="#FFFFFF" size={14} />
            </Pressable>
            
            {/* Next Set/Phase - Right */}
            <Pressable style={[styles.footerButton, styles.footerButtonTertiary]} onPress={handleNextSet}>
              <ChevronRight color="#FFFFFF" size={14} />
            </Pressable>
          </View>

          {/* Main control buttons row - Primary media controls */}
          <View style={styles.mainControlsContainer}>

            {/* Previous Exercise - Left */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonSecondary, currentExerciseIndex === 0 && styles.footerButtonDisabled]} 
              onPress={handlePreviousExercise}
              disabled={currentExerciseIndex === 0}
            >
              <ChevronsLeft color={currentExerciseIndex === 0 ? '#777' : '#FFFFFF'} size={16} />
            </Pressable>
            
            {/* Play/Pause - Center (Primary button) */}
            <Pressable style={[styles.footerButton, styles.footerButtonPrimary]} onPress={handlePlayPause}>
              {isActive ? (
                <Pause color="#FFFFFF" size={20} />
              ) : (
                <Play color="#FFFFFF" size={20} />
              )}
            </Pressable>
            
            {/* Next Exercise - Right */}
            <Pressable 
              style={[styles.footerButton, styles.footerButtonSecondary, currentExerciseIndex >= (workout?.exercises.length || 0) - 1 && styles.footerButtonDisabled]} 
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
                style={[styles.footerButton, styles.nextWorkoutFooterButton]}
                onPress={handleNextWorkout}
              >
                <SkipForward color="#FFFFFF" size={16} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  workoutContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextUpContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  currentExerciseName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  nextUpLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  nextExerciseName: {
    color: '#00AAFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextRestName: {
    color: '#7AB555',
    fontSize: 18,
    fontWeight: 'bold',
  },
  supersetIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
  },
  supersetText: {
    color: '#00AAFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  supersetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supersetDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#555',
    marginHorizontal: 2,
  },
  supersetDotActive: {
    backgroundColor: '#00AAFF',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerInfoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  timerMode: {
    color: '#888',
    fontSize: 20,
    marginTop: 8,
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
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseIcon: {
    fontSize: 40,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonMain: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#444',
  },
  controlButtonSmall: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  controlButtonDisabled: {
    backgroundColor: '#222',
    opacity: 0.5,
  },
  controlsSection: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  controlLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  controlLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
  controlLabelDisabled: {
    opacity: 0.5,
  },
  // New footer controls
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
    gap: 10,
  },
  secondaryControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '60%',
    alignSelf: 'center',
    marginBottom: 20,
    paddingHorizontal: 1,
  },
  nextWorkoutContainer: {
    alignItems: 'center',
    width: '100%',
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  footerButtonPrimary: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    borderWidth: 4,
    borderColor: '#0056CC',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  footerButtonTertiary: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#666666',
    borderWidth: 3,
    borderColor: '#888888',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  footerButtonSecondary: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#777777',
    borderWidth: 3,
    borderColor: '#999999',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  footerButtonDisabled: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextWorkoutFooterButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#0000',
    borderWidth: 4,
    borderColor: '#248A3D',
    alignSelf: 'auto',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 10,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    padding: 12,
    marginTop: 40,
  },
  planButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  nextWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00AAFF',
    borderRadius: 20,
    padding: 12,
    marginTop: 16,
  },
  nextWorkoutButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planContainer: {
    flex: 1,
    padding: 20,
  },
  planTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  planExercise: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planExerciseActive: {
    backgroundColor: '#1F7D53',
  },
  planExerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planExerciseSets: {
    color: '#888',
    fontSize: 16,
  },
  closePlanButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closePlanButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#00AAFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  topNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
  },
  topNavText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});