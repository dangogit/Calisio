import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Trash2, Save } from 'lucide-react-native';
import { Exercise } from '@/types/workout';

export default function CreateWorkout() {
  const insets = useSafeAreaInsets();
  const addWorkout = useWorkoutStore(state => state.addWorkout);
  
  const [title, setTitle] = useState('');
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([
    { id: '1', name: '', sets: 3, workTime: 45, restTime: 30 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addExercise = () => {
    setExercises([
      ...exercises, 
      { 
        id: Date.now().toString(), 
        name: '', 
        sets: 3, 
        workTime: 45, 
        restTime: 30 
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

  const handleSave = async () => {
    // Validate
    if (!title.trim()) {
      setError('יש להזין שם לאימון');
      return;
    }

    const invalidExercises = exercises.filter(ex => !ex.name || !ex.name.trim());
    if (invalidExercises.length > 0) {
      setError('יש להזין שם לכל התרגילים');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create workout
      const newWorkout = {
        id: Date.now().toString(),
        title,
        exercises: exercises as Exercise[],
      };
      
      addWorkout(newWorkout);
      router.replace('/');
    } catch (err) {
      setError('שגיאת רשת: לא ניתן לשמור את האימון. נסה שוב מאוחר יותר.');
    } finally {
      setIsSaving(false);
    }
  };

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
              <Pressable 
                style={styles.removeButton}
                onPress={() => removeExercise(exercise.id!)}
              >
                <Trash2 size={20} color="#ff4d4d" />
              </Pressable>
            </View>
            
            <Text style={styles.label}>שם התרגיל</Text>
            <TextInput
              style={styles.input}
              value={exercise.name}
              onChangeText={(value) => updateExercise(exercise.id!, 'name', value)}
              placeholder="הזן שם לתרגיל"
              placeholderTextColor="#666"
            />
            
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
                <Text style={styles.label}>זמן עבודה (שניות)</Text>
                <TextInput
                  style={styles.input}
                  value={exercise.workTime?.toString()}
                  onChangeText={(value) => updateExercise(exercise.id!, 'workTime', parseInt(value) || 0)}
                  keyboardType="numeric"
                  placeholder="45"
                  placeholderTextColor="#666"
                />
              </View>
              
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
            </View>
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
            {isSaving ? 'שומר...' : 'שמור אימון'}
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