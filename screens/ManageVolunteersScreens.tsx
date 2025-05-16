import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
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

export default function ManageVolunteersScreen() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Add event listener for events updates
  useEffect(() => {
    const checkForNewEvents = async () => {
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        if (JSON.stringify(parsedEvents) !== JSON.stringify(events)) {
          setEvents(parsedEvents);
        }
      }
    };

    const interval = setInterval(checkForNewEvents, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [events]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [storedVolunteers, storedEvents, storedPendingVolunteers, storedUsers] = await Promise.all([
        AsyncStorage.getItem('volunteers'),
        AsyncStorage.getItem('events'),
        AsyncStorage.getItem('pendingVolunteers'),
        AsyncStorage.getItem('users'),
      ]);
      
      if (storedVolunteers) {
        const parsedVolunteers = JSON.parse(storedVolunteers);
        // If we have users data, add profile pictures to volunteers
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const volunteersWithPictures = parsedVolunteers.map((volunteer: Volunteer) => {
            const matchingUser = users.find((user: any) => user.email === volunteer.email);
            return {
              ...volunteer,
              profilePicture: matchingUser?.profilePicture || '',
            };
          });
          setVolunteers(volunteersWithPictures);
        } else {
          setVolunteers(parsedVolunteers);
        }
      }
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
      if (storedPendingVolunteers) {
        let parsedPendingVolunteers = JSON.parse(storedPendingVolunteers);
        
        // Add profile pictures to pending volunteers
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          parsedPendingVolunteers = parsedPendingVolunteers.map((pending: PendingVolunteer) => {
            const matchingUser = users.find((user: any) => user.email === pending.volunteerEmail);
            return {
              ...pending,
              profilePicture: matchingUser?.profilePicture || '',
            };
          });
        }

        // Sort by timestamp, newest first
        parsedPendingVolunteers.sort((a: PendingVolunteer, b: PendingVolunteer) => b.timestamp - a.timestamp);
        setPendingVolunteers(parsedPendingVolunteers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveVolunteers = async (newVolunteers: Volunteer[]) => {
    try {
      await AsyncStorage.setItem('volunteers', JSON.stringify(newVolunteers));
      setVolunteers(newVolunteers);
    } catch (error) {
      Alert.alert('Error', 'Failed to save volunteers');
    }
  };

  const getEventTitle = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? `${event.title} (${event.date})` : 'Unknown Event';
  };

  const renderItem = ({ item }: { item: Volunteer }) => (
    <View style={styles.card}>
      <View style={styles.volunteerHeader}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
        ) : (
          <View style={[styles.profilePicture, styles.placeholderImage]}>
            <Ionicons name="person" size={30} color="#ccc" />
          </View>
        )}
        <View style={styles.volunteerInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text>{item.email}</Text>
          <Text>{item.phone}</Text>
        </View>
      </View>
      <View style={styles.eventsList}>
        <Text style={styles.eventsTitle}>Assigned Events:</Text>
        {item.assignedEvents.length > 0 ? (
          item.assignedEvents.map(eventId => (
            <Text key={eventId} style={styles.eventItem}>
              • {getEventTitle(eventId)}
            </Text>
          ))
        ) : (
          <Text style={styles.noEventsText}>No events assigned</Text>
        )}
      </View>
      <View style={styles.row}>
        <TouchableOpacity 
          style={[styles.button, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.buttonText}>Remove Volunteer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Add real-time updates for pending volunteers
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const [storedPendingVolunteers, storedUsers] = await Promise.all([
          AsyncStorage.getItem('pendingVolunteers'),
          AsyncStorage.getItem('users'),
        ]);

        if (storedPendingVolunteers) {
          let newPendingVolunteers = JSON.parse(storedPendingVolunteers);
          
          // Add profile pictures to pending volunteers
          if (storedUsers) {
            const users = JSON.parse(storedUsers);
            newPendingVolunteers = newPendingVolunteers.map((pending: PendingVolunteer) => {
              const matchingUser = users.find((user: any) => user.email === pending.volunteerEmail);
              return {
                ...pending,
                profilePicture: matchingUser?.profilePicture || '',
              };
            });
          }

          // Sort by timestamp, newest first
          newPendingVolunteers.sort((a: PendingVolunteer, b: PendingVolunteer) => b.timestamp - a.timestamp);
          
          if (JSON.stringify(newPendingVolunteers) !== JSON.stringify(pendingVolunteers)) {
            setPendingVolunteers(newPendingVolunteers);
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    const interval = setInterval(checkForUpdates, 2000);
    return () => clearInterval(interval);
  }, [pendingVolunteers]);

  const handleApproveVolunteer = async (pendingVolunteer: PendingVolunteer) => {
    try {
      // Update pending volunteers list
      const updatedPendingVolunteers = pendingVolunteers.map(v => 
        v.id === pendingVolunteer.id ? { ...v, status: 'approved' as const } : v
      );
      await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(updatedPendingVolunteers));
      setPendingVolunteers(updatedPendingVolunteers);

      // Get users data to find profile picture
      const storedUsers = await AsyncStorage.getItem('users');
      let profilePicture = '';
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const matchingUser = users.find((user: any) => user.email === pendingVolunteer.volunteerEmail);
        profilePicture = matchingUser?.profilePicture || '';
      }

      // Check if volunteer already exists
      const existingVolunteer = volunteers.find(v => v.email === pendingVolunteer.volunteerEmail);
      
      if (existingVolunteer) {
        // Update existing volunteer's assigned events
        const updatedVolunteers = volunteers.map(v => 
          v.id === existingVolunteer.id 
            ? { ...v, assignedEvents: [...v.assignedEvents, pendingVolunteer.eventId] }
            : v
        );
        await AsyncStorage.setItem('volunteers', JSON.stringify(updatedVolunteers));
        setVolunteers(updatedVolunteers);
      } else {
        // Add new volunteer
        const newVolunteer: Volunteer = {
          id: Date.now().toString(),
          name: pendingVolunteer.volunteerName,
          email: pendingVolunteer.volunteerEmail,
          phone: '',
          assignedEvents: [pendingVolunteer.eventId],
          status: 'active',
          profilePicture: profilePicture,
        };
        const updatedVolunteers = [...volunteers, newVolunteer];
        await AsyncStorage.setItem('volunteers', JSON.stringify(updatedVolunteers));
        setVolunteers(updatedVolunteers);
      }

      Alert.alert('Success', 'Volunteer has been approved and assigned to the event.');
    } catch (error) {
      console.error('Error approving volunteer:', error);
      Alert.alert('Error', 'Failed to approve volunteer. Please try again.');
    }
  };

  const handleRejectVolunteer = async (pendingVolunteer: PendingVolunteer) => {
    try {
      const updatedPendingVolunteers = pendingVolunteers.map(v => 
        v.id === pendingVolunteer.id ? { ...v, status: 'rejected' as const } : v
      );
      await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(updatedPendingVolunteers));
      setPendingVolunteers(updatedPendingVolunteers);
      Alert.alert('Success', 'Volunteer request has been rejected.');
    } catch (error) {
      console.error('Error rejecting volunteer:', error);
      Alert.alert('Error', 'Failed to reject volunteer. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Remove this volunteer?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        onPress: async () => {
          const filtered = volunteers.filter((vol) => vol.id !== id);
          await saveVolunteers(filtered);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Manage Volunteers</Text>
        
        {/* Pending Volunteers Section */}
        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Volunteer Requests</Text>
          {pendingVolunteers.filter(v => v.status === 'pending').length === 0 ? (
            <Text style={styles.emptyText}>No pending volunteer requests.</Text>
          ) : (
            pendingVolunteers
              .filter(v => v.status === 'pending')
              .map(volunteer => (
                <View key={volunteer.id} style={styles.pendingVolunteerCard}>
                  <View style={styles.pendingVolunteerHeader}>
                    {volunteer.profilePicture ? (
                      <Image source={{ uri: volunteer.profilePicture }} style={styles.pendingProfilePicture} />
                    ) : (
                      <View style={[styles.pendingProfilePicture, styles.placeholderImage]}>
                        <Ionicons name="person" size={30} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.pendingVolunteerInfo}>
                      <Text style={styles.volunteerName}>{volunteer.volunteerName}</Text>
                      <Text style={styles.volunteerEmail}>{volunteer.volunteerEmail}</Text>
                      <Text style={styles.eventTitle}>Event: {volunteer.eventTitle}</Text>
                      <Text style={styles.timestamp}>
                        Requested: {new Date(volunteer.timestamp).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pendingVolunteerActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveVolunteer(volunteer)}
                    >
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectVolunteer(volunteer)}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Current Volunteers Section */}
        <View style={styles.currentVolunteersSection}>
          <Text style={styles.sectionTitle}>Current Volunteers</Text>
          <FlatList
            data={volunteers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.volunteersList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { 
    flex: 1, 
    padding: 20,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  pendingSection: {
    marginBottom: 20,
  },
  currentVolunteersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  volunteersList: {
    flexGrow: 1,
  },
  card: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  eventsList: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  eventsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  eventItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  noEventsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  pendingVolunteerCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pendingVolunteerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pendingProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  pendingVolunteerInfo: {
    marginBottom: 10,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 14,
    color: '#62A0A5',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  pendingVolunteerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  approveButton: {
    backgroundColor: '#62A0A5',
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  volunteerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  volunteerInfo: {
    flex: 1,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
