import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, Modal, ScrollView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedEventCard from '../components/UnifiedEventCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
  volunteerCategories: string[];
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
  position: string;
};

type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvents: string[];
  status: 'active' | 'inactive';
};

export default function VolunteerDashboard() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<Event | null>(null);

  const loadData = async () => {
    try {
      const [storedEvents, savedEvents, storedVolunteers] = await Promise.all([
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('savedEvents'),
        AsyncStorage.getItem('volunteers'),
      ]);
      
      if (storedEvents && storedVolunteers) {
        const parsedEvents = JSON.parse(storedEvents);
        const volunteers = JSON.parse(storedVolunteers);
        
        // Calculate volunteer counts for each event
        const eventsWithVolunteers = parsedEvents.map((event: Event) => {
          const eventVolunteers = volunteers.filter((v: Volunteer) => 
            v.assignedEvents && v.assignedEvents.includes(event.id)
          );
          return {
            ...event,
            currentVolunteers: eventVolunteers.length,
            maxVolunteers: event.maxVolunteers || 10,
          };
        });
        setEvents(eventsWithVolunteers);
      }
      
      if (savedEvents) {
        const parsedSavedEvents = JSON.parse(savedEvents);
        setSavedIds(parsedSavedEvents.map((e: Event) => e.id));
      }
      
      if (storedVolunteers) {
        setVolunteers(JSON.parse(storedVolunteers));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Function to update volunteer count for a specific event
  const updateEventVolunteerCount = async (eventId: string) => {
    try {
      const [storedEvents, storedVolunteers] = await Promise.all([
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('volunteers')
      ]);

      if (storedEvents && storedVolunteers) {
        const parsedEvents = JSON.parse(storedEvents);
        const volunteers = JSON.parse(storedVolunteers);
        
        // Find the specific event and update its volunteer count
        const updatedEvents = parsedEvents.map((event: Event) => {
          if (event.id === eventId) {
            const eventVolunteers = volunteers.filter((v: Volunteer) => 
              v.assignedEvents && v.assignedEvents.includes(eventId)
            );
            return {
              ...event,
              currentVolunteers: eventVolunteers.length,
              maxVolunteers: event.maxVolunteers || 10,
            };
          }
          return event;
        });

        // Update events in state and storage
        setEvents(updatedEvents);
        await AsyncStorage.setItem('events', JSON.stringify(updatedEvents));
      }
    } catch (error) {
      console.error('Error updating volunteer count:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add real-time updates for volunteer counts
  useEffect(() => {
    const checkForVolunteerUpdates = async () => {
      try {
        const [storedEvents, storedVolunteers] = await Promise.all([
          AsyncStorage.getItem('events'),
          AsyncStorage.getItem('volunteers')
        ]);

        if (storedEvents && storedVolunteers) {
          const parsedEvents = JSON.parse(storedEvents);
          const volunteers = JSON.parse(storedVolunteers);
          
          // Update volunteer counts for each event
          const eventsWithVolunteers = parsedEvents.map((event: Event) => {
            const eventVolunteers = volunteers.filter((v: Volunteer) => 
              v.assignedEvents && v.assignedEvents.includes(event.id)
            );
            return {
              ...event,
              currentVolunteers: eventVolunteers.length,
              maxVolunteers: event.maxVolunteers || 10,
            };
          });

          // Update events state if there are changes
          setEvents(eventsWithVolunteers);
        }
      } catch (error) {
        console.error('Error checking for volunteer updates:', error);
      }
    };

    // Check for updates every second
    const interval = setInterval(checkForVolunteerUpdates, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (event: Event) => {
    try {
      console.log('Saving event:', event.id);
      const saved = await AsyncStorage.getItem('savedEvents');
      let savedEvents: Event[] = saved ? JSON.parse(saved) : [];
      console.log('Current saved events:', savedEvents.length);
      
      const existingEventIndex = savedEvents.findIndex(e => e.id === event.id);
      
      if (existingEventIndex === -1) {
        // Save the complete event data
        const eventToSave = {
          ...event,
          id: event.id,
          title: event.title,
          date: event.date,
          time: event.time,
          description: event.description,
          location: event.location,
          coverPhoto: event.coverPhoto,
          tags: event.tags || [],
          volunteerCategories: event.volunteerCategories || [],
          currentVolunteers: event.currentVolunteers,
          maxVolunteers: event.maxVolunteers,
          canceled: event.canceled
        };
        savedEvents.push(eventToSave);
        console.log('Adding event to saved events');
        await AsyncStorage.setItem('savedEvents', JSON.stringify(savedEvents));
        setSavedIds(prev => [...prev, event.id]);
        console.log('Event saved successfully');
      } else {
        // Remove from saved events if already saved
        savedEvents.splice(existingEventIndex, 1);
        console.log('Removing event from saved events');
        await AsyncStorage.setItem('savedEvents', JSON.stringify(savedEvents));
        setSavedIds(prev => prev.filter(id => id !== event.id));
        console.log('Event removed successfully');
      }

      // Verify the save
      const verifySaved = await AsyncStorage.getItem('savedEvents');
      const verifyEvents = verifySaved ? JSON.parse(verifySaved) : [];
      console.log('Verified saved events:', verifyEvents.length);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  // Add real-time updates for saved events
  useEffect(() => {
    const checkForSavedUpdates = async () => {
      try {
        const saved = await AsyncStorage.getItem('savedEvents');
        if (saved) {
          const savedEvents = JSON.parse(saved);
          const newSavedIds = savedEvents.map((e: Event) => e.id);
          if (JSON.stringify(newSavedIds) !== JSON.stringify(savedIds)) {
            console.log('Updating saved IDs:', newSavedIds);
            setSavedIds(newSavedIds);
          }
        }
      } catch (error) {
        console.error('Error checking for saved updates:', error);
      }
    };

    const interval = setInterval(checkForSavedUpdates, 1000);
    return () => clearInterval(interval);
  }, [savedIds]);

  const checkVolunteerStatus = async (eventId: string) => {
    try {
      // Check if volunteer is already approved for this event
      const existingVolunteer = volunteers.find(
        v => v.email === user?.email && v.assignedEvents.includes(eventId)
      );
      if (existingVolunteer) {
        return 'approved';
      }

      // Check if volunteer has a pending request
      const pendingVolunteersStr = await AsyncStorage.getItem('pendingVolunteers');
      if (pendingVolunteersStr) {
        const pendingVolunteers: PendingVolunteer[] = JSON.parse(pendingVolunteersStr);
        const pendingRequest = pendingVolunteers.find(
          v => v.eventId === eventId && 
               v.volunteerEmail === user?.email && 
               v.status === 'pending'
        );
        if (pendingRequest) {
          return 'pending';
        }
      }

      return 'none';
    } catch (error) {
      console.error('Error checking volunteer status:', error);
      return 'error';
    }
  };

  const handleEventPress = async (event: Event) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to volunteer for events.');
      return;
    }

    const status = await checkVolunteerStatus(event.id);
    if (status === 'approved') {
      Alert.alert('Notice', 'You are already volunteering for this event.');
      return;
    }
    if (status === 'pending') {
      Alert.alert('Notice', 'You already have a pending request for this event.');
      return;
    }
    if (status === 'error') {
      Alert.alert('Error', 'Unable to check volunteer status. Please try again.');
      return;
    }
    setPendingEvent(event);
    setShowPromptModal(true);
  };

  const handlePromptResponse = (response: 'yes' | 'no') => {
    if (response === 'yes' && pendingEvent) {
      setSelectedEvent(pendingEvent);
      setShowPositionModal(true);
    }
    setShowPromptModal(false);
    setPendingEvent(null);
  };

  const handlePositionSelect = async (position: string) => {
    if (!selectedEvent || !user) return;

    try {
      // Get existing pending volunteers
      const pendingVolunteersStr = await AsyncStorage.getItem('pendingVolunteers');
      let pendingVolunteers: PendingVolunteer[] = pendingVolunteersStr 
        ? JSON.parse(pendingVolunteersStr) 
        : [];

      // Create new volunteer request
      const newVolunteer: PendingVolunteer = {
        id: Date.now().toString(),
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        volunteerName: `${user.firstName} ${user.lastName}`,
        volunteerEmail: user.email,
        status: 'pending',
        timestamp: Date.now(),
        position: position,
      };

      // Add to pending volunteers
      pendingVolunteers.push(newVolunteer);
      await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(pendingVolunteers));

      // Update the volunteer count for this event
      await updateEventVolunteerCount(selectedEvent.id);

      Alert.alert(
        'Success', 
        `Your volunteer request for ${position} has been submitted for approval. The admin will review your request.`
      );
    } catch (error) {
      console.error('Error submitting volunteer request:', error);
      Alert.alert('Error', 'Failed to submit volunteer request. Please try again.');
    } finally {
      setShowPositionModal(false);
      setSelectedEvent(null);
    }
  };

  const handleRegister = (event: Event) => {
    if ((event.currentVolunteers ?? 0) >= (event.maxVolunteers ?? 0)) {
      Alert.alert('Event Full', 'This event has reached its volunteer limit and is now closed.');
      return;
    }
    // ... existing registration logic ...
  };

  const renderPositionModal = () => {
    if (!selectedEvent) return null;

    return (
      <Modal
        visible={showPositionModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Volunteer Position</Text>
            <Text style={styles.modalSubtitle}>for {selectedEvent.title}</Text>
            <ScrollView style={styles.positionsList}>
              {selectedEvent.volunteerCategories.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={styles.positionItem}
                  onPress={() => handlePositionSelect(position)}
                >
                  <Text style={styles.positionItemText}>{position}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowPositionModal(false);
                setSelectedEvent(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <HeaderBanner />
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="person-circle" size={32} color="#62A0A5" />
        </View>
        <View>
          <Text style={styles.title}>Welcome, {user?.firstName || 'Volunteer'}!</Text>
          <Text style={styles.subtitle}>Find and join events that match your interests</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.container}>
        <FlatList
          data={events.filter(e => !e.canceled)}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventContainer}>
              <TouchableOpacity 
                style={styles.eventCardContainer}
                onPress={() => handleEventPress(item)}
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
                  saveButton={
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSave(item);
                      }}
                      style={styles.saveButton}
                      disabled={item.canceled}
                    >
                      <Ionicons
                        name={savedIds.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                        size={28}
                        color={savedIds.includes(item.id) ? '#62A0A5' : '#aaa'}
                      />
                    </TouchableOpacity>
                  }
                />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No events available</Text>
            </View>
          }
        />
        {/* Prompt Modal */}
        <Modal
          visible={showPromptModal}
          transparent
          animationType="fade"
        >
          <View style={[styles.modalContainer, { justifyContent: 'center', alignItems: 'center' }]}> 
            <View style={[styles.modalContent, { backgroundColor: 'white', minWidth: 300, alignItems: 'center' }]}> 
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Do you want to register for this event?</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#62A0A5', padding: 12, borderRadius: 8, marginRight: 10, alignItems: 'center' }}
                  onPress={() => handlePromptResponse('yes')}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: '#ccc', padding: 12, borderRadius: 8, marginLeft: 10, alignItems: 'center' }}
                  onPress={() => handlePromptResponse('no')}
                >
                  <Text style={{ color: '#333', fontWeight: 'bold' }}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {renderPositionModal()}
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
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  headerCard: {
    backgroundColor: '#62A0A5',
    borderRadius: 25,
    padding: 24,
    margin: 16,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    gap: 5,
  },
  headerIcon: {
    backgroundColor: '#FFF1C7',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    height: 3,
    backgroundColor: '#62A0A5',
  },
  eventContainer: {
    width: '100%',
    marginBottom: 15,
  },
  eventCardContainer: {
    width: '100%',
  },
  eventCard: {
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#7F4701',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  positionsList: {
    maxHeight: 300,
  },
  positionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  positionItemText: {
    fontSize: 16,
    color: '#7F4701',
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
