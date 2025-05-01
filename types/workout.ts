export interface Exercise {
  id: string;
  name: string;
  sets: number;
  workTime: number;
  restTime: number;
  isSuperset?: boolean;
  supersetExercise?: {
    name: string;
    workTime: number;
  };
}

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  pdfUrl?: string;
}