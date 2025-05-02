import { View, Text, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircularTimer } from '@/components/CircularTimer';
import { useTimer } from '@/hooks/useTimer';
import { ChevronRight, ChevronLeft, List, Play, Pause, SkipForward, Home } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function WorkoutTimer() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const workout = useWorkoutStore(state => state.workouts.find(w => w.id === id));
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isSuperset, setIsSuperset] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // Track total elapsed time
  
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const nextExercise = workout?.exercises[currentExerciseIndex + 1];
  const totalSets = currentExercise?.sets || 1;
  const backgroundColor = "#121212"; // Use a dark background
  const tintColor = "#1F7D53";
  const textColor = "#fff";
  const accentColor = "#00AAFF"; // Blue color for accents
  const restColor = "#7AB555"; // Green color for rest periods
  
  const { 
    timeLeft, 
    isActive, 
    isResting, 
    start, 
    pause, 
    reset,
    toggleMode 
  } = useTimer({
    workTime: currentExercise?.workTime || 45,
    restTime: currentExercise?.restTime || 30,
    onComplete: handleTimerComplete,
  });

  useEffect(() => {
    // Increment elapsed time counter when timer is active
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
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
      // After rest, move to next set or exercise
      if (isSuperset) {
        // If we were in the first part of a superset, move to the second part
        setIsSuperset(false);
        toggleMode();
        start();
      } else if (currentSet < totalSets) {
        // Move to next set
        setCurrentSet(prev => prev + 1);
        toggleMode();
        start();
      } else {
        // Move to next exercise
        handleNext();
      }
    } else {
      // Work period completed, check if this is a superset
      if (currentExercise?.isSuperset && !isSuperset) {
        setIsSuperset(true);
        toggleMode();
        start();
      } else {
        // Start rest period
        toggleMode();
        start();
      }
    }
  }

  function handleNext() {
    if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setIsSuperset(false);
      reset();
    } else {
      // End of workout
      router.replace('/');
    }
  }

  function handlePrevious() {
    // First check if we can go to previous set
    if (currentSet > 1) {
      console.log('Going to previous set:', currentSet - 1);
      setCurrentSet(currentSet - 1);
      reset();
    } else if (currentExerciseIndex > 0) {
      // Go to previous exercise, last set
      const prevExerciseIndex = currentExerciseIndex - 1;
      const prevExercise = workout?.exercises[prevExerciseIndex];
      const prevExerciseSets = prevExercise?.sets || 1;
      
      console.log('Going to previous exercise:', prevExerciseIndex, 'set:', prevExerciseSets);
      setCurrentExerciseIndex(prevExerciseIndex);
      setCurrentSet(prevExerciseSets);
      setIsSuperset(false);
      reset();
    }
  }

  function handleNextSet() {
    if (isResting) {
      // If currently in rest period, go to next set
      if (currentSet < totalSets) {
        console.log('Going to next set:', currentSet + 1);
        setCurrentSet(currentSet + 1);
        reset();
        start();
      } else if (currentExerciseIndex < (workout?.exercises.length || 0) - 1) {
        // Go to next exercise, first set
        console.log('Going to next exercise:', currentExerciseIndex + 1);
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setIsSuperset(false);
        reset();
        start();
      }
    } else {
      // If currently in work period, toggle to rest period
      console.log('Starting rest period');
      toggleMode();
      start();
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
      {showPlan ? (
        <View style={styles.planContainer}>
          <Text style={styles.planTitle}>תוכנית האימון</Text>
          {workout.exercises.map((exercise, index) => (
            <Pressable 
              key={exercise.id}
              style={[
                styles.planExercise,
                currentExerciseIndex === index && styles.planExerciseActive
              ]}
              onPress={() => {
                setCurrentExerciseIndex(index);
                setCurrentSet(1);
                setIsSuperset(false);
                reset();
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
          <Animated.View style={[styles.workoutContainer, animatedStyle]}>
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
              <Text style={styles.nextUpLabel}>סט הבא</Text>
              <Text style={isResting ? styles.nextExerciseName : styles.nextRestName}>
                {isResting ? (currentSet < totalSets ? currentExercise.name : (nextExercise?.name || "סיום")) : "מנוחה"}
              </Text>
              <Text style={styles.currentExerciseName}>
                {currentExercise.name}
                {isSuperset && currentExercise.supersetExercise && ` + ${currentExercise.supersetExercise.name}`}
              </Text>
            </View>

            {/* Exercise visualization and timer */}
            <View style={styles.timerContainer}>
              {/* Simple exercise image/icon placeholder */}
              <View style={styles.exerciseImageContainer}>
                <View style={styles.progressArc} />
                {isResting ? (
                  <Text style={styles.exerciseIcon}>🥤</Text>
                ) : (
                  <Text style={styles.exerciseIcon}>💪</Text>
                )}
              </View>
              
              {/* Exercise name and timer */}
              <Text style={styles.exerciseNameLarge}>{currentExercise.name}</Text>
              <Text style={styles.timerValue}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            {/* Bottom controls */}
            <View style={styles.controlsContainer}>
              
            <Pressable 
                style={styles.iconButton} 
                onPress={() => router.back()}
              >
                <Home size={24} color="#fff" fill="#fff"/>
              </Pressable>
              <Pressable 
                style={styles.iconButton} 
                onPress={handleNextSet}
                disabled={currentExerciseIndex === (workout?.exercises.length || 0) - 1 && currentSet === totalSets}
              >
                <ChevronLeft size={24} color={currentExerciseIndex === (workout?.exercises.length || 0) - 1 && currentSet === totalSets ? "#555" : "#fff"} />
              </Pressable>

              <Pressable 
                style={styles.playButton} 
                onPress={() => isActive ? pause() : start()}
              >
                {isActive ? (
                  <Pause size={40} color="#fff" />
                ) : (
                  <Play size={40} color="#fff" fill="#fff" />
                )}
              </Pressable>
              
              <Pressable 
                style={styles.iconButton} 
                onPress={handlePrevious}
                disabled={currentExerciseIndex === 0 && currentSet === 1}
              >
                <ChevronRight size={24} color={currentExerciseIndex === 0 && currentSet === 1 ? "#555" : "#fff"} />
              </Pressable>
    
              <Pressable 
                style={styles.iconButton} 
                onPress={() => setShowPlan(true)}
              >
                <List size={24} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
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
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextUpContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  nextUpLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 8,
  },
  nextRestName: {
    color: '#7AB555', // Green for rest
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nextExerciseName: {
    color: '#00AAFF', // Blue for exercise
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  currentExerciseName: {
    color: '#00AAFF', // Blue for current exercise
    fontSize: 22,
    fontWeight: 'bold',
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  exerciseImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  progressArc: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#00AAFF',
    transform: [{ rotate: '-90deg' }],
  },
  exerciseIcon: {
    fontSize: 60,
  },
  exerciseImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  exerciseNameLarge: {
    color: '#00AAFF',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerValue: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7AB555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planContainer: {
    flex: 1,
    padding: 16,
  },
  planTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  planExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 12,
  },
  planExerciseActive: {
    borderColor: '#00AAFF',
    borderWidth: 1,
  },
  planExerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planExerciseSets: {
    color: '#aaa',
    fontSize: 14,
  },
  closePlanButton: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  closePlanButtonText: {
    color: '#00AAFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    color: '#00AAFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#7AB555',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  nextIcon: {
    fontSize: 24,
  },
});