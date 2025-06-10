import { useState } from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Image, Switch } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Plus, Clock, Dumbbell, X, Camera, File, Upload } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as DocumentPicker from 'expo-document-picker';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AddPlanScreen() {
  const insets = useSafeAreaInsets();
  const addWorkout = useWorkoutStore(state => state.addWorkout);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('3 פעמים בשבוע');
  const [duration, setDuration] = useState('45 דק\'');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  
  // Exercise state variables
  const [exercises, setExercises] = useState<Array<{
    id: string, 
    name: string, 
    sets: number, 
    workTime: number, 
    restTime: number,
    isSuperset: boolean,
    supersetExercise?: {
      name: string,
      workTime: number
    }
  }>>([]);
  
  // Form state variables
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [setsCount, setSetsCount] = useState('3');
  const [workTime, setWorkTime] = useState('45');
  const [restTime, setRestTime] = useState('30');
  const [isSuperset, setIsSuperset] = useState(false);
  const [supersetName, setSupersetName] = useState('');
  const [supersetWorkTime, setSupersetWorkTime] = useState('45');

  // Calculate total workout time
  const calculateTotalWorkoutTime = () => {
    if (exercises.length === 0) return 0;
    
    let totalSeconds = 0;
    
    for (const exercise of exercises) {
      // Time for regular sets
      totalSeconds += exercise.sets * exercise.workTime; // Work time
      totalSeconds += (exercise.sets - 1) * exercise.restTime; // Rest between sets
      
      // If it's a superset, add the second exercise time
      if (exercise.isSuperset && exercise.supersetExercise) {
        totalSeconds += exercise.sets * exercise.supersetExercise.workTime;
      }
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes} דק'`;
  };
  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const inputBackgroundColor = '#1A1A1A';
  const secondaryTextColor = '#888';
  const placeholderColor = '#666';
  const borderColor = 'rgba(255,255,255,0.1)';

  // Function to handle PDF upload
  const handleUploadPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        setPdfUrl(result.uri);
        // After uploading PDF, still allow manual exercise input
        setShowManualForm(true);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const addExercise = () => {
    if (exerciseName.trim() === '') return;
    
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: exerciseName,
        sets: parseInt(setsCount) || 3,
        workTime: parseInt(workTime) || 45,
        restTime: parseInt(restTime) || 30,
        isSuperset: isSuperset,
        ...(isSuperset && supersetName ? {
          supersetExercise: {
            name: supersetName,
            workTime: parseInt(supersetWorkTime) || 45
          }
        } : {})
      }
    ]);
    
    // Reset form fields
    setExerciseName('');
    setSetsCount('3');
    setWorkTime('45');
    setRestTime('30');
    setIsSuperset(false);
    setSupersetName('');
    setSupersetWorkTime('45');
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
        exercises: exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: ex.sets,
          workTime: ex.workTime,
          restTime: ex.restTime,
          isSuperset: ex.isSuperset,
          ...(ex.isSuperset && ex.supersetExercise ? { supersetExercise: ex.supersetExercise } : {})
        })),
        createdAt: new Date().toISOString(),
        imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2500',
        ...(pdfUrl ? { pdfUrl } : {})
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
      
      {/* Plan creation options */}
      <Animated.View 
        entering={FadeInDown.delay(100).duration(500)} 
        style={styles.planOptionsContainer}
      >
        <Pressable 
          style={[styles.optionButton, { backgroundColor: inputBackgroundColor }]}
          onPress={() => setShowManualForm(true)}
        >
          <Dumbbell size={30} color={tintColor} />
          <Text style={[styles.optionButtonText, { color: textColor }]}>יצירה ידנית</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.optionButton, { backgroundColor: inputBackgroundColor }]}
          onPress={handleUploadPdf}
        >
          <File size={30} color={tintColor} />
          <Text style={[styles.optionButtonText, { color: textColor }]}>העלאת PDF</Text>
        </Pressable>
      </Animated.View>
      
      {pdfUrl && (
        <Animated.View 
          entering={FadeInDown.delay(150).duration(500)}
          style={[styles.pdfPreview, { backgroundColor: inputBackgroundColor }]}
        >
          <File size={24} color={tintColor} />
          <Text style={[styles.pdfFilename, { color: textColor }]}>PDF הועלה בהצלחה</Text>
        </Animated.View>
      )}
      
      <Animated.View 
        entering={FadeInDown.delay(150).duration(500)} 
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
            value={calculateTotalWorkoutTime()}
            editable={false}
          />
        </View>
      </Animated.View>
        {/* Exercises section */}
      {showManualForm && (
        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>תרגילים</Text>
          
          {exercises.map((exercise, index) => (
            <AnimatedPressable 
              key={exercise.id}
              entering={FadeInDown.delay(index * 100).duration(400)}
              style={[styles.exerciseItem, { backgroundColor: inputBackgroundColor, borderColor }]}
            >
              <View style={styles.exerciseInfo}>
                <Text style={[styles.exerciseName, { color: textColor }]}>
                  {exercise.name}
                  {exercise.isSuperset && exercise.supersetExercise && 
                    ` + ${exercise.supersetExercise.name} (סופרסט)`}
                </Text>
                <Text style={[styles.exerciseDetail, { color: secondaryTextColor }]}>
                  {exercise.sets} סטים × {exercise.workTime} שניות עבודה × {exercise.restTime} שניות מנוחה
                </Text>
                {exercise.isSuperset && exercise.supersetExercise && (
                  <Text style={[styles.exerciseDetail, { color: secondaryTextColor }]}>
                    סופרסט: {exercise.supersetExercise.workTime} שניות
                  </Text>
                )}
              </View>
              
              <Pressable 
                onPress={() => removeExercise(exercise.id)}
                style={styles.removeButton}
              >
                <X size={20} color="#FF4D4D" />
              </Pressable>
            </AnimatedPressable>
          ))}
          
          {/* Add exercise form */}
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
                <Text style={[styles.inputLabel, { color: textColor }]}>זמן עבודה (שניות)</Text>
                <TextInput
                  style={[styles.smallInput, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                  placeholderTextColor={placeholderColor}
                  placeholder="45"
                  value={workTime}
                  onChangeText={setWorkTime}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.exerciseMetrics}>
              <View style={styles.metricInput}>
                <Text style={[styles.inputLabel, { color: textColor }]}>זמן מנוחה (שניות)</Text>
                <TextInput
                  style={[styles.smallInput, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                  placeholderTextColor={placeholderColor}
                  placeholder="30"
                  value={restTime}
                  onChangeText={setRestTime}
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.metricInput}>
                <View style={styles.supersetToggle}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>סופרסט</Text>
                  <Switch
                    value={isSuperset}
                    onValueChange={setIsSuperset}
                    trackColor={{ false: '#333', true: tintColor }}
                    thumbColor={isSuperset ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>
            </View>
            
            {isSuperset && (
              <>
                <View style={styles.supersetDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={[styles.supersetLabel, { color: textColor }]}>מידע סופרסט</Text>
                  <View style={styles.dividerLine} />
                </View>
                
                <View style={styles.exerciseNameInput}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>שם תרגיל סופרסט</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                    placeholderTextColor={placeholderColor}
                    placeholder="לדוגמא: כפיפות בטן"
                    value={supersetName}
                    onChangeText={setSupersetName}
                  />
                </View>
                
                <View style={styles.exerciseMetrics}>
                  <View style={styles.metricInput}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>זמן עבודה סופרסט (שניות)</Text>
                    <TextInput
                      style={[styles.smallInput, { backgroundColor: 'rgba(0,0,0,0.2)', color: textColor, borderColor }]}
                      placeholderTextColor={placeholderColor}
                      placeholder="45"
                      value={supersetWorkTime}
                      onChangeText={setSupersetWorkTime}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </>
            )}
            
            <Pressable 
              style={[styles.addExerciseButton, { backgroundColor: tintColor }]}
              onPress={addExercise}
            >
              <Plus size={20} color="#FFF" />
              <Text style={styles.addExerciseButtonText}>הוסף תרגיל</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
        <Animated.View 
        entering={FadeInUp.delay(200).duration(500)}
        style={styles.createButtonContainer}
      >
        <Pressable 
          style={[
            styles.createButton, 
            { 
              backgroundColor: tintColor,
              opacity: (title.trim() === '' || (!pdfUrl && exercises.length === 0)) ? 0.6 : 1 
            }
          ]}
          onPress={handleCreatePlan}
          disabled={title.trim() === '' || (!pdfUrl && exercises.length === 0) || isLoading}
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
  planOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    width: '48%',
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  pdfFilename: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
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
  supersetToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  supersetDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  supersetLabel: {
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
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