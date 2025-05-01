import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Upload, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useWorkoutStore } from '@/store/workoutStore';

export default function WorkoutUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const addWorkout = useWorkoutStore(state => state.addWorkout);

  const handleAddManually = () => {
    router.push('/create-workout');
  };

  const handleUploadPdf = async () => {
    // In a real app, we would implement document picker here
    // For this demo, we'll simulate adding a workout after a delay
    setIsUploading(true);
    
    try {
      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const newWorkout = {
        id: Date.now().toString(),
        title: 'אימון מהקובץ',
        exercises: [
          { 
            id: '1', 
            name: 'מתח', 
            sets: 3, 
            workTime: 45, 
            restTime: 30 
          },
          { 
            id: '2', 
            name: 'שכיבות שמיכה', 
            sets: 3, 
            workTime: 45, 
            restTime: 30 
          },
        ]
      };
      
      addWorkout(newWorkout);
      router.push('/');
    } catch (error) {
      // Handle network error
      if (Platform.OS === 'web') {
        alert('שגיאת רשת: לא ניתן להעלות את הקובץ. נסה שוב מאוחר יותר.');
      } else {
        Alert.alert(
          'שגיאת רשת',
          'לא ניתן להעלות את הקובץ. נסה שוב מאוחר יותר.',
          [{ text: 'אישור', style: 'default' }]
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]} 
        onPress={handleUploadPdf}
        disabled={isUploading}
      >
        <Upload size={32} color="#00FF7F" />
        <Text style={styles.buttonText}>
          {isUploading ? 'מעלה...' : 'העלה קובץ PDF'}
        </Text>
      </Pressable>

      <Text style={styles.orText}>או</Text>

      <Pressable 
        style={styles.uploadButton}
        onPress={handleAddManually}
      >
        <Plus size={32} color="#00FF7F" />
        <Text style={styles.buttonText}>הוסף אימון ידנית</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    width: '100%',
    height: 160,
    backgroundColor: '#111',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  orText: {
    color: '#666',
    fontSize: 16,
    marginVertical: 12,
  },
});