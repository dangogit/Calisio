import { View, StyleSheet, FlatList, Pressable, Text, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, CalendarCheck, Clock, BarChartHorizontal } from 'lucide-react-native';
import { useWorkoutStore } from '@/store/workoutStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useThemeColor } from '@/hooks/useThemeColor';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PlansScreen() {
  const workouts = useWorkoutStore(state => state.workouts);
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBgColor = '#1A1A1A';
  const secondaryTextColor = '#888';
  const buttonTextColor = useThemeColor({}, 'background');

  // Simulate fetching workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
      } catch (err) {
        setError("שגיאת רשת: לא ניתן לטעון את התוכניות. בדוק את החיבור לאינטרנט ונסה שוב.");
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Animated.Text 
          entering={FadeInUp.delay(300).duration(500)} 
          style={[styles.loadingText, { color: textColor }]}
        >
          טוען תוכניות אימון...
        </Animated.Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Animated.Text 
          entering={FadeInDown.duration(500)} 
          style={styles.errorText}
        >
          {error}
        </Animated.Text>
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Pressable 
            style={[styles.retryButton, { backgroundColor: tintColor }]} 
            onPress={handleRetry}
          >
            <Text style={[styles.retryButtonText, { color: buttonTextColor }]}>נסה שוב</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <Animated.Text 
          entering={FadeInDown.duration(500)} 
          style={[styles.emptyText, { color: textColor }]}
        >
          אין תוכניות אימון עדיין
        </Animated.Text>
        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Pressable 
            style={[styles.addButton, { backgroundColor: tintColor }]}
            onPress={() => router.push('/add-plan')}
          >
            <Text style={[styles.addButtonText, { color: buttonTextColor }]}>הוסף תוכנית אימון</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <Animated.Text 
        entering={FadeInDown.duration(500)} 
        style={[styles.headerTitle, { color: textColor }]}
      >
        תוכניות האימון שלך
      </Animated.Text>
      
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedPressable 
            entering={FadeInDown.delay(index * 100).duration(400)}
            style={[styles.workoutCard, { backgroundColor: cardBgColor }]}
            onPress={() => router.push(`/workout/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.workoutTitle, { color: textColor }]}>{item.title}</Text>
              <Image 
                source={{ uri: item.imageUrl || 'https://via.placeholder.com/60' }} 
                style={styles.workoutImage}
              />
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.infoItem}>
                <Text style={[styles.infoText, { color: secondaryTextColor }]}>3 פעמים בשבוע</Text>
                <CalendarCheck size={16} color={tintColor} style={styles.infoIcon} />
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoText, { color: secondaryTextColor }]}>45 דק' לאימון</Text>
                <Clock size={16} color={tintColor} style={styles.infoIcon} />
              </View>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoText, { color: secondaryTextColor }]}>{item.exercises.length} תרגילים</Text>
                <BarChartHorizontal size={16} color={tintColor} style={styles.infoIcon} />
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Pressable 
                style={[styles.startButton, { backgroundColor: tintColor }]}
                onPress={() => router.push(`/workout/${item.id}`)}
              >
                <ChevronLeft size={18} color="#FFFFFF" style={styles.infoIcon} />
                <Text style={[styles.startButtonText, { color: '#FFFFFF' }]}>התחל אימון</Text>
              </Pressable>
            </View>
          </AnimatedPressable>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      <Pressable 
        style={[styles.floatingButton, { backgroundColor: tintColor }]}
        onPress={() => router.push('/add-plan')}
      >
        <Text style={[styles.floatingButtonText, { color: buttonTextColor }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  workoutCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  workoutImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 12,
  },
  cardContent: {
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  infoIcon: {
    marginLeft: 8,
    marginRight: 2,
    
  },
  infoText: {
    fontSize: 14,
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
  },
  startButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});