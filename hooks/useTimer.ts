import { useState, useEffect, useRef, useCallback } from 'react';

export type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type TimerPhase = 'WORK' | 'REST';

interface UseTimerProps {
  workTime: number;
  restTime: number;
  onComplete?: () => void;
}

interface TimerData {
  timeLeft: number;
  state: TimerState;
  phase: TimerPhase;
}

export function useTimer({ workTime, restTime, onComplete }: UseTimerProps) {
  const [timer, setTimer] = useState<TimerData>({
    timeLeft: workTime,
    state: 'IDLE',
    phase: 'WORK'
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  
  // Update callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Main timer effect - handles the countdown
  useEffect(() => {
    if (timer.state === 'RUNNING' && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Timer completed
            return {
              ...prev,
              timeLeft: 0,
              state: 'COMPLETED'
            };
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft
          };
        });
      }, 1000);
    } else {
      // Clear interval when not running or time is up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.state, timer.timeLeft]);

  // Handle completion
  useEffect(() => {
    if (timer.state === 'COMPLETED') {
      onCompleteRef.current?.();
    }
  }, [timer.state]);

  // Update timer duration when work/rest times change
  useEffect(() => {
    if (timer.state === 'IDLE') {
      setTimer(prev => ({
        ...prev,
        timeLeft: prev.phase === 'WORK' ? workTime : restTime
      }));
    }
  }, [workTime, restTime, timer.state]);

  // Actions
  const start = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      state: 'RUNNING'
    }));
  }, []);

  const pause = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      state: prev.state === 'RUNNING' ? 'PAUSED' : prev.state
    }));
  }, []);

  const resume = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      state: prev.state === 'PAUSED' ? 'RUNNING' : prev.state
    }));
  }, []);

  const stop = useCallback(() => {
    setTimer(prev => ({
      ...prev,
      state: 'IDLE',
      timeLeft: prev.phase === 'WORK' ? workTime : restTime
    }));
  }, [workTime, restTime]);

  const reset = useCallback((toPhase?: TimerPhase) => {
    const newPhase = toPhase || timer.phase;
    const newTimeLeft = newPhase === 'WORK' ? workTime : restTime;
    
    setTimer({
      timeLeft: newTimeLeft,
      state: 'IDLE',
      phase: newPhase
    });
  }, [workTime, restTime, timer.phase]);

  const switchPhase = useCallback((newPhase: TimerPhase) => {
    const newTimeLeft = newPhase === 'WORK' ? workTime : restTime;
    
    setTimer({
      timeLeft: newTimeLeft,
      state: 'IDLE',
      phase: newPhase
    });
  }, [workTime, restTime]);

  // Derived state for easier consumption
  const isRunning = timer.state === 'RUNNING';
  const isPaused = timer.state === 'PAUSED';
  const isIdle = timer.state === 'IDLE';
  const isCompleted = timer.state === 'COMPLETED';
  const isActive = isRunning || isPaused;
  const isWork = timer.phase === 'WORK';
  const isRest = timer.phase === 'REST';

  return {
    // State
    timeLeft: timer.timeLeft,
    state: timer.state,
    phase: timer.phase,
    
    // Derived state
    isRunning,
    isPaused,
    isIdle,
    isCompleted,
    isActive,
    isWork,
    isRest,
    
    // Actions
    start,
    pause,
    resume,
    stop,
    reset,
    switchPhase
  };
}