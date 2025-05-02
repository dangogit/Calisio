import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Calendar, Clock, Flame, BarChart2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Fake data for past workouts
const PAST_WORKOUTS = [
  { 
    id: '1', 
    date: '2023-11-26', 
    name: 'אימון כח - חזה וטרייספס',
    duration: '42 דק\'', 
    calories: '320',
    exercises: ['לחיצת חזה', 'פרפר', 'פולי טרייספס', 'יד אחורית']
  },
  { 
    id: '2', 
    date: '2023-11-24', 
    name: 'אימון כח - רגליים',
    duration: '54 דק\'', 
    calories: '450',
    exercises: ['סקוואט', 'לאנג׳', 'לג אקסטנשן', 'כפיפת ברכיים']
  },
  { 
    id: '3', 
    date: '2023-11-22', 
    name: 'אימון כח - גב ובייספס',
    duration: '47 דק\'', 
    calories: '380',
    exercises: ['מתח', 'חתירה', 'פולדאון', 'כפיפת מרפקים']
  },
  { 
    id: '4', 
    date: '2023-11-20', 
    name: 'אימון כח - כתפיים',
    duration: '38 דק\'', 
    calories: '290',
    exercises: ['לחיצת כתפיים', 'הרחקת זרועות', 'פייסיק', 'פרונט רייז']
  },
  { 
    id: '5', 
    date: '2023-11-18', 
    name: 'אימון כח - חזה וטרייספס',
    duration: '45 דק\'', 
    calories: '340',
    exercises: ['לחיצת חזה', 'פרפר', 'פולי טרייספס', 'יד אחורית']
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PastWorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [pastWorkouts, setPastWorkouts] = useState<typeof PAST_WORKOUTS>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Get theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const cardBgColor = '#1A1A1A';
  const secondaryTextColor = '#888';
  const inactiveFilterColor = '#333';

  // Simulate fetching past workouts
  useEffect(() => {
    const fetchPastWorkouts = async () => {
      try {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPastWorkouts(PAST_WORKOUTS);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch past workouts:', err);
        setIsLoading(false);
      }
    };

    fetchPastWorkouts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderWorkoutItem = ({ item, index }: { item: typeof PAST_WORKOUTS[0], index: number }) => (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 100).duration(400)}
      style={[styles.workoutCard, { backgroundColor: cardBgColor }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color={tintColor} style={{ marginLeft: 4 }} />
          <Text style={[styles.dateText, { color: secondaryTextColor }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <Text style={[styles.workoutName, { color: textColor }]}>{item.name}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={16} color={tintColor} style={styles.statIcon} />
            <Text style={[styles.statValue, { color: textColor }]}>{item.duration}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>זמן</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Flame size={16} color="#FF6B6B" style={styles.statIcon} />
            <Text style={[styles.statValue, { color: textColor }]}>{item.calories}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>קלוריות</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <BarChart2 size={16} color="#5E97F6" style={styles.statIcon} />
            <Text style={[styles.statValue, { color: textColor }]}>{item.exercises.length}</Text>
            <Text style={[styles.statLabel, { color: secondaryTextColor }]}>תרגילים</Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );

  const filterButtons = [
    { id: 'all', label: 'הכל' },
    { id: 'week', label: 'שבוע אחרון' },
    { id: 'month', label: 'חודש אחרון' },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Animated.Text 
          entering={FadeInDown.delay(300).duration(500)} 
          style={[styles.loadingText, { color: textColor }]}
        >
          טוען אימונים קודמים...
        </Animated.Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor }]}>
      <Animated.Text 
        entering={FadeInDown.duration(500)} 
        style={[styles.headerTitle, { color: textColor }]}
      >
        היסטוריית אימונים
      </Animated.Text>

      <Animated.View 
        entering={FadeInDown.delay(100).duration(500)}
        style={styles.filterContainer}
      >
        {filterButtons.map((filter, index) => (
          <Pressable
            key={filter.id}
            style={[
              styles.filterButton, 
              { 
                backgroundColor: selectedFilter === filter.id ? tintColor : inactiveFilterColor,
                marginLeft: index < filterButtons.length - 1 ? 10 : 0,
              }
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <Text 
              style={[
                styles.filterText, 
                { color: selectedFilter === filter.id ? '#FFF' : secondaryTextColor }
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      <FlatList
        data={pastWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={renderWorkoutItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.summaryContainer}>
        <Animated.View 
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.summaryCard, { backgroundColor: cardBgColor }]}
        >
          <Text style={[styles.summaryTitle, { color: textColor }]}>סיכום חודשי</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: textColor }]}>14</Text>
              <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>אימונים</Text>
            </View>
            
            <View style={styles.summaryStatDivider} />
            
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: textColor }]}>9:45</Text>
              <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>שעות</Text>
            </View>
            
            <View style={styles.summaryStatDivider} />
            
            <View style={styles.summaryStat}>
              <Text style={[styles.summaryValue, { color: textColor }]}>4,820</Text>
              <Text style={[styles.summaryLabel, { color: secondaryTextColor }]}>קלוריות</Text>
            </View>
          </View>
        </Animated.View>
      </View>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
  workoutCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cardContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
}); 