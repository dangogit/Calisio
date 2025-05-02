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
  
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  
  // Reset timer when workTime or restTime changes
  useEffect(() => {
    if (!isActive) {
      const newTime = isResting ? restTime : workTime;
      setTimeLeft(newTime);
      pausedTimeRef.current = newTime;
    }
  }, [workTime, restTime, isResting, isActive]);

  const cancelAnimationFrame = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Timer logic using requestAnimationFrame for accurate timing
  useEffect(() => {
    let lastTimestamp = 0;
    
    const updateTimer = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        lastTimestamp = timestamp;
      }
      
      // Calculate elapsed time since timer started
      const elapsed = Math.floor((timestamp - startTimeRef.current) / 1000);
      const newTimeLeft = Math.max(0, pausedTimeRef.current - elapsed);
      
      // Only update state if the second has changed or we've reached zero
      if (newTimeLeft !== timeLeft || newTimeLeft === 0) {
        setTimeLeft(newTimeLeft);
      }
      
      // Handle timer completion
      if (newTimeLeft === 0) {
        cancelAnimationFrame();
        setIsActive(false);
        
        // Toggle between work and rest
        if (!isResting) {
          // Work completed, start rest
          setIsResting(true);
          setTimeLeft(restTime);
          pausedTimeRef.current = restTime;
          startTimeRef.current = null;
          setIsActive(true);
        } else {
          // Rest completed
          setIsResting(false);
          setTimeLeft(workTime);
          pausedTimeRef.current = workTime;
          startTimeRef.current = null;
          
          // Call onComplete callback
          if (onComplete) {
            onComplete();
          }
        }
      } else if (isActive) {
        // Continue animation loop
        animationFrameRef.current = window.requestAnimationFrame(updateTimer);
      }
    };
    
    if (isActive) {
      // Start the animation frame loop
      animationFrameRef.current = window.requestAnimationFrame(updateTimer);
    } else {
      // When paused, store the current time left
      pausedTimeRef.current = timeLeft;
      startTimeRef.current = null;
      cancelAnimationFrame();
    }
    
    return cancelAnimationFrame;
  }, [isActive, isResting, workTime, restTime, onComplete, timeLeft]);

  const start = () => {
    startTimeRef.current = null;
    setIsActive(true);
  };

  const pause = () => {
    pausedTimeRef.current = timeLeft;
    setIsActive(false);
  };

  const reset = () => {
    cancelAnimationFrame();
    setIsActive(false);
    setIsResting(false);
    const newTime = workTime;
    setTimeLeft(newTime);
    pausedTimeRef.current = newTime;
    startTimeRef.current = null;
  };

  const toggleMode = () => {
    cancelAnimationFrame();
    setIsActive(false);
    const newIsResting = !isResting;
    setIsResting(newIsResting);
    const newTime = newIsResting ? restTime : workTime;
    setTimeLeft(newTime);
    pausedTimeRef.current = newTime;
    startTimeRef.current = null;
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