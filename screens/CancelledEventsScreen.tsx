import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, Dimensions, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import HeaderBanner from '../components/HeaderBanner';
import UnifiedEventCard from '../components/UnifiedEventCard';

export default function CancelledEventsScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [activeTab, setActiveTab] = useState<'cancelled' | 'full'>('cancelled');
  const navigation = useNavigation();
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: activeTab === 'cancelled' ? 0 : 1,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('events');
      const storedVolunteers = await AsyncStorage.getItem('volunteers');
      let parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];
      if (storedVolunteers) {
        const volunteers = JSON.parse(storedVolunteers);
        parsedEvents = parsedEvents.map((event: any) => {
          const eventVolunteers = volunteers.filter((v: any) =>
            v.assignedEvents && v.assignedEvents.includes(event.id)
          );
          return {
            ...event,
            currentVolunteers: eventVolunteers.length,
          };
        });
      }
      setEvents(parsedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleImageError = (eventId: string) => {
    setImageErrors((prev) => new Set(prev).add(eventId));
  };

  const filteredEvents: any[] = events.filter((e: any) => {
    if (activeTab === 'cancelled') return e.canceled;
    // Full slot: not canceled, maxVolunteers > 0, and currentVolunteers >= maxVolunteers
    return (
      !e.canceled &&
      typeof e.maxVolunteers === 'number' &&
      e.maxVolunteers > 0 &&
      typeof e.currentVolunteers === 'number' &&
      e.currentVolunteers >= e.maxVolunteers
    );
  });

  // Sort full slot events by id descending (newest first)
  const sortedEvents: any[] = activeTab === 'full'
    ? [...filteredEvents].sort((a, b) => Number(b.id) - Number(a.id))
    : filteredEvents;

  const renderEventItem = ({ item }: { item: any }) => (
    <UnifiedEventCard
      title={item.title}
      date={item.date}
      time={item.time}
      location={item.location}
      description={item.description}
      tags={item.tags}
      coverPhoto={item.coverPhoto}
      imageError={imageErrors.has(item.id)}
      onImageError={() => handleImageError(item.id)}
      volunteerCount={item.currentVolunteers}
      maxVolunteers={item.maxVolunteers}
      showVolunteerCount={activeTab === 'full'}
      canceled={item.canceled}
      showFullSlot={!item.canceled && (item.currentVolunteers ?? 0) >= (item.maxVolunteers ?? 0)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>Cancelled & Full Events</Text>
        <Text style={styles.bannerSubtitle}>View events that are cancelled or have filled volunteer slots</Text>
      </View>
      <View style={styles.bannerDivider} />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: tabAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['2%', '48%'],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>Cancelled Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'full' && styles.activeTab]}
            onPress={() => setActiveTab('full')}
          >
            <Text style={[styles.tabText, activeTab === 'full' && styles.activeTabText]}>Full Volunteer Slots</Text>
          </TouchableOpacity>
        </View>
        {sortedEvents.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeTab === 'cancelled' ? 'No cancelled events.' : 'No full slot events.'}
          </Text>
        ) : (
          <FlatList
            data={sortedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFEAB8',
  },

  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'left',
    flexShrink: 1,
  },

  eventsList: {
    flexGrow: 1,
  },

  eventCard: {
    backgroundColor: 'rgb(252, 252, 252)',
    borderRadius: 25,
    borderColor: '#7F4701',
    marginBottom: 18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  eventImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  eventContent: {
    padding: 18,
  },

  eventHeader: {
    marginBottom: 10,
  },

  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 10,
  },

  dividerLine: {
    height: 2,
    backgroundColor: '#7F4701',
    marginVertical: 6,
  },

  eventDate: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },

  eventTime: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
    gap: 8,
  },

  infoIcon: {
    marginRight: 6,
    color: '#7F4701',
  },

  eventLocation: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
  },

  eventDescription: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
    marginLeft: 3,
  },

  volunteerCountBadge: {
    backgroundColor: 'rgb(252, 204, 145)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
    marginLeft: 8,
  },

  volunteerCountText: {
    color: '#7F4701',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },

  volunteerCountLabel: {
    color: '#7F4701',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },

  tagBadge: {
    borderWidth: 2,
    backgroundColor: '#FEBD6B',
    borderRadius: 20,
    borderColor: '#7F4701',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 4,
  },

  eventTagBadge: {
    backgroundColor: '#FEBD6B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },

  eventTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 30,
  },

  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: '#62A0A5',
    borderRadius: 25,
    padding: 4,
    position: 'relative',
    height: 48,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 25,
    zIndex: 1,
  },

  activeTab: {
    backgroundColor: '#FEBD6B',
  },

  tabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  activeTabText: {
    color: '#fff',
  },

  tabIndicator: {
    position: 'absolute',
    top: 4,
    width: '50%',
    height: 40,
    backgroundColor: '#FEBD6B',
    borderRadius: 20,
    zIndex: 0,
  },

  bannerHeader: {
    backgroundColor: '#62A0A5',
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 420,
    width: '90%',
    alignSelf: 'center',
  },

  bannerIcon: {
    marginBottom: 2,
  },

  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 2,
    textAlign: 'center',
  },

  bannerSubtitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.92,
  },

  bannerDivider: {
    height: 3,
    backgroundColor: '#62A0A5',
    borderRadius: 2,
    width: '100%',
    alignSelf: 'center',
  },
}); 