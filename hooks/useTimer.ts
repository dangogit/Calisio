import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  workTime: number;
  restTime: number;
  onComplete?: () => void;
}

export const useTimer = ({ workTime, restTime, onComplete }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(workTime);
  const [isActive, setIsActive] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset timer when workTime or restTime changes
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(isResting ? restTime : workTime);
    }
  }, [workTime, restTime, isResting, isActive]);

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false);
      
      // Toggle between work and rest
      if (!isResting) {
        // Work completed, start rest
        setIsResting(true);
        setTimeLeft(restTime);
        setIsActive(true);
      } else {
        // Rest completed
        setIsResting(false);
        setTimeLeft(workTime);
        
        // Call onComplete callback
        if (onComplete) {
          onComplete();
        }
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isActive, timeLeft, isResting, workTime, restTime, onComplete]);

  const start = () => {
    setIsActive(true);
  };

  const pause = () => {
    setIsActive(false);
  };

  const reset = () => {
    setIsActive(false);
    setIsResting(false);
    setTimeLeft(workTime);
  };

  const toggleMode = () => {
    setIsActive(false);
    setIsResting(!isResting);
    setTimeLeft(!isResting ? restTime : workTime);
  };

  return {
    timeLeft,
    isActive,
    isResting,
    start,
    pause,
    reset,
    toggleMode,
  };
};