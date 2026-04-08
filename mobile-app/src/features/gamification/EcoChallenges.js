import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { EcoCard } from '../../components/EcoCard';
import { ecoColors, spacing, typography } from '../../theme';

export const EcoChallenges = () => {
  const [activeChallenges] = useState([
    {
      id: '1',
      title: 'Plastic-Free Week',
      description: 'Avoid single-use plastics for 7 days',
      reward: { points: 500, badge: '🌊 Ocean Guardian' },
      progress: 0.6,
      participants: 1234,
      daysLeft: 3,
      difficulty: 'medium',
    },
    {
      id: '2',
      title: '100km Cycle Challenge',
      description: 'Cycle 100km this month instead of driving',
      reward: { points: 1000, badge: '🚴 Cycle Master' },
      progress: 0.3,
      participants: 567,
      daysLeft: 15,
      difficulty: 'hard',
    },
    {
      id: '3',
      title: 'Local Food Explorer',
      description: 'Eat at 5 farm-to-table restaurants',
      reward: { points: 300, badge: '🌾 Local Hero' },
      progress: 0.8,
      participants: 890,
      daysLeft: 7,
      difficulty: 'easy',
    },
  ]);

  const renderChallenge = ({ item }) => (
    <EcoCard
      title={item.title}
      subtitle={`${item.participants.toLocaleString()} participants • ${item.daysLeft} days left`}
      icon={<Text style={styles.challengeIcon}>🏆</Text>}
      variant={item.difficulty === 'hard' ? 'highlight' : 'default'}
    >
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { width: `${item.progress * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(item.progress * 100)}%</Text>
      </View>
      
      <View style={styles.rewardRow}>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>+{item.reward.points} pts</Text>
        </View>
        <Text style={styles.badgeText}>{item.reward.badge}</Text>
      </View>
      
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>
          {item.progress > 0 ? 'Continue Challenge' : 'Join Challenge'}
        </Text>
      </TouchableOpacity>
    </EcoCard>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Active Challenges</Text>
      <FlatList
        data={activeChallenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ecoColors.neutral.background,
    padding: spacing.md,
  },
  header: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes['2xl'],
    color: ecoColors.neutral.text,
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  challengeIcon: {
    fontSize: 24,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: ecoColors.primary[100],
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ecoColors.primary[500],
    borderRadius: 4,
  },
  progressText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: ecoColors.primary[600],
    minWidth: 35,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rewardBadge: {
    backgroundColor: ecoColors.accent + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  rewardText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: ecoColors.accent,
  },
  badgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.neutral.textSecondary,
  },
  joinButton: {
    backgroundColor: ecoColors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: ecoColors.neutral.white,
  },
});
