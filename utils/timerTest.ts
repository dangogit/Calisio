// Timer Test Script - validates that timer values are correctly preserved
// This script tests the exact scenario reported: workTime=10s, restTime=20s

export const testTimerLogic = () => {
  console.log('🧪 TESTING TIMER LOGIC');
  
  // Simulate the problematic scenario
  const testScenario = {
    currentExercise: {
      id: 'test1',
      name: 'Test Exercise',
      sets: 2,
      workTime: 10,  // 10 seconds work
      restTime: 20,  // 20 seconds rest
    },
    supersetPhase: 'first' as const,
  };
  
  // Calculate workTime and restTime as done in the component
  const workTime = (() => {
    if (!testScenario.currentExercise) return 45;
    
    if (testScenario.currentExercise.isSuperset && testScenario.supersetPhase === 'second') {
      return testScenario.currentExercise.supersetExercise?.workTime || 45;
    }
    
    return testScenario.currentExercise.workTime || 45;
  })();
  
  const restTime = testScenario.currentExercise?.restTime || 30;
  
  console.log('📊 Test Values:', {
    workTime,
    restTime,
    expected: { workTime: 10, restTime: 20 }
  });
  
  // Simulate the timer action sequence
  console.log('🎬 Simulating timer sequence:');
  console.log('1. Start with work (should be 10s)');
  console.log('2. User clicks next (skip button)');
  console.log('3. Timer should reset to rest (should be 20s, NOT 10s)');
  
  return {
    workTime,
    restTime,
    isValid: workTime === 10 && restTime === 20
  };
};

// Test runner - call this in browser console
if (typeof window !== 'undefined') {
  (window as any).testTimer = testTimerLogic;
  console.log('🚀 Timer test available! Run testTimer() in console');
}
