import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { gpsService } from '../services/GPSTrackingService';
import { ecoColors, spacing, typography } from '../theme';

const { width, height } = Dimensions.get('window');

export const LiveTripTracker = ({ route, navigation }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState({
    distance: 0,
    carbonSaved: 0,
    ecoPoints: 0,
    duration: 0,
    currentSpeed: 0
  });
  const [waypoints, setWaypoints] = useState([]);
  const [mapRegion] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeTracking();
    startPulseAnimation();
    
    // Stats update interval
    const statsInterval = setInterval(() => {
      if (isTracking) {
        const currentStats = gpsService.getCurrentStats();
        setStats(currentStats);
        setWaypoints(gpsService.currentTrip?.waypoints || []);
      }
    }, 1000);

    return () => clearInterval(statsInterval);
  }, [isTracking]);

  const initializeTracking = async () => {
    try {
      await gpsService.initialize();
      const { mode, destination } = route.params || {};
      
      await gpsService.startTrip({
        mode: mode || 'cycling',
        destination,
        route: null // Will be calculated
      });
      
      setIsTracking(true);
      Animated.spring(statsAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Tracking initialization failed:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleEndTrip = async () => {
    const completedTrip = await gpsService.endTrip();
    setIsTracking(false);
    navigation.navigate('TripSummary', { trip: completedTrip });
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        style={styles.map}
        region={mapRegion}
        showsUserLocation={true}
        followsUserLocation={isTracking}
        mapType="terrain"
      >
        {waypoints.length > 1 && (
          <Polyline
            coordinates={waypoints.map(wp => ({
              latitude: wp.lat,
              longitude: wp.lng
            }))}
            strokeColor={ecoColors.primary[500]}
            strokeWidth={4}
          />
        )}
        
        {waypoints.length > 0 && (
          <Marker
            coordinate={{
              latitude: waypoints[waypoints.length - 1].lat,
              longitude: waypoints[waypoints.length - 1].lng
            }}
          >
            <Animated.View style={[styles.pulseMarker, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.markerInner} />
            </Animated.View>
          </Marker>
        )}
      </MapView>

      {/* Live Stats Overlay */}
      <Animated.View style={[styles.statsOverlay, { transform: [{ translateY: statsAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [200, 0]
      }) }] }]}>
        <BlurView intensity={80} style={styles.glassStats}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={24} color={ecoColors.primary[500]} />
              <Text style={styles.statValue}>{stats.distance.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="leaf" size={24} color={ecoColors.success} />
              <Text style={styles.statValue}>{stats.carbonSaved.toFixed(2)}</Text>
              <Text style={styles.statLabel}>kg CO₂ saved</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star-circle" size={24} color={ecoColors.accent} />
              <Text style={styles.statValue}>{stats.ecoPoints}</Text>
              <Text style={styles.statLabel}>eco points</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={ecoColors.secondary[500]} />
              <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
              <Text style={styles.statLabel}>duration</Text>
            </View>
          </View>

          <View style={styles.speedIndicator}>
            <Text style={styles.speedValue}>{(stats.currentSpeed * 3.6).toFixed(0)}</Text>
            <Text style={styles.speedUnit}>km/h</Text>
          </View>

          <TouchableOpacity style={styles.endButton} onPress={handleEndTrip}>
            <Text style={styles.endButtonText}>End Trip</Text>
          </TouchableOpacity>
        </BlurView>
      </Animated.View>

      {/* Mode Indicator */}
      <View style={styles.modeBadge}>
        <MaterialCommunityIcons 
          name={route.params?.mode === 'cycling' ? 'bike' : 'walk'} 
          size={20} 
          color={ecoColors.neutral.white} 
        />
        <Text style={styles.modeText}>{route.params?.mode || 'walking'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ecoColors.neutral.background,
  },
  map: {
    width: width,
    height: height,
  },
  pulseMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ecoColors.primary[500] + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ecoColors.primary[500],
    borderWidth: 2,
    borderColor: ecoColors.neutral.white,
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  glassStats: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: ecoColors.neutral.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: ecoColors.neutral.textSecondary,
  },
  speedIndicator: {
    position: 'absolute',
    top: -30,
    right: 20,
    backgroundColor: ecoColors.neutral.text,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 70,
  },
  speedValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: ecoColors.neutral.white,
  },
  speedUnit: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: ecoColors.neutral.textSecondary,
  },
  endButton: {
    backgroundColor: ecoColors.error,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  endButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: ecoColors.neutral.white,
  },
  modeBadge: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ecoColors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  modeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: ecoColors.neutral.white,
    marginLeft: spacing.xs,
  },
});
