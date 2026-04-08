import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { EcoCard } from '../components/EcoCard';
// import { CircularProgress } from '../components/CircularProgress'; // Placeholder as component code wasn't provided yet
import { ecoColors, spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

export const ImpactDashboard = ({ userData }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const impactMetrics = [
    { label: 'CO₂ Saved', value: 245, unit: 'kg', icon: '🌍', color: ecoColors.primary[500] },
    { label: 'Trees Planted', value: 12, unit: '', icon: '🌳', color: ecoColors.secondary[500] },
    { label: 'Eco Trips', value: 38, unit: '', icon: '🚲', color: ecoColors.accent },
    { label: 'Sustainable Choices', value: 156, unit: '', icon: '♻️', color: ecoColors.success },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <Animated.View 
        style={[
          styles.heroSection,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.heroContent}>
          <Text style={styles.greeting}>Good Morning, Eco Warrior! 🌿</Text>
          <Text style={styles.heroTitle}>Your Impact This Month</Text>
          
          <View style={styles.mainScoreContainer}>
            {/* CircularProgress Placeholder */}
            <View style={{ width: 180, height: 180, borderRadius: 90, borderWidth: 12, borderColor: ecoColors.primary[100], justifyContent: 'center', alignItems: 'center' }}>
                <View style={styles.scoreContent}>
                    <Text style={styles.scoreValue}>A+</Text>
                    <Text style={styles.scoreLabel}>Eco Score</Text>
                </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {impactMetrics.map((metric, index) => (
          <Animated.View
            key={metric.label}
            style={[
              styles.metricCard,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: [0, 30 * (index + 1)]
                  }) 
                }]
              }
            ]}
          >
            <EcoCard
              title={`${metric.value} ${metric.unit}`}
              subtitle={metric.label}
              icon={<Text style={{ fontSize: 24 }}>{metric.icon}</Text>}
              variant={index === 0 ? 'highlight' : 'default'}
            />
          </Animated.View>
        ))}
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Weekly Activity</Text>
        <View style={styles.chartContainer}>
          {[40, 65, 45, 80, 55, 90, 70].map((height, index) => (
            <View key={index} style={styles.barContainer}>
              <Animated.View 
                style={[
                  styles.bar,
                  { 
                    height: `${height}%`,
                    backgroundColor: height > 70 ? ecoColors.primary[500] : ecoColors.primary[200]
                  }
                ]} 
              />
              <Text style={styles.barLabel}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ecoColors.neutral.background,
  },
  heroSection: {
    backgroundColor: ecoColors.primary[500],
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
  },
  greeting: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.base,
    color: ecoColors.primary[100],
    marginBottom: spacing.xs,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes['3xl'],
    color: ecoColors.neutral.white,
    marginBottom: spacing.lg,
  },
  mainScoreContainer: {
    alignItems: 'center',
  },
  scoreContent: {
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes['4xl'],
    color: ecoColors.neutral.white,
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.primary[100],
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    marginTop: -20,
  },
  metricCard: {
    width: (width - spacing.lg * 3) / 2,
    margin: spacing.xs,
  },
  chartSection: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: ecoColors.neutral.text,
    marginBottom: spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    backgroundColor: ecoColors.neutral.surface,
    borderRadius: 20,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: ecoColors.neutral.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  barLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
    color: ecoColors.neutral.textSecondary,
  },
});
