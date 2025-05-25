// Test function to validate superset logic
export function testSupersetLogic() {
  console.log('🧪 Testing Superset Logic');
  
  // Mock superset exercise
  const supersetExercise = {
    id: 'ss1',
    name: 'Push-ups',
    sets: 2,
    workTime: 10,  // 10 seconds for first exercise
    restTime: 30,  // 30 seconds rest after complete superset
    isSuperset: true,
    supersetExercise: {
      name: 'Squats',
      workTime: 8   // 8 seconds for second exercise
    }
  };
  
  console.log('📋 Superset Exercise Config:', supersetExercise);
  
  // Test sequence for one complete set
  console.log('\n🔄 Expected Sequence for Set 1:');
  console.log('1. Push-ups (first) - 10 seconds work');
  console.log('2. Squats (second) - 8 seconds work');  
  console.log('3. Rest - 30 seconds');
  console.log('4. Repeat for Set 2...');
  
  // Test logic flow
  let supersetPhase: 'first' | 'second' = 'first';
  let currentSet = 1;
  let isResting = false;
  
  console.log('\n⏰ Simulating Timer Completions:');
  
  // Simulate first exercise completion
  console.log(`✅ Timer Complete: ${supersetExercise.name} (${supersetPhase}) - ${supersetExercise.workTime}s`);
  if (!isResting && supersetExercise.isSuperset && supersetPhase === 'first') {
    supersetPhase = 'second';
    console.log(`➡️  Moving to second exercise: ${supersetExercise.supersetExercise?.name} - ${supersetExercise.supersetExercise?.workTime}s`);
  }
  
  // Simulate second exercise completion
  console.log(`✅ Timer Complete: ${supersetExercise.supersetExercise?.name} (${supersetPhase}) - ${supersetExercise.supersetExercise?.workTime}s`);
  if (!isResting) {
    isResting = true;
    console.log(`➡️  Moving to rest: ${supersetExercise.restTime}s`);
  }
  
  // Simulate rest completion
  console.log(`✅ Rest Complete: ${supersetExercise.restTime}s`);
  if (isResting) {
    isResting = false;
    if (currentSet < supersetExercise.sets) {
      currentSet += 1;
      supersetPhase = 'first';
      console.log(`➡️  Moving to Set ${currentSet}: ${supersetExercise.name} (${supersetPhase})`);
    } else {
      console.log('🏁 Superset exercise complete!');
    }
  }
  
  console.log('\n✨ Superset logic test completed successfully!');
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testSupersetLogic = testSupersetLogic;
  console.log('🚀 Superset test available! Run testSupersetLogic() in console');
}
