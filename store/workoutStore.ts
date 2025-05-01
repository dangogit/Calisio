import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '@/types/workout';

interface WorkoutState {
  workouts: Workout[];
  isLoading: boolean;
  error: string | null;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, workout: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      workouts: [],
      isLoading: false,
      error: null,
      addWorkout: (workout) => set((state) => ({ 
        workouts: [...state.workouts, workout],
        error: null
      })),
      updateWorkout: (id, updatedWorkout) => set((state) => ({
        workouts: state.workouts.map((workout) => 
          workout.id === id ? { ...workout, ...updatedWorkout } : workout
        ),
        error: null
      })),
      deleteWorkout: (id) => set((state) => ({
        workouts: state.workouts.filter((workout) => workout.id !== id),
        error: null
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist workouts, not loading state or errors
      partialize: (state) => ({ workouts: state.workouts }),
    }
  )
);