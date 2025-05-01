import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Platform } from 'react-native';

interface Props {
  timeLeft: number;
  totalTime: number;
  isActive: boolean;
  onPress: () => void;
  isResting: boolean;
}

export const CircularTimer = ({ timeLeft, totalTime, isActive, onPress, isResting }: Props) => {
  const progress = timeLeft / totalTime;

  // Use conditional rendering for animated components on web
  if (Platform.OS === 'web') {
    // Web version with simpler animation
    return (
      <Pressable onPress={onPress}>
        <View style={styles.container}>
          <View 
            style={[
              styles.progressWeb, 
              { 
                width: `${progress * 100}%`,
                backgroundColor: isResting ? '#333' : '#00FF7F' 
              }
            ]} 
          />
          <View style={styles.content}>
            <Text style={styles.time}>{timeLeft}</Text>
            <Text style={styles.label}>
              {!isActive ? 'התחל' : isResting ? 'מנוחה' : 'עבודה'}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Native version with Reanimated
  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(progress, [0, 1], [360, 0]);
    
    return {
      transform: [{ rotateZ: withTiming(`${rotation}deg`, { duration: 300 }) }],
    };
  });

  return (
    <Pressable onPress={onPress}>
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.progress, 
            animatedStyle,
            { borderTopColor: isResting ? '#333' : '#00FF7F', borderRightColor: isResting ? '#333' : '#00FF7F' }
          ]} 
        />
        <View style={styles.content}>
          <Text style={styles.time}>{timeLeft}</Text>
          <Text style={styles.label}>
            {!isActive ? 'התחל' : isResting ? 'מנוחה' : 'עבודה'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
    borderColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 10,
    borderColor: 'transparent',
    borderTopColor: '#00FF7F',
    borderRightColor: '#00FF7F',
  },
  progressWeb: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#00FF7F',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  time: {
    color: '#00FF7F',
    fontSize: 48,
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontSize: 18,
    marginTop: 8,
  },
});