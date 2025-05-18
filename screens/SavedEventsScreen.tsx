import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
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

export default function SavedEventsScreen() {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const { user } = useAuth();
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const navigation = useNavigation();

  const loadSavedEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedEvents');
      let parsedEvents: Event[] = stored ? JSON.parse(stored) : [];
      
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

      // Remove events that are already registered (pending or approved)
      if (user) {
        const [storedPendingVolunteers, storedVolunteers] = await Promise.all([
          AsyncStorage.getItem('pendingVolunteers'),
          AsyncStorage.getItem('volunteers'),
        ]);
        const pendingVolunteers: PendingVolunteer[] = storedPendingVolunteers ? JSON.parse(storedPendingVolunteers) : [];
        const volunteers: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
        const registeredIds = [
          ...pendingVolunteers.filter(pv => pv.volunteerEmail === user.email && pv.status === 'pending').map(pv => pv.eventId),
          ...volunteers.filter(v => v.email === user.email && v.status === 'active').flatMap(v => v.assignedEvents),
        ];
        setRegisteredEventIds(registeredIds);
        // Remove registered events from savedEvents
        parsedEvents = parsedEvents.filter(event => !registeredIds.includes(event.id));
        await AsyncStorage.setItem('savedEvents', JSON.stringify(parsedEvents));
      }
      setSavedEvents(parsedEvents);
    } catch (error) {
      console.error('Error loading saved events:', error);
    }
  };

  // Add focus listener to reload saved events when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedEvents();
    });

    return unsubscribe;
  }, [navigation]);

  // Add real-time updates
  useEffect(() => {
    const checkForUpdates = async () => {
      const stored = await AsyncStorage.getItem('savedEvents');
      let parsedEvents: Event[] = stored ? JSON.parse(stored) : [];
      if (user) {
        const [storedPendingVolunteers, storedVolunteers] = await Promise.all([
          AsyncStorage.getItem('pendingVolunteers'),
          AsyncStorage.getItem('volunteers'),
        ]);
        const pendingVolunteers: PendingVolunteer[] = storedPendingVolunteers ? JSON.parse(storedPendingVolunteers) : [];
        const volunteers: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
        const registeredIds = [
          ...pendingVolunteers.filter(pv => pv.volunteerEmail === user.email && pv.status === 'pending').map(pv => pv.eventId),
          ...volunteers.filter(v => v.email === user.email && v.status === 'active').flatMap(v => v.assignedEvents),
        ];
        setRegisteredEventIds(registeredIds);
        parsedEvents = parsedEvents.filter(event => !registeredIds.includes(event.id));
        await AsyncStorage.setItem('savedEvents', JSON.stringify(parsedEvents));
      }
      if (JSON.stringify(parsedEvents) !== JSON.stringify(savedEvents)) {
        setSavedEvents(parsedEvents);
      }
    };

    const interval = setInterval(checkForUpdates, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [savedEvents, user]);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.container}>
        <Text style={styles.title}>Saved Events</Text>
        <FlatList
          data={savedEvents}
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
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center',
    color: '#7F4701'
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
}); 