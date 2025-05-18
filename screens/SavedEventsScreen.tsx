import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventCard from '../components/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import HeaderBanner from '../components/HeaderBanner';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  coverPhoto?: string;
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

  const loadSavedEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedEvents');
      let parsedEvents: Event[] = stored ? JSON.parse(stored) : [];
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

  useEffect(() => {
    loadSavedEvents();
  }, []);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderBanner />
      <View style={styles.container}>
        <Text style={styles.title}>Saved Events</Text>
        <FlatList
          data={savedEvents}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventContainer}>
              <EventCard 
                title={item.title} 
                date={item.date} 
                description={item.description}
                time={item.time}
                location={item.location}
                onPress={() => handleVolunteer(item)}
              />
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveEvent(item.id)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ marginTop: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No saved events.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  eventContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
}); 