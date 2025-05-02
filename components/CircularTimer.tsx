import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Platform } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Pause, Play, SkipForward, ChevronRight } from 'lucide-react-native';

// For web only - create a custom div element that can render CSS gradients
let WebGradientView: any = null;
if (Platform.OS === 'web') {
  WebGradientView = ({ style, gradientStyle, ...props }: any) => {
    return (
      <div
        style={{
          ...style,
          ...gradientStyle,
        }}
        {...props}
      />
    );
  };
}

interface Props {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  onPress: () => void;
  isResting: boolean;
  isPaused?: boolean;
  onPauseToggle?: () => void;
  onNextSet?: () => void;
  onNextExercise?: () => void;
}

export const CircularTimer = ({ 
  timeLeft, 
  totalTime, 
  isActive, 
  onPress, 
  isResting,
  isPaused = false,
  onPauseToggle,
  onNextSet,
  onNextExercise
}: Props) => {
  // Calculate progress from 0 to 1 (0 = just started, 1 = complete)
  const progress = 1 - (timeLeft / totalTime);
  
  // Get theme colors
  const tintColor = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  
  // Initial color and progress color
  const initialColor = isResting ? '#1F7D53' : tintColor;
  const progressColor = '#222222'; // Dark gray as the timer progresses
  
  // Use separate implementations for web and native
  if (Platform.OS === 'web') {
    // Convert progress to degrees (0-360)
    const degrees = progress * 360;
    
    // Create gradientStyle for web
    const createGradientCSS = () => {
      if (progress >= 1) {
        return { background: progressColor }; // If done, show full progress color
      }
      
      if (progress <= 0) {
        return { background: initialColor }; // If not started, show full initial color
      }
      
      // Create a conical gradient that starts from the top (12 o'clock)
      // and sweeps clockwise based on the progress
      return {
        background: `conic-gradient(
          ${progressColor} 0deg ${degrees}deg,
          ${initialColor} ${degrees}deg 360deg
        )`
      };
    };

    return (
      <View style={styles.container}>
        {/* Using WebGradientView for web to support CSS background property */}
        <View style={[styles.circleWeb, { backgroundColor: initialColor }]}>
          {WebGradientView && (
            <WebGradientView 
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                position: 'absolute',
              }}
              gradientStyle={createGradientCSS()}
            />
          )}
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.time, { color: '#fff' }]}>
            {timeLeft}
          </Text>
          <Text style={[styles.label, { color: textColor }]}>
            {!isActive ? 'התחל' : isResting ? 'מנוחה' : 'עבודה'}
          </Text>
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {/* Play/Pause button */}
          <Pressable 
            style={styles.circleButton} 
            onPress={!isActive ? onPress : onPauseToggle}
            hitSlop={15}
          >
            {!isActive || isPaused ? (
              <Play size={24} color="#fff" />
            ) : (
              <Pause size={24} color="#fff" />
            )}
          </Pressable>

          {/* Next set/break button */}
          {onNextSet && (
            <Pressable 
              style={styles.circleButton} 
              onPress={onNextSet}
              hitSlop={15}
            >
              <SkipForward size={24} color="#fff" />
            </Pressable>
          )}

          {/* Next exercise button */}
          {onNextExercise && (
            <Pressable 
              style={styles.circleButton} 
              onPress={onNextExercise}
              hitSlop={15}
            >
              <ChevronRight size={24} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* Entire timer area is clickable to start/continue */}
        <Pressable 
          style={styles.fullAreaButton} 
          onPress={onPress}
        />
      </View>
    );
  }
  
  // Native version
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(`${progress * 360}deg`, { duration: 300 }) }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Initial colored circle (the starting color) */}
      <View style={[styles.circle, { borderColor: initialColor }]} />
      
      {/* Progress mask that reveals the darker color */}
      <View style={styles.maskContainer}>
        {/* Left half of the circle mask */}
        <Animated.View 
          style={[
            styles.halfCircle,
            { backgroundColor: progressColor },
            progress <= 0.5 ? animatedStyle : { transform: [{ rotate: '180deg' }] }
          ]}
        />
        
        {/* Right half of the circle mask that activates after 50% progress */}
        {progress > 0.5 && (
          <Animated.View 
            style={[
              styles.halfCircle,
              { backgroundColor: progressColor },
              { transform: [{ rotate: withTiming(`${(progress - 0.5) * 360}deg`, { duration: 300 }) }] }
            ]}
          />
        )}
      </View>
              
      {/* Center content */}
      <View style={styles.content}>
        <Text style={[styles.time, { color: '#fff' }]}>
          {timeLeft}
        </Text>
        <Text style={[styles.label, { color: textColor }]}>
          {!isActive ? 'התחל' : isResting ? 'מנוחה' : 'עבודה'}
        </Text>
      </View>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {/* Play/Pause button */}
        <Pressable 
          style={styles.circleButton} 
          onPress={!isActive ? onPress : onPauseToggle}
          hitSlop={15}
        >
          {!isActive || isPaused ? (
            <Play size={24} color="#fff" />
          ) : (
            <Pause size={24} color="#fff" />
          )}
        </Pressable>

        {/* Next set/break button */}
        {onNextSet && (
          <Pressable 
            style={styles.circleButton} 
            onPress={onNextSet}
            hitSlop={15}
          >
            <SkipForward size={24} color="#fff" />
          </Pressable>
        )}

        {/* Next exercise button */}
        {onNextExercise && (
          <Pressable 
            style={styles.circleButton} 
            onPress={onNextExercise}
            hitSlop={15}
          >
            <ChevronRight size={24} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Entire timer area is clickable to start/continue */}
      <Pressable 
        style={styles.fullAreaButton} 
        onPress={onPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
  },
  circleWeb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  maskContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    width: 100, // Half the width
    height: 200,
    top: 0,
    left: 100, // Position at center
    borderTopRightRadius: 100,
    borderBottomRightRadius: 100,
    backgroundColor: 'transparent',
    transformOrigin: 'left',
    transform: [{ rotate: '0deg' }],
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 18,
    marginTop: 8,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 3,
    gap: 15,
  },
  circleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  fullAreaButton: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  }
});