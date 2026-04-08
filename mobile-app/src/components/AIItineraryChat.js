import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ecoColors, spacing, typography } from '../theme';

const QUICK_OPTIONS = [
  { icon: '🏔️', label: 'Mountain Trek', query: 'Plan a 5-day low-carbon hiking trip to the Alps' },
  { icon: '🏖️', label: 'Coastal Eco-Resort', query: 'Sustainable beach vacation in Costa Rica' },
  { icon: '🌲', label: 'Forest Retreat', query: 'Forest bathing and nature therapy in Japan' },
  { icon: '🚴', label: 'Cycling Tour', query: 'Bike tour through Netherlands windmills and tulips' },
];

export const AIItineraryChat = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      type: 'ai',
      content: "Hello! I'm your EcoTrip AI planner. I use satellite data and weather forecasts to create sustainable itineraries. Where would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tripDate, setTripDate] = useState(new Date());
  
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Simulate API call - replace with actual fetch
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'I found some great options! Based on current satellite data showing excellent vegetation health (NDVI: 0.82) and favorable weather next week...',
        itinerary: generateMockItinerary(),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const generateMockItinerary = () => ({
    destination: 'Costa Rica',
    duration: 5,
    ecoScore: 94,
    carbonSaved: 245,
    highlights: [
      { day: 1, activity: 'Arrive San José, eco-lodge check-in', icon: '🏨' },
      { day: 2, activity: 'Monteverde Cloud Forest (Satellite: Clear skies)', icon: '🌲' },
      { day: 3, activity: 'Wildlife sanctuary visit', icon: '🦥' },
      { day: 4, activity: 'Sustainable coffee farm tour', icon: '☕' },
      { day: 5, activity: 'Beach cleanup + departure', icon: '🏖️' },
    ],
    weather: '☀️ 26-30°C, 10% rain chance',
    satelliteNote: '🛰️ NDVI 0.82: Excellent forest conditions',
  });

  const renderMessage = ({ item }) => {
    const isAI = item.type === 'ai';
    
    return (
      <Animated.View 
        style={[
          styles.messageContainer,
          isAI ? styles.aiMessage : styles.userMessage,
          { opacity: fadeAnim }
        ]}
      >
        {isAI && (
          <View style={styles.aiAvatar}>
            <LinearGradient
              colors={[ecoColors.primary[400], ecoColors.secondary[500]]}
              style={styles.avatarGradient}
            >
              <MaterialCommunityIcons name="leaf" size={20} color="white" />
            </LinearGradient>
          </View>
        )}
        
        <View style={[styles.messageBubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
            {item.content}
          </Text>
          
          {item.itinerary && (
            <View style={styles.itineraryCard}>
              <View style={styles.itineraryHeader}>
                <Text style={styles.itineraryTitle}>🌿 {item.itinerary.destination}</Text>
                <View style={styles.ecoScoreBadge}>
                  <Text style={styles.ecoScoreText}>{item.itinerary.ecoScore} Eco Score</Text>
                </View>
              </View>
              
              <View style={styles.satelliteInfo}>
                <MaterialCommunityIcons name="satellite-variant" size={16} color={ecoColors.secondary[500]} />
                <Text style={styles.satelliteText}>{item.itinerary.satelliteNote}</Text>
              </View>
              
              <View style={styles.weatherInfo}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={16} color={ecoColors.accent} />
                <Text style={styles.weatherText}>{item.itinerary.weather}</Text>
              </View>

              <View style={styles.highlightsList}>
                {item.itinerary.highlights.map((h, idx) => (
                  <View key={idx} style={styles.highlightItem}>
                    <Text style={styles.highlightDay}>Day {h.day}</Text>
                    <Text style={styles.highlightIcon}>{h.icon}</Text>
                    <Text style={styles.highlightText} numberOfLines={2}>{h.activity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.carbonSaved}>
                <MaterialCommunityIcons name="leaf-circle" size={20} color={ecoColors.success} />
                <Text style={styles.carbonText}>
                  Save {item.itinerary.carbonSaved}kg CO₂ vs conventional travel
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('ItineraryDetail', { data: item.itinerary })}
              >
                <Text style={styles.viewDetailsText}>View Full Itinerary</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={ecoColors.neutral.white} />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderQuickOptions = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.quickOptionsContainer}
      contentContainerStyle={styles.quickOptionsContent}
    >
      {QUICK_OPTIONS.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickOption}
          onPress={() => setInputText(option.query)}
        >
          <Text style={styles.quickOptionIcon}>{option.icon}</Text>
          <Text style={styles.quickOptionLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <BlurView intensity={80} style={styles.headerBlur}>
          <MaterialCommunityIcons name="satellite-uplink" size={24} color={ecoColors.primary[500]} />
          <Text style={styles.headerTitle}>EcoTrip AI Planner</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE SATELLITE DATA</Text>
          </View>
        </BlurView>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Quick Options */}
      {messages.length === 1 && renderQuickOptions()}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons name="calendar" size={24} color={ecoColors.primary[500]} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Where do you want to go?"
          placeholderTextColor={ecoColors.neutral.textSecondary}
          multiline
        />

        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <MaterialCommunityIcons name="loading" size={24} color={ecoColors.neutral.white} />
          ) : (
            <MaterialCommunityIcons name="send" size={24} color={ecoColors.neutral.white} />
          )}
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={tripDate}
          mode="date"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setTripDate(selectedDate);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ecoColors.neutral.background,
  },
  header: {
    paddingTop: 50,
    zIndex: 10,
  },
  headerBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: ecoColors.neutral.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ecoColors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ecoColors.success,
    marginRight: spacing.xs,
  },
  liveText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: ecoColors.success,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiAvatar: {
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
  },
  avatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    borderRadius: 20,
    padding: spacing.md,
    maxWidth: '100%',
  },
  aiBubble: {
    backgroundColor: ecoColors.neutral.surface,
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  userBubble: {
    backgroundColor: ecoColors.primary[500],
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  aiText: {
    color: ecoColors.neutral.text,
  },
  userText: {
    color: ecoColors.neutral.white,
  },
  timestamp: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: ecoColors.neutral.textSecondary,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  itineraryCard: {
    backgroundColor: ecoColors.primary[50],
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itineraryTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: ecoColors.neutral.text,
  },
  ecoScoreBadge: {
    backgroundColor: ecoColors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  ecoScoreText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.xs,
    color: ecoColors.neutral.white,
  },
  satelliteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ecoColors.secondary[100],
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  satelliteText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.secondary[700],
    marginLeft: spacing.xs,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  weatherText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.neutral.textSecondary,
    marginLeft: spacing.xs,
  },
  highlightsList: {
    marginBottom: spacing.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  highlightDay: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.sm,
    color: ecoColors.primary[600],
    width: 50,
  },
  highlightIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  highlightText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: ecoColors.neutral.text,
    flex: 1,
  },
  carbonSaved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ecoColors.success + '15',
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  carbonText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.success,
    marginLeft: spacing.xs,
  },
  viewDetailsButton: {
    backgroundColor: ecoColors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  viewDetailsText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.sizes.base,
    color: ecoColors.neutral.white,
    marginRight: spacing.xs,
  },
  quickOptionsContainer: {
    maxHeight: 100,
    marginBottom: spacing.md,
  },
  quickOptionsContent: {
    paddingHorizontal: spacing.md,
  },
  quickOption: {
    backgroundColor: ecoColors.neutral.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ecoColors.primary[200],
  },
  quickOptionIcon: {
    fontSize: 20,
    marginRight: spacing.xs,
  },
  quickOptionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: ecoColors.neutral.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: ecoColors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: ecoColors.neutral.border,
  },
  dateButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: ecoColors.neutral.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.base,
    color: ecoColors.neutral.text,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: ecoColors.primary[500],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: ecoColors.neutral.border,
  },
});
