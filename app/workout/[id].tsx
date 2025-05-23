import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircularTimer } from '@/components/CircularTimer';
import { useTimer } from '@/hooks/useTimer';
import { ChevronRight, ChevronLeft, List, Play, Pause, SkipForward, Home, Pencil } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, interpolate, useAnimatedProps } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const [timerAction, setTimerAction] = useState<'start_work' | 'start_rest' | null>(null); // New state for sequencing timer actions
  
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

  const {
    timeLeft,
    isActive,
    isResting,
    isPaused,
    start,
    pause,
    reset,
    toggleMode
  } = useTimer({
    workTime,
    restTime,
    onComplete: handleTimerComplete,
  });

  // Add effect to update timer when exercise context changes and timer is idle
  useEffect(() => {
    // Reset the timer with the right duration when superset status changes or context changes
    if (!isActive && !isPaused) {
      reset(false); // Explicitly reset to work mode
    }
  }, [currentExercise?.id, currentSet, supersetPhase, workTime, restTime, isActive, isPaused, reset]); // Added more explicit dependencies

  // New useEffect to handle timer actions after state updates
  useEffect(() => {
    if (timerAction === 'start_work') {
      // Ensure the latest changes to workTime have been applied before resetting
      setTimeout(() => {
        reset(false); // Reset to work mode with fresh workTime value
        start();
        setTimerAction(null);
      }, 0);
    } else if (timerAction === 'start_rest') {
      // Ensure the latest changes to restTime have been applied before resetting
      setTimeout(() => {
        reset(true); // Reset to rest mode with fresh restTime value
        start();
        setTimerAction(null);
      }, 0);
    }
  }, [timerAction, workTime, restTime, reset, start]);

  // Handle play/pause toggle
  const handlePlayPause = () => {
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
        // Swiped right - go to previous
        handlePrevious();
      } else if (e.translationX < -100) {
        // Swiped left - go to next
        handleNext();
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

  function handleTimerComplete() {
    if (isResting) {
      // Rest period completed
      handleMoveToNext(); // This will set state and then timerAction
    } else {
      // Work period completed
      if (currentExercise?.isSuperset && supersetPhase === 'first') {
        // First exercise in superset completed, move to the second exercise
        setSupersetPhase('second');
        setTimerAction('start_work'); // Signal to start work for superset part 2
      } else {
        // Regular exercise completed OR second exercise in superset completed
        setTimerAction('start_rest'); // Signal to start rest
      }
    }
  }

  function handleMoveToNext() { // Called after rest, or when skipping rest to next work
    if (currentSet < totalSets) {
      // Move to next set
      setCurrentSet((prev: number) => prev + 1); // Added type for prev
      setSupersetPhase('first');
      setTimerAction('start_work');
    } else {
      // Move to next exercise
      if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        setCurrentExerciseIndex((prev: number) => prev + 1); // Added type for prev
        setCurrentSet(1);
        setSupersetPhase('first');
        setTimerAction('start_work');
      } else {
        // End of workout
        router.replace('/');
      }
    }
  }

  function handleNext() { // Manual navigation to next exercise
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      if (isActive || isPaused) {
        reset(false); // Stop timer and set to idle work mode for current context
      }
      setCurrentExerciseIndex((prev: number) => prev + 1); // Added type for prev
      setCurrentSet(1);
      setSupersetPhase('first');
      // The useEffect for idle timer reset will handle setting correct duration for new context
    } else {
      // End of workout
      router.replace('/');
    }
  }

  function handlePrevious() { // Manual navigation to previous exercise/set
    if (isActive || isPaused) {
      reset(false); // Stop timer and set to idle work mode for current context
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
    // The useEffect for idle timer reset will handle setting correct duration for new context
  }

  function handleNextSet() { // Skip button
    if (isResting) {
      // If currently in rest period, go to next set or exercise (which starts work)
      handleMoveToNext(); // This will set state and then timerAction
    } else {
      // If currently in work period, skip current work and go to rest.
      // Make sure we're using the correct restTime for the current exercise
      setTimerAction('start_rest');
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
      {/* Edit button in top right */}
      <Pressable
        style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 10, backgroundColor: '#222', borderRadius: 24, padding: 10 }}
        onPress={() => router.push(`/workout/edit/${id}`)}
      >
        <Pencil size={24} color="#00AAFF" />
      </Pressable>
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
                {currentExercise.name}
                {currentExercise.isSuperset && supersetPhase === 'second' && currentExercise.supersetExercise ? ` + ${currentExercise.supersetExercise.name}` : ''}
              </Text>

              <Text style={styles.nextUpLabel}>סט הבא</Text>
              <Text style={isResting ? styles.nextExerciseName : styles.nextRestName}>
                {isResting ?
                  // Currently resting, next is work
                  (currentSet < totalSets ?
                    currentExercise.name : // Next is same exercise, next set
                    (nextExercise?.name || "סיום") // Next is next exercise or end
                  ) :
                  // Currently working, next is...
                  (currentExercise.isSuperset && supersetPhase === 'first' && currentExercise.supersetExercise ?
                    currentExercise.supersetExercise.name : // Next is the 2nd part of the superset
                    "מנוחה" // Next is rest
                  )
                }
              </Text>
            </View>

            {/* Exercise visualization and timer */}
            <View style={styles.timerContainer}>
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
              
              {/* Control buttons */}
              <View style={styles.controlsContainer}>
                <Pressable style={styles.controlButton} onPress={handlePrevious}>
                  <ChevronRight color={textColor} size={36} />
                </Pressable>
                
                <Pressable style={styles.controlButton} onPress={handlePlayPause}>
                  {isActive ? (
                    <Pause color={textColor} size={36} />
                  ) : (
                    <Play color={textColor} size={36} />
                  )}
                </Pressable>
                
                <Pressable style={styles.controlButton} onPress={handleNextSet}>
                  <SkipForward color={textColor} size={36} />
                </Pressable>
              </View>
              
              {/* Bottom plan button */}
              <Pressable 
                style={styles.planButton}
                onPress={() => setShowPlan(true)}
              >
                <List color={textColor} size={24} />
                <Text style={styles.planButtonText}>תוכנית האימון</Text>
              </Pressable>
              
              {/* Home button */}
              <Pressable 
                style={styles.homeButton}
                onPress={() => router.replace('/')}
              >
                <Home color={textColor} size={24} />
              </Pressable>
            </View>
          </Reanimated.View>
        </GestureDetector>
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
    width: '100%',
    marginTop: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
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
});