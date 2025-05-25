import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerProps {
  workTime: number;
  restTime: number;
  onComplete?: () => void;
}

export const useTimer = ({ workTime, restTime, onComplete }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Update callback ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset timer when duration changes and timer is idle
  useEffect(() => {
    if (!isActive && !isPaused) {
      const newTime = isResting ? restTime : workTime;
      setTimeLeft(newTime);
    }
  }, [workTime, restTime, isResting, isActive, isPaused]);

  // Main timer logic
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer completed
            setIsActive(false);
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
  }, []);

  const reset = useCallback((toRestMode?: boolean) => {
    setIsActive(false);
    setIsPaused(false);
    
    if (toRestMode !== undefined) {
      setIsResting(toRestMode);
      setTimeLeft(toRestMode ? restTime : workTime);
    } else {
      setTimeLeft(isResting ? restTime : workTime);
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [workTime, restTime, isResting]);

  const toggleMode = useCallback(() => {
    const newIsResting = !isResting;
    setIsResting(newIsResting);
    setTimeLeft(newIsResting ? restTime : workTime);
    setIsActive(false);
    setIsPaused(false);
  }, [isResting, workTime, restTime]);

  return {
    timeLeft,
    isActive,
    isResting,
    isPaused,
    start,
    pause,
    stop,
    reset,
    toggleMode,
  };
};