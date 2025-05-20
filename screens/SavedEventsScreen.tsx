import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedEventCard from '../components/UnifiedEventCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import HeaderBanner from '../components/HeaderBanner';
import { useNavigation } from '@react-navigation/native';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  coverPhoto?: string;
  volunteerCategories?: string[];
  canceled?: boolean;
  tags?: string[];
  currentVolunteers?: number;
  maxVolunteers?: number;
};

type PendingVolunteer = {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerName: string;
  volunteerEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  profilePicture?: string;
};

type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvents: string[];
  status: 'active' | 'inactive';
  profilePicture?: string;
};

const TAG_OPTIONS = [
  'Environmental',
  'Animal',
  'Social Work',
  'Healthcare',
  'Blood Donation',
  'Sports',
  'Others',
];

export default function SavedEventsScreen() {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const { user } = useAuth();
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const loadSavedEvents = async () => {
    try {
      console.log('Loading saved events...');
      const stored = await AsyncStorage.getItem('savedEvents');
      let parsedEvents: Event[] = stored ? JSON.parse(stored) : [];
      console.log('Found saved events:', parsedEvents.length);
      
      // Update events with current data from events storage
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        const currentEvents = JSON.parse(storedEvents);
        parsedEvents = parsedEvents.map(savedEvent => {
          const currentEvent = currentEvents.find((e: Event) => e.id === savedEvent.id);
          if (currentEvent) {
            return {
              ...savedEvent,
              ...currentEvent,
              // Preserve saved event data that might not be in current event
              id: savedEvent.id,
              title: savedEvent.title,
              date: savedEvent.date,
              time: savedEvent.time,
              description: savedEvent.description,
              location: savedEvent.location,
              coverPhoto: savedEvent.coverPhoto,
              tags: savedEvent.tags || [],
              volunteerCategories: savedEvent.volunteerCategories || [],
              currentVolunteers: currentEvent.currentVolunteers,
              maxVolunteers: currentEvent.maxVolunteers,
              canceled: currentEvent.canceled
            };
          }
          return savedEvent;
        });
      }
      
      setSavedEvents(parsedEvents);
      console.log('Updated saved events count:', parsedEvents.length);
    } catch (error) {
      console.error('Error loading saved events:', error);
    }
  };

  // Add focus listener to reload saved events when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, reloading saved events');
      loadSavedEvents();
    });

    return unsubscribe;
  }, [navigation]);

  // Add real-time updates for saved events
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const [storedSavedEvents, storedEvents] = await Promise.all([
          AsyncStorage.getItem('savedEvents'),
          AsyncStorage.getItem('events')
        ]);

        if (storedSavedEvents && storedEvents) {
          const parsedSavedEvents: Event[] = JSON.parse(storedSavedEvents);
          const currentEvents: Event[] = JSON.parse(storedEvents);

          // Update saved events with current data while preserving canceled status
          const updatedEvents = parsedSavedEvents.map(savedEvent => {
            const currentEvent = currentEvents.find(e => e.id === savedEvent.id);
            if (currentEvent) {
              return {
                ...savedEvent,
                ...currentEvent,
                // Preserve saved event data
                id: savedEvent.id,
                title: savedEvent.title,
                date: savedEvent.date,
                time: savedEvent.time,
                description: savedEvent.description,
                location: savedEvent.location,
                coverPhoto: savedEvent.coverPhoto,
                tags: savedEvent.tags || [],
                volunteerCategories: savedEvent.volunteerCategories || [],
                currentVolunteers: currentEvent.currentVolunteers,
                maxVolunteers: currentEvent.maxVolunteers,
                // Preserve the canceled status from the current event
                canceled: currentEvent.canceled || false
              };
            }
            return savedEvent;
          });

          // Only update if there are actual changes
          if (JSON.stringify(updatedEvents) !== JSON.stringify(savedEvents)) {
            console.log('Saved events changed, updating...');
            setSavedEvents(updatedEvents);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    const interval = setInterval(checkForUpdates, 1000);
    return () => clearInterval(interval);
  }, [savedEvents]);

  const handleRemoveEvent = async (eventId: string) => {
    try {
      const updatedEvents = savedEvents.filter(event => event.id !== eventId);
      await AsyncStorage.setItem('savedEvents', JSON.stringify(updatedEvents));
      setSavedEvents(updatedEvents);
    } catch (error) {
      console.error('Error removing event:', error);
    }
  };

  const handleVolunteer = async (event: Event) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to volunteer for events.');
      return;
    }

    try {
      // Check for existing pending volunteers
      const storedPendingVolunteers = await AsyncStorage.getItem('pendingVolunteers');
      const pendingVolunteers: PendingVolunteer[] = storedPendingVolunteers 
        ? JSON.parse(storedPendingVolunteers)
        : [];

      // Check for existing approved volunteers
      const storedVolunteers = await AsyncStorage.getItem('volunteers');
      const volunteers: Volunteer[] = storedVolunteers 
        ? JSON.parse(storedVolunteers)
        : [];

      // Check if user already has a pending request for this event
      const hasPendingRequest = pendingVolunteers.some(
        pv => pv.eventId === event.id && 
              pv.volunteerEmail === user.email && 
              pv.status === 'pending'
      );

      // Check if user is already an approved volunteer for this event
      const isApprovedVolunteer = volunteers.some(
        v => v.email === user.email && 
             v.assignedEvents.includes(event.id) && 
             v.status === 'active'
      );

      if (hasPendingRequest) {
        Alert.alert(
          'Already Requested',
          'You have already submitted a volunteer request for this event. Please wait for approval.'
        );
        return;
      }

      if (isApprovedVolunteer) {
        Alert.alert(
          'Already Volunteering',
          'You are already volunteering for this event.'
        );
        return;
      }

      Alert.alert(
        'Volunteer Confirmation',
        `Would you like to volunteer for "${event.title}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Volunteer',
            onPress: async () => {
              try {
                // Create pending volunteer request
                const pendingVolunteer = {
                  id: Date.now().toString(),
                  eventId: event.id,
                  eventTitle: event.title,
                  volunteerName: `${user.firstName} ${user.lastName}`,
                  volunteerEmail: user.email,
                  status: 'pending',
                  timestamp: Date.now(),
                  profilePicture: user.profilePicture,
                };

                // Add new pending volunteer
                const updatedPendingVolunteers = [...pendingVolunteers, pendingVolunteer];
                await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(updatedPendingVolunteers));

                Alert.alert(
                  'Success',
                  'Your volunteer request has been submitted and is pending approval.'
                );
              } catch (error) {
                console.error('Error submitting volunteer request:', error);
                Alert.alert('Error', 'Failed to submit volunteer request. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error checking volunteer status:', error);
      Alert.alert('Error', 'Failed to check volunteer status. Please try again.');
    }
  };

  // Filter saved events by search and tag
  const getFilteredEvents = () => {
    let filtered = savedEvents;
    if (search.trim()) {
      filtered = filtered.filter(e => e.title.toLowerCase().includes(search.trim().toLowerCase()));
    }
    if (tagFilter.length > 0) {
      filtered = filtered.filter(e => tagFilter.every(tag => (e.tags ?? []).includes(tag)));
    }
    // Sort by id (timestamp) descending so newest is first
    filtered.sort((a, b) => Number(b.id) - Number(a.id));
    return filtered;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>Saved Events</Text>
        <Text style={styles.bannerSubtitle}>View and manage your saved events</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.container}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search events by title..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
        {/* Tag Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterBar} contentContainerStyle={styles.tagFilterBarContent}>
          {TAG_OPTIONS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagBadge, tagFilter.includes(tag) && styles.tagBadgeSelected]}
              onPress={() => {
                if (tagFilter.includes(tag)) {
                  setTagFilter(tagFilter.filter(t => t !== tag));
                } else {
                  setTagFilter([...tagFilter, tag]);
                }
              }}
            >
              <Text style={[styles.tagText, tagFilter.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
          {tagFilter.length > 0 && (
            <TouchableOpacity style={styles.clearTagsButton} onPress={() => setTagFilter([])}>
              <Text style={styles.clearTagsText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        <FlatList
          data={getFilteredEvents()}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventContainer}>
              <TouchableOpacity 
                style={styles.eventCardContainer}
                onPress={() => handleVolunteer(item)}
                activeOpacity={0.7}
                disabled={item.canceled}
              >
                <UnifiedEventCard
                  title={item.title}
                  date={item.date}
                  time={item.time}
                  location={item.location}
                  description={item.description}
                  tags={item.tags}
                  coverPhoto={item.coverPhoto}
                  volunteerCount={item.currentVolunteers}
                  maxVolunteers={item.maxVolunteers}
                  showVolunteerCount={true}
                  canceled={item.canceled}
                  showFullSlot={!item.canceled && (item.currentVolunteers ?? 0) >= (item.maxVolunteers ?? 0)}
                  style={styles.eventCard}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveEvent(item.id)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.eventsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No saved events</Text>
            </View>
          }
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFEAB8' 
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 2,
    textAlign: 'left',
  },
  eventContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  eventCardContainer: {
    width: '100%',
  },
  eventCard: {
    width: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  eventsList: {
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
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
  divider: {
    height: 3,
    backgroundColor: '#62A0A5',
    borderRadius: 2,
    width: '100%',
    alignSelf: 'center',
    marginBottom: 10,
  },
  searchBar: {
    borderWidth: 2,
    borderColor: '#7F4701',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    marginTop: 5,
    backgroundColor: '#fff',
    color: '#333',
  },
  tagFilterBar: {
    marginBottom: 10,
    maxHeight: 44,
  },
  tagFilterBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 8,
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
  tagBadgeSelected: {
    backgroundColor: '#218686',
  },
  tagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tagTextSelected: {
    color: '#fff',
  },
  clearTagsButton: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },
  clearTagsText: {
    color: '#7F4701',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 