import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CircularTimer } from '@/components/CircularTimer';
import { useTimer } from '@/hooks/useTimer';
import { ChevronRight, ChevronLeft, List } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

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
  
  const currentExercise = workout?.exercises[currentExerciseIndex];
  const totalSets = currentExercise?.sets || 1;
  
  const { 
    timeLeft, 
    isActive, 
    isResting, 
    start, 
    pause, 
    reset 
  } = useTimer({
    workTime: currentExercise?.workTime || 45,
    restTime: currentExercise?.restTime || 30,
    onComplete: handleTimerComplete,
  });

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
        reset();
        start();
      } else if (currentSet < totalSets) {
        // Move to next set
        setCurrentSet(prev => prev + 1);
        reset();
        start();
      } else {
        // Move to next exercise
        handleNext();
      }
    } else {
      // Work period completed, check if this is a superset
      if (currentExercise?.isSuperset && !isSuperset) {
        setIsSuperset(true);
        reset();
        start();
      } else {
        // Start rest period
        reset();
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
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setIsSuperset(false);
      reset();
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>טוען אימון...</Text>
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>חזור</Text>
        </Pressable>
      </View>
    );
  }

  if (!workout || !currentExercise) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>האימון לא נמצא</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>חזור</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
          <Animated.View style={[styles.timerContainer, animatedStyle]}>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>
                {currentExercise.name}
                {isSuperset && currentExercise.supersetExercise && ` + ${currentExercise.supersetExercise.name}`}
              </Text>
              <Text style={styles.setInfo}>
                סט {currentSet}/{totalSets}
              </Text>
            </View>
            
            <CircularTimer 
              timeLeft={timeLeft}
              totalTime={isResting ? currentExercise.restTime : currentExercise.workTime}
              isActive={isActive}
              isResting={isResting}
              onPress={() => isActive ? pause() : start()}
            />
            
            <View style={styles.controls}>
              <Pressable 
                style={styles.controlButton}
                onPress={handlePrevious}
                disabled={currentExerciseIndex === 0}
              >
                <ChevronRight size={24} color={currentExerciseIndex === 0 ? '#333' : '#00FF7F'} />
                <Text style={[
                  styles.controlButtonText,
                  currentExerciseIndex === 0 && styles.controlButtonTextDisabled
                ]}>הקודם</Text>
              </Pressable>
              
              <Pressable 
                style={styles.controlButton}
                onPress={handleNext}
              >
                <Text style={styles.controlButtonText}>הבא</Text>
                <ChevronLeft size={24} color="#00FF7F" />
              </Pressable>
            </View>
          </Animated.View>
        </GestureDetector>
      )}
      
      <Pressable 
        style={styles.planButton}
        onPress={() => setShowPlan(!showPlan)}
      >
        <List size={24} color="#00FF7F" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  exerciseInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  setInfo: {
    color: '#666',
    fontSize: 18,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 40,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  controlButtonText: {
    color: '#00FF7F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controlButtonTextDisabled: {
    color: '#333',
  },
  planButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#111',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#222',
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
    backgroundColor: '#111',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  planExerciseActive: {
    borderColor: '#00FF7F',
  },
  planExerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  planExerciseSets: {
    color: '#666',
    fontSize: 14,
  },
  closePlanButton: {
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#222',
  },
  closePlanButtonText: {
    color: '#00FF7F',
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
    backgroundColor: '#111',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  backButtonText: {
    color: '#00FF7F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#00FF7F',
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
});