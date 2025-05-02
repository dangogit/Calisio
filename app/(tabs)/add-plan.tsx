import { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Plus, Clock, Dumbbell, X, Camera } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AddPlanScreen() {
  const insets = useSafeAreaInsets();
  const addWorkout = useWorkoutStore(state => state.addWorkout);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('3 פעמים בשבוע');
  const [duration, setDuration] = useState('45 דק\'');
  const [exercises, setExercises] = useState<Array<{id: string, name: string, sets: number, reps: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [setsCount, setSetsCount] = useState('3');
  const [repsCount, setRepsCount] = useState('12');

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const inputBackgroundColor = '#1A1A1A';
  const secondaryTextColor = '#888';
  const placeholderColor = '#666';
  const borderColor = 'rgba(255,255,255,0.1)';

  const addExercise = () => {
    if (exerciseName.trim() === '') return;
    
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: exerciseName,
        sets: parseInt(setsCount) || 3,
        reps: parseInt(repsCount) || 12
      }
    ]);
    
    setExerciseName('');
    setSetsCount('3');
    setRepsCount('12');
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const handleCreatePlan = async () => {
    if (title.trim() === '' || exercises.length === 0) return;
    
    setIsLoading(true);
    
    try {
      // Create a new workout in the store
      addWorkout({
        id: Date.now().toString(),
        title,
        description,
        exercises: exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          workTime: 45,
          restTime: 30,
          isSuperset: false
        })),
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2500'
      });
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to the plans list
      router.replace('/');
    } catch (err) {
      console.error('Failed to create plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor }]} 
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text 
        entering={FadeInDown.duration(500)} 
        style={[styles.headerTitle, { color: textColor, marginTop: insets.top }]}
      >
        יצירת תוכנית אימון חדשה
      </Animated.Text>
      
      <Animated.View 
        entering={FadeInDown.delay(100).duration(500)} 
        style={styles.imageUploadContainer}
      >
        <Pressable style={styles.uploadImageButton}>
          <Camera size={30} color={tintColor} />
          <Text style={[styles.uploadImageText, { color: textColor }]}>הוסף תמונה</Text>
        </Pressable>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={[styles.inputLabel, { color: textColor }]}>שם התוכנית</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: inputBackgroundColor, 
              color: textColor,
              borderColor
            }
          ]}
          placeholderTextColor={placeholderColor}
          placeholder="לדוגמא: אימון כח אפר בודי"
          value={title}
          onChangeText={setTitle}
        />
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={[styles.inputLabel, { color: textColor }]}>תיאור</Text>
        <TextInput
          style={[
            styles.textArea, 
            { 
              backgroundColor: inputBackgroundColor, 
              color: textColor,
              borderColor
            }
          ]}
          placeholderTextColor={placeholderColor}
          placeholder="תיאור קצר של התוכנית"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Animated.View>
      
      <Animated.View 
        entering={FadeInDown.delay(400).duration(500)}
        style={styles.rowInputs}
      >
        <View style={styles.inputHalf}>
          <Text style={[styles.inputLabel, { color: textColor }]}>תדירות</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: inputBackgroundColor, 
                color: textColor,
                borderColor
              }
            ]}
            placeholderTextColor={placeholderColor}
            placeholder="3 פעמים בשבוע"
            value={frequency}
            onChangeText={setFrequency}
          />
        </View>
        
        <View style={styles.inputHalf}>
          <Text style={[styles.inputLabel, { color: textColor }]}>זמן אימון</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                backgroundColor: inputBackgroundColor, 
                color: textColor,
                borderColor
              }
            ]}
            placeholderTextColor={placeholderColor}
            placeholder="45 דק'"
            value={duration}
            onChangeText={setDuration}
          />
        </View>
      </Animated.View>
      
      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>תרגילים</Text>
        
        {exercises.map((exercise, index) => (
          <AnimatedPressable 
            key={exercise.id}
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={[styles.exerciseItem, { backgroundColor: inputBackgroundColor, borderColor }]}
          >
            <View style={styles.exerciseInfo}>
              <Text style={[styles.exerciseName, { color: textColor }]}>{exercise.name}</Text>
              <Text style={[styles.exerciseDetail, { color: secondaryTextColor }]}>
                {exercise.sets} סטים × {exercise.reps} חזרות
              </Text>
            </View>
            
            <Pressable 
              onPress={() => removeExercise(exercise.id)}
              style={styles.removeButton}
            >
              <X size={20} color="#FF4D4D" />
            </Pressable>
          </AnimatedPressable>
        ))}
        
        <Animated.View 
          entering={FadeInUp.duration(500)}
          style={[styles.addExerciseForm, { backgroundColor: inputBackgroundColor, borderColor }]}
        >
          <View style={styles.exerciseNameInput}>
            <Text style={[styles.inputLabel, { color: textColor }]}>שם התרגיל</Text>
            <TextInput
              style={[styles.input, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
              placeholderTextColor={placeholderColor}
              placeholder="לדוגמא: מתח עליון"
              value={exerciseName}
              onChangeText={setExerciseName}
            />
          </View>
          
          <View style={styles.exerciseMetrics}>
            <View style={styles.metricInput}>
              <Text style={[styles.inputLabel, { color: textColor }]}>סטים</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                placeholderTextColor={placeholderColor}
                placeholder="3"
                value={setsCount}
                onChangeText={setSetsCount}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.metricInput}>
              <Text style={[styles.inputLabel, { color: textColor }]}>חזרות</Text>
              <TextInput
                style={[styles.smallInput, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                placeholderTextColor={placeholderColor}
                placeholder="12"
                value={repsCount}
                onChangeText={setRepsCount}
                keyboardType="number-pad"
              />
            </View>
          </View>
          
          <Pressable 
            style={[styles.addExerciseButton, { backgroundColor: tintColor }]}
            onPress={addExercise}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.addExerciseButtonText}>הוסף תרגיל</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
      
      <Animated.View 
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.createButtonContainer}
      >
        <Pressable 
          style={[
            styles.createButton, 
            { 
              backgroundColor: tintColor,
              opacity: (title.trim() === '' || exercises.length === 0) ? 0.6 : 1 
            }
          ]}
          onPress={handleCreatePlan}
          disabled={title.trim() === '' || exercises.length === 0 || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.createButtonText}>צור תוכנית</Text>
          )}
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageText: {
    marginTop: 8,
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 100,
    textAlign: 'right',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputHalf: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'right',
  },
  exerciseItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  exerciseDetail: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExerciseForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  exerciseNameInput: {
    marginBottom: 12,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricInput: {
    width: '48%',
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 12,
  },
  addExerciseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  createButtonContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
  createButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
}); 