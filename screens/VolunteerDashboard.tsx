import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, Modal, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventCard from '../components/EventCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  coverPhoto?: string;
  volunteerCategories: string[];
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

  const loadData = async () => {
    try {
      const [storedEvents, savedEvents, storedVolunteers] = await Promise.all([
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('savedEvents'),
        AsyncStorage.getItem('volunteers'),
      ]);
      
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
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

  useEffect(() => {
    loadData();
  }, []);

  // Add real-time updates for saved events
  useEffect(() => {
    const checkForUpdates = async () => {
      const savedEvents = await AsyncStorage.getItem('savedEvents');
      if (savedEvents) {
        const parsedSavedEvents = JSON.parse(savedEvents);
        const newSavedIds = parsedSavedEvents.map((e: Event) => e.id);
        if (JSON.stringify(newSavedIds) !== JSON.stringify(savedIds)) {
          setSavedIds(newSavedIds);
        }
      }
    };

    const interval = setInterval(checkForUpdates, 2000);
    return () => clearInterval(interval);
  }, [savedIds]);

  const handleSave = async (event: Event) => {
    try {
      const saved = await AsyncStorage.getItem('savedEvents');
      let savedEvents: Event[] = saved ? JSON.parse(saved) : [];
      
      if (!savedEvents.find(e => e.id === event.id)) {
        savedEvents.push(event);
        await AsyncStorage.setItem('savedEvents', JSON.stringify(savedEvents));
        setSavedIds([...savedIds, event.id]);
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

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

    setSelectedEvent(event);
    setShowPositionModal(true);
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
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, {user?.firstName || 'Volunteer'}!</Text>
        <Text style={styles.subtitle}>Here are the events you can join:</Text>
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.eventContainer}>
              <TouchableOpacity 
                style={styles.eventCardContainer}
                onPress={() => handleEventPress(item)}
                activeOpacity={0.7}
              >
                <EventCard 
                  title={item.title} 
                  date={item.date} 
                  time={item.time}
                  description={item.description}
                  location={item.location}
                  volunteerCategories={item.volunteerCategories}
                  onPress={() => handleEventPress(item)}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSave(item)}
                style={styles.saveButton}
                disabled={savedIds.includes(item.id)}
              >
                <Ionicons
                  name={savedIds.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                  size={28}
                  color={savedIds.includes(item.id) ? '#62A0A5' : '#aaa'}
                />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={{ marginTop: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No events available.</Text>
          }
        />
        {renderPositionModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 10 },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventCardContainer: {
    flex: 1,
  },
  saveButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
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
