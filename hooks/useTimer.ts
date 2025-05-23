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
  const [isPaused, setIsPaused] = useState(false);
  
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(workTime);
  const lastPausedTimeRef = useRef<number>(workTime);
  
  // Reset timer when workTime or restTime changes
  useEffect(() => {
    if (!isActive && !isPaused) {
      const newTime = isResting ? restTime : workTime;
      setTimeLeft(newTime);
      pausedTimeRef.current = newTime;
      lastPausedTimeRef.current = newTime;
    }
  }, [workTime, restTime, isResting, isActive, isPaused]);

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
        setIsPaused(false);
        
        // Toggle between work and rest
        if (!isResting) {
          // Work completed, start rest
          setIsResting(true);
          setTimeLeft(restTime);
          pausedTimeRef.current = restTime;
          lastPausedTimeRef.current = restTime;
          startTimeRef.current = null;
          setIsActive(true);
        } else {
          // Rest completed
          setIsResting(false);
          setTimeLeft(workTime);
          pausedTimeRef.current = workTime;
          lastPausedTimeRef.current = workTime;
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
      cancelAnimationFrame();
    }
    
    return cancelAnimationFrame;
  }, [isActive, isResting, workTime, restTime, onComplete, timeLeft, isPaused]);

  const start = () => {
    if (isPaused) {
      // If resuming from paused state, use the saved time
      pausedTimeRef.current = lastPausedTimeRef.current;
    } else {
      // Starting fresh
      pausedTimeRef.current = isResting ? restTime : workTime;
    }
    startTimeRef.current = null;
    setIsPaused(false);
    setIsActive(true);
  };

  const pause = () => {
    lastPausedTimeRef.current = timeLeft;
    setIsActive(false);
    setIsPaused(true);
  };

  const reset = (overrideIsResting?: boolean) => {
    cancelAnimationFrame();
    setIsActive(false);
    setIsPaused(false);
    
    // Allow overriding the isResting state when resetting
    const newIsResting = overrideIsResting !== undefined ? overrideIsResting : isResting;
    setIsResting(newIsResting);
    
    // Always get the latest restTime/workTime from props when resetting
    // This ensures we don't use stale values from closures
    const newTime = newIsResting ? restTime : workTime;
    setTimeLeft(newTime);
    pausedTimeRef.current = newTime;
    lastPausedTimeRef.current = newTime;
    startTimeRef.current = null;
  };

  const toggleMode = () => {
    cancelAnimationFrame();
    setIsActive(false);
    setIsPaused(false);
    const newIsResting = !isResting;
    setIsResting(newIsResting);
    const newTime = newIsResting ? restTime : workTime;
    setTimeLeft(newTime);
    pausedTimeRef.current = newTime;
    lastPausedTimeRef.current = newTime;
    startTimeRef.current = null;
  };

  return {
    timeLeft,
    isActive,
    isResting,
    isPaused,
    start,
    pause,
    reset,
    toggleMode,
  };
};