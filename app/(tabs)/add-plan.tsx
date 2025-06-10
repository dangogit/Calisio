import { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Image, Switch } from 'react-native';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Plus, Clock, Dumbbell, X, Camera, File, Upload } from 'lucide-react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { ThemedButton } from '@/components/ui/ThemedButton';
import { spacing, borderRadius, typography, shadows } from '@/constants/designTokens';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

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

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const inputBackgroundColor = useThemeColor({}, 'inputBackground');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const placeholderColor = useThemeColor({}, 'textPlaceholder');
  const borderColor = useThemeColor({}, 'border');

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

  // Function to handle PDF upload
  const handleUploadPdf = async () => {
    try {
      // Simulate PDF upload for web compatibility
      setPdfUrl('mock-pdf-url');
      setShowManualForm(true);
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
        imageUrl: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=2500',
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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <ThemedText type="title" style={styles.headerTitle}>
            יצירת תוכנית אימון חדשה
          </ThemedText>
        </Animated.View>
        
        {/* Plan creation options */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)} 
          style={styles.planOptionsContainer}
        >
          <Pressable 
            style={[styles.optionButton, { backgroundColor: inputBackgroundColor }, shadows.small]}
            onPress={() => setShowManualForm(true)}
          >
            <Dumbbell size={30} color={tintColor} />
            <ThemedText type="defaultSemiBold" style={styles.optionButtonText}>יצירה ידנית</ThemedText>
          </Pressable>
          
          <Pressable 
            style={[styles.optionButton, { backgroundColor: inputBackgroundColor }, shadows.small]}
            onPress={handleUploadPdf}
          >
            <File size={30} color={tintColor} />
            <ThemedText type="defaultSemiBold" style={styles.optionButtonText}>העלאת PDF</ThemedText>
          </Pressable>
        </Animated.View>
        
        {pdfUrl && (
          <Animated.View 
            entering={FadeInDown.delay(150).duration(500)}
            style={[styles.pdfPreview, { backgroundColor: inputBackgroundColor }]}
          >
            <File size={24} color={tintColor} />
            <ThemedText type="defaultSemiBold" style={styles.pdfFilename}>PDF הועלה בהצלחה</ThemedText>
          </Animated.View>
        )}
        
        <Animated.View 
          entering={FadeInDown.delay(150).duration(500)} 
          style={styles.imageUploadContainer}
        >
          <Pressable style={[styles.uploadImageButton, { backgroundColor: inputBackgroundColor }]}>
            <Camera size={30} color={tintColor} />
            <ThemedText style={styles.uploadImageText}>הוסף תמונה</ThemedText>
          </Pressable>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <ThemedText style={styles.inputLabel}>שם התוכנית</ThemedText>
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
          <ThemedText style={styles.inputLabel}>תיאור</ThemedText>
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
            <ThemedText style={styles.inputLabel}>תדירות</ThemedText>
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
            <ThemedText style={styles.inputLabel}>זמן אימון</ThemedText>
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
            <ThemedText type="heading2" style={styles.sectionTitle}>תרגילים</ThemedText>
            
            {exercises.map((exercise, index) => (
              <AnimatedPressable 
                key={exercise.id}
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={[styles.exerciseItem, { backgroundColor: inputBackgroundColor, borderColor }, shadows.small]}
              >
                <View style={styles.exerciseInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.exerciseName}>
                    {exercise.name}
                    {exercise.isSuperset && exercise.supersetExercise && 
                      ` + ${exercise.supersetExercise.name} (סופרסט)`}
                  </ThemedText>
                  <ThemedText color="secondary" style={styles.exerciseDetail}>
                    {exercise.sets} סטים × {exercise.workTime} שניות עבודה × {exercise.restTime} שניות מנוחה
                  </ThemedText>
                  {exercise.isSuperset && exercise.supersetExercise && (
                    <ThemedText color="secondary" style={styles.exerciseDetail}>
                      סופרסט: {exercise.supersetExercise.workTime} שניות
                    </ThemedText>
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
                <ThemedText style={styles.inputLabel}>שם התרגיל</ThemedText>
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
                  <ThemedText style={styles.inputLabel}>סטים</ThemedText>
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
                  <ThemedText style={styles.inputLabel}>זמן עבודה (שניות)</ThemedText>
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
                  <ThemedText style={styles.inputLabel}>זמן מנוחה (שניות)</ThemedText>
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
                    <ThemedText style={styles.inputLabel}>סופרסט</ThemedText>
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
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                    <ThemedText type="defaultSemiBold" style={styles.supersetLabel}>מידע סופרסט</ThemedText>
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                  </View>
                  
                  <View style={styles.exerciseNameInput}>
                    <ThemedText style={styles.inputLabel}>שם תרגיל סופרסט</ThemedText>
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
                      <ThemedText style={styles.inputLabel}>זמן עבודה סופרסט (שניות)</ThemedText>
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
              
              <ThemedButton
                title="הוסף תרגיל"
                onPress={addExercise}
                icon={<Plus size={20} color="#FFF" />}
                iconPosition="right"
                fullWidth
              />
            </Animated.View>
          </Animated.View>
        )}

        <Animated.View 
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.createButtonContainer}
        >
          <ThemedButton
            title="צור תוכנית"
            onPress={handleCreatePlan}
            disabled={title.trim() === '' || (!pdfUrl && exercises.length === 0)}
            loading={isLoading}
            fullWidth
          />
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  headerTitle: {
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  planOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  optionButton: {
    width: '48%',
    height: 100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  pdfFilename: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  uploadImageButton: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadImageText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    marginBottom: spacing.lg,
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
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  exerciseItem: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.fontSize.md,
    textAlign: 'right',
  },
  exerciseDetail: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
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
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  exerciseNameInput: {
    marginBottom: spacing.md,
  },
  exerciseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  metricInput: {
    width: '48%',
  },
  smallInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
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
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  supersetLabel: {
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
  },
  createButtonContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.huge,
  },
});