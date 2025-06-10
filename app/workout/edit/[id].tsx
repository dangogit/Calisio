import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform, Switch } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, Save, Link } from 'lucide-react-native';
import { Exercise } from '@/types/workout';

export default function EditWorkout() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const workout = useWorkoutStore(state => state.workouts.find(w => w.id === id));
  const updateWorkout = useWorkoutStore(state => state.updateWorkout);

  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workout) {
      setTitle(workout.title);
      setExercises(workout.exercises.map(ex => ({ ...ex })));
    }
  }, [workout]);

  const addExercise = () => {
    setExercises([
      ...exercises, 
      { 
        id: Date.now().toString(), 
        name: '', 
        sets: 3, 
        workTime: 45, 
        restTime: 30,
        isSuperset: false
      }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length === 1) {
      if (Platform.OS === 'web') {
        alert('חייב להיות לפחות תרגיל אחד באימון');
      } else {
        Alert.alert('שגיאה', 'חייב להיות לפחות תרגיל אחד באימון');
      }
      return;
    }
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const toggleSuperset = (id: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === id) {
        const isSuperset = !ex.isSuperset;
        return {
          ...ex,
          isSuperset,
          supersetExercise: isSuperset ? {
            name: '',
            workTime: 45
          } : undefined
        };
      }
      return ex;
    }));
  };

  const updateSupersetExercise = (id: string, field: 'name' | 'workTime', value: any) => {
    setExercises(exercises.map(ex => {
      if (ex.id === id && ex.supersetExercise) {
        return {
          ...ex,
          supersetExercise: {
            ...ex.supersetExercise,
            [field]: field === 'workTime' ? (parseInt(value) || 0) : value
          }
        };
      }
      return ex;
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('יש להזין שם לאימון');
      return;
    }
    const invalidExercises = exercises.filter(ex => !ex.name || !ex.name.trim());
    if (invalidExercises.length > 0) {
      setError('יש להזין שם לכל התרגילים');
      return;
    }
    // Check superset exercises
    const invalidSupersets = exercises.filter(ex => 
      ex.isSuperset && (!ex.supersetExercise?.name || !ex.supersetExercise.name.trim())
    );
    if (invalidSupersets.length > 0) {
      setError('יש להזין שם לכל התרגילים בסופרסט');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateWorkout(id as string, {
        title,
        exercises: exercises as Exercise[],
      });
      router.replace('/');
    } catch (err) {
      setError('שגיאת רשת: לא ניתן לשמור את האימון. נסה שוב מאוחר יותר.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}> 
        <Text style={styles.errorText}>האימון לא נמצא</Text>
        <Pressable style={styles.saveButton} onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>חזור</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>שם האימון</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="הזן שם לאימון"
          placeholderTextColor="#666"
        />
        <Text style={styles.sectionTitle}>תרגילים</Text>
        {exercises.map((exercise, index) => (
          <View key={exercise.id} style={styles.exerciseContainer}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseNumber}>תרגיל {index + 1}</Text>
              <View style={styles.headerControls}>
                <View style={styles.supersetToggle}>
                  <Text style={styles.supersetLabel}>סופרסט</Text>
                  <Switch
                    value={exercise.isSuperset || false}
                    onValueChange={() => toggleSuperset(exercise.id!)}
                    trackColor={{ false: '#333', true: '#00FF7F' }}
                    thumbColor={exercise.isSuperset ? '#fff' : '#ccc'}
                  />
                  <Link size={16} color={exercise.isSuperset ? '#00FF7F' : '#666'} style={styles.supersetIcon} />
                </View>
                <Pressable 
                  style={styles.removeButton}
                  onPress={() => removeExercise(exercise.id!)}
                >
                  <Trash2 size={20} color="#ff4d4d" />
                </Pressable>
              </View>
            </View>
            
            <Text style={styles.label}>שם התרגיל הראשון</Text>
            <TextInput
              style={styles.input}
              value={exercise.name}
              onChangeText={(value) => updateExercise(exercise.id!, 'name', value)}
              placeholder="הזן שם לתרגיל"
              placeholderTextColor="#666"
            />
            
            {exercise.isSuperset && (
              <>
                <Text style={[styles.label, styles.supersetLabel]}>שם התרגיל השני (סופרסט)</Text>
                <TextInput
                  style={[styles.input, styles.supersetInput]}
                  value={exercise.supersetExercise?.name || ''}
                  onChangeText={(value) => updateSupersetExercise(exercise.id!, 'name', value)}
                  placeholder="הזן שם לתרגיל השני"
                  placeholderTextColor="#666"
                />
              </>
            )}
            
            <Text style={styles.label}>מספר סטים</Text>
            <TextInput
              style={styles.input}
              value={exercise.sets?.toString()}
              onChangeText={(value) => updateExercise(exercise.id!, 'sets', parseInt(value) || 0)}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor="#666"
            />
            
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>זמן עבודה תרגיל 1 (שניות)</Text>
                <TextInput
                  style={styles.input}
                  value={exercise.workTime?.toString()}
                  onChangeText={(value) => updateExercise(exercise.id!, 'workTime', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="45"
                  placeholderTextColor="#666"
                />
              </View>
              
              {exercise.isSuperset ? (
                <View style={styles.halfInput}>
                  <Text style={[styles.label, styles.supersetLabel]}>זמן עבודה תרגיל 2 (שניות)</Text>
                  <TextInput
                    style={[styles.input, styles.supersetInput]}
                    value={exercise.supersetExercise?.workTime?.toString() || ''}
                    onChangeText={(value) => updateSupersetExercise(exercise.id!, 'workTime', value)}
                    keyboardType="numeric"
                    placeholder="45"
                    placeholderTextColor="#666"
                  />
                </View>
              ) : (
                <View style={styles.halfInput}>
                  <Text style={styles.label}>זמן מנוחה (שניות)</Text>
                  <TextInput
                    style={styles.input}
                    value={exercise.restTime?.toString()}
                    onChangeText={(value) => updateExercise(exercise.id!, 'restTime', parseInt(value) || 0)}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor="#666"
                  />
                </View>
              )}
            </View>
            
            {exercise.isSuperset && (
              <View style={styles.fullWidth}>
                <Text style={styles.label}>זמן מנוחה (שניות)</Text>
                <TextInput
                  style={styles.input}
                  value={exercise.restTime?.toString()}
                  onChangeText={(value) => updateExercise(exercise.id!, 'restTime', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor="#666"
                />
              </View>
            )}
          </View>
        ))}
        <Pressable 
          style={styles.addButton}
          onPress={addExercise}
        >
          <Plus size={20} color="#000" />
          <Text style={styles.addButtonText}>הוסף תרגיל</Text>
        </Pressable>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <Pressable 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color="#000" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'שומר...' : 'שמור שינויים'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  exerciseContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  supersetToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supersetLabel: {
    color: '#00FF7F',
    fontSize: 14,
    fontWeight: '600',
  },
  supersetIcon: {
    marginLeft: 4,
  },
  supersetInput: {
    borderColor: '#00FF7F',
    borderWidth: 2,
  },
  exerciseNumber: {
    color: '#00FF7F',
    fontSize: 18,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
    marginTop: 8,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#00FF7F',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#00FF7F',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
});
