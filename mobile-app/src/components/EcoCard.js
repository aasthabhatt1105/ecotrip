import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ecoColors, spacing, typography } from '../theme';

export const EcoCard = ({ 
  title, 
  subtitle, 
  icon, 
  score, 
  onPress, 
  variant = 'default',
  children 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.container}
    >
      <BlurView intensity={20} style={styles.glassEffect}>
        <LinearGradient
          colors={variant === 'highlight' 
            ? ['rgba(76, 175, 80, 0.15)', 'rgba(33, 150, 243, 0.1)']
            : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                {icon}
              </View>
              {score && (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>🌱 {score}</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            
            {children}
          </View>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: ecoColors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  glassEffect: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.lg,
    minHeight: 140,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: ecoColors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBadge: {
    backgroundColor: ecoColors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  scoreText: {
    color: ecoColors.neutral.white,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: ecoColors.neutral.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    color: ecoColors.neutral.textSecondary,
    lineHeight: 22,
  },
});
