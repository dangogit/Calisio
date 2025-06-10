import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Calendar, Clock, Flame, BarChart2 } from 'lucide-react-native';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { spacing, borderRadius, typography, shadows } from '@/constants/designTokens';
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
  const cardBgColor = useThemeColor({}, 'cardBackground');
  const textSecondaryColor = useThemeColor({}, 'textSecondary');
  const buttonSecondaryColor = useThemeColor({}, 'buttonSecondary');

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
      style={[styles.workoutCard, { backgroundColor: cardBgColor }, shadows.medium]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Calendar size={16} color={tintColor} style={{ marginLeft: spacing.xs }} />
          <ThemedText color="secondary" style={styles.dateText}>
            {formatDate(item.date)}
          </ThemedText>
        </View>
        <ThemedText type="defaultSemiBold" style={styles.workoutName}>{item.name}</ThemedText>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={16} color={tintColor} style={styles.statIcon} />
            <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.duration}</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>זמן</ThemedText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <View style={styles.statItem}>
            <Flame size={16} color="#FF6B6B" style={styles.statIcon} />
            <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.calories}</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>קלוריות</ThemedText>
          </View>

          <View style={[styles.statDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

          <View style={styles.statItem}>
            <BarChart2 size={16} color="#5E97F6" style={styles.statIcon} />
            <ThemedText type="defaultSemiBold" style={styles.statValue}>{item.exercises.length}</ThemedText>
            <ThemedText color="secondary" style={styles.statLabel}>תרגילים</ThemedText>
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
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <ThemedText type="subtitle" color="secondary" style={styles.centerText}>
            טוען אימונים קודמים...
          </ThemedText>
        </Animated.View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(500)}>
        <ThemedText type="title" style={styles.headerTitle}>
          היסטוריית אימונים
        </ThemedText>
      </Animated.View>

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
                backgroundColor: selectedFilter === filter.id ? tintColor : buttonSecondaryColor,
                marginLeft: index < filterButtons.length - 1 ? spacing.md : 0,
              }
            ]}
            onPress={() => setSelectedFilter(filter.id)}
          >
            <ThemedText 
              style={[
                styles.filterText, 
                { color: selectedFilter === filter.id ? '#FFF' : textSecondaryColor }
              ]}
            >
              {filter.label}
            </ThemedText>
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
          style={[styles.summaryCard, { backgroundColor: cardBgColor }, shadows.medium]}
        >
          <ThemedText type="defaultSemiBold" style={styles.summaryTitle}>סיכום חודשי</ThemedText>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <ThemedText type="heading3" style={styles.summaryValue}>14</ThemedText>
              <ThemedText color="secondary" style={styles.summaryLabel}>אימונים</ThemedText>
            </View>
            
            <View style={[styles.summaryStatDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            
            <View style={styles.summaryStat}>
              <ThemedText type="heading3" style={styles.summaryValue}>9:45</ThemedText>
              <ThemedText color="secondary" style={styles.summaryLabel}>שעות</ThemedText>
            </View>
            
            <View style={[styles.summaryStatDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
            
            <View style={styles.summaryStat}>
              <ThemedText type="heading3" style={styles.summaryValue}>4,820</ThemedText>
              <ThemedText color="secondary" style={styles.summaryLabel}>קלוריות</ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  centerText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  headerTitle: {
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  workoutCard: {
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
  },
  workoutName: {
    fontSize: typography.fontSize.md,
    textAlign: 'right',
  },
  cardContent: {
    padding: spacing.lg,
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
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSize.md,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  summaryContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  summaryTitle: {
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: spacing.md,
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
    fontSize: typography.fontSize.lg,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
  },
  summaryStatDivider: {
    width: 1,
    height: 40,
  },
});