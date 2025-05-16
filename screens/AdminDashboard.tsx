import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  coverPhoto?: string;
  maxVolunteers?: number;
  currentVolunteers?: number;
};

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    // Set up real-time updates
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        
        // Get volunteer counts for each event
        const storedVolunteers = await AsyncStorage.getItem('volunteers');
        if (storedVolunteers) {
          const volunteers = JSON.parse(storedVolunteers);
          const eventsWithVolunteers = parsedEvents.map((event: Event) => {
            const eventVolunteers = volunteers.filter((v: any) => 
              v.assignedEvents && v.assignedEvents.includes(event.id)
            );
            return {
              ...event,
              currentVolunteers: eventVolunteers.length,
              maxVolunteers: event.maxVolunteers || 10, // Default max volunteers if not set
            };
          });
          setEvents(eventsWithVolunteers);
        } else {
          setEvents(parsedEvents.map((event: Event) => ({
            ...event,
            currentVolunteers: 0,
            maxVolunteers: event.maxVolunteers || 10,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = (eventId: string) => {
    setImageErrors(prev => new Set(prev).add(eventId));
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <TouchableOpacity 
        onPress={() => item.coverPhoto && setSelectedImage(item.coverPhoto)}
        activeOpacity={0.9}
      >
        {item.coverPhoto && !imageErrors.has(item.id) ? (
          <Image 
            source={{ uri: item.coverPhoto }} 
            style={styles.eventImage}
            resizeMode="cover"
            onError={() => handleImageError(item.id)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDate}>{item.date} at {item.time}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location" size={16} color="#62A0A5" />
          <Text style={styles.eventLocation}>{item.location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="newspaper" size={16} color="#62A0A5" />
          <Text style={styles.eventDescription}>{item.description}</Text>
        </View>

        <View style={styles.volunteerInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color="#62A0A5" />
            <Text style={styles.volunteerCount}>
              Volunteers: {item.currentVolunteers || 0}/{item.maxVolunteers || 10}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, Admin!</Text>
        <Text style={styles.subtitle}>Manage your events and volunteers</Text>
        
        <View style={styles.eventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading events...</Text>
          ) : events.length === 0 ? (
            <Text style={styles.emptyText}>No events scheduled</Text>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item.id}
              renderItem={renderEventItem}
              contentContainerStyle={styles.eventsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  eventsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  eventsList: {
    flexGrow: 1,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 15,
  },
  eventHeader: {
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  eventDescription: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  volunteerInfo: {
    marginTop: 5,
  },
  volunteerCount: {
    fontSize: 14,
    color: '#000',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});
