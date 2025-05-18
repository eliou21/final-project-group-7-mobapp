import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import HeaderBanner from '../components/HeaderBanner';

// Define types locally
type Event = {
  id: string;
  title: string;
  date: string;
  time?: string;
  description: string;
  location?: string;
  coverPhoto?: string;
  volunteerCategories: string[];
  canceled?: boolean;
  tags?: string[];
};

type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedEvents: string[];
  removedEvents?: string[];
  status: 'active' | 'inactive';
  profilePicture?: string;
  positions?: { [eventId: string]: string };
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

// Add a type for display items
type DisplayEvent =
  | (Event & { status: 'active' | 'removed' | 'cancelled'; category: string; pendingId?: string })
  | ({
      id: string;
      title: string;
      date: string;
      time: string;
      location: string;
      coverPhoto: string | undefined;
      description: string;
      volunteerCategories: string[];
      canceled: boolean;
      tags?: string[];
      status: 'pending';
      category: string;
      pendingId: string;
    });

export default function MyRegisteredEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [positions, setPositions] = useState<{ [eventId: string]: string }>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [pending, setPending] = useState<PendingVolunteer[]>([]);
  const [sortStatus, setSortStatus] = useState<'all' | 'active' | 'pending' | 'removed' | 'cancelled'>('all');
  const [editPending, setEditPending] = useState<{ pendingId: string; category: string; categories: string[] } | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    if (!user) return;
    const [storedEvents, storedVolunteers, storedPending] = await Promise.all([
      AsyncStorage.getItem('events'),
      AsyncStorage.getItem('volunteers'),
      AsyncStorage.getItem('pendingVolunteers'),
    ]);
    let eventsArr: Event[] = storedEvents ? JSON.parse(storedEvents) : [];
    setAllEvents(eventsArr);
    let volunteersArr: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
    let pendingArr: PendingVolunteer[] = storedPending ? JSON.parse(storedPending) : [];
    const v = volunteersArr.find((v) => v.email === user.email) || null;
    if (v) {
      setVolunteer(v);
      setPositions(v.positions || {});
      setEvents(eventsArr.filter((e) => v.assignedEvents.includes(e.id)));
    } else {
      setVolunteer(null);
      setPositions({});
      setEvents([]);
    }
    setPending(pendingArr.filter((p) => p.volunteerEmail === user.email && p.status === 'pending'));
  };

  const handleEditCategory = (event: Event) => {
    setEditEvent(event);
    setEditCategories(event.volunteerCategories);
    setShowEditModal(true);
  };

  const handleSelectCategory = async (category: string) => {
    if (!volunteer || !editEvent || !user) return;
    const updatedPositions = { ...positions, [editEvent.id]: category };
    setPositions(updatedPositions);
    // Update AsyncStorage
    const storedVolunteers = await AsyncStorage.getItem('volunteers');
    let volunteersArr: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
    volunteersArr = volunteersArr.map((v) =>
      v.email === user.email
        ? { ...v, positions: updatedPositions }
        : v
    );
    await AsyncStorage.setItem('volunteers', JSON.stringify(volunteersArr));
    setShowEditModal(false);
    setEditEvent(null);
    loadData();
  };

  const handleEditPendingCategory = async (pendingId: string, newCategory: string) => {
    if (!user) return;
    const storedPending = await AsyncStorage.getItem('pendingVolunteers');
    let pendingArr: PendingVolunteer[] = storedPending ? JSON.parse(storedPending) : [];
    pendingArr = pendingArr.map((p) =>
      p.id === pendingId
        ? { ...p, position: newCategory }
        : p
    );
    await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(pendingArr));
    setEditPending(null);
    loadData();
  };

  const handleCancelPending = async (pendingId: string) => {
    if (!user) return;
    Alert.alert('Cancel Registration', 'Are you sure you want to cancel your pending registration for this event?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive', onPress: async () => {
          const storedPending = await AsyncStorage.getItem('pendingVolunteers');
          let pendingArr: PendingVolunteer[] = storedPending ? JSON.parse(storedPending) : [];
          pendingArr = pendingArr.filter((p) => p.id !== pendingId);
          await AsyncStorage.setItem('pendingVolunteers', JSON.stringify(pendingArr));
          loadData();
        }
      }
    ]);
  };

  const handleRemoveRegistration = async (eventId: string) => {
    if (!volunteer || !user) return;
    Alert.alert('Remove Registration', 'Are you sure you want to remove your registration for this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          // Remove event from assignedEvents and positions
          const updatedAssigned = volunteer.assignedEvents.filter((id: string) => id !== eventId);
          const updatedPositions = { ...positions };
          delete updatedPositions[eventId];
          // Update AsyncStorage
          const storedVolunteers = await AsyncStorage.getItem('volunteers');
          let volunteersArr: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
          volunteersArr = volunteersArr.map((v) =>
            v.email === user.email
              ? { ...v, assignedEvents: updatedAssigned, positions: updatedPositions }
              : v
          );
          await AsyncStorage.setItem('volunteers', JSON.stringify(volunteersArr));
          loadData();
        }
      }
    ]);
  };

  const renderEditModal = () => {
    if (editEvent) {
      return (
        <Modal visible={showEditModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select New Category</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {editCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryItem}
                    onPress={() => handleSelectCategory(cat)}
                  >
                    <Text style={styles.categoryText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }
    if (editPending) {
      return (
        <Modal visible={true} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select New Category</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {editPending.categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={styles.categoryItem}
                    onPress={() => handleEditPendingCategory(editPending.pendingId, cat)}
                  >
                    <Text style={styles.categoryText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditPending(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }
    return null;
  };

  // Sorting logic
  const getDisplayEvents = () => {
    if (!volunteer) return [];
    // Active: assignedEvents not in removedEvents and not canceled
    let activeEvents: DisplayEvent[] = events
      .filter(e =>
        volunteer.assignedEvents.includes(e.id) &&
        !(volunteer.removedEvents || []).includes(e.id) &&
        !e.canceled
      )
      .map((e) => ({
        ...e,
        status: 'active',
        category: positions[e.id],
      }));
    // Removed: assignedEvents in removedEvents
    let removedEvents: DisplayEvent[] = events
      .filter(e =>
        volunteer.assignedEvents.includes(e.id) &&
        (volunteer.removedEvents || []).includes(e.id)
      )
      .map((e) => ({
        ...e,
        status: 'removed',
        category: positions[e.id],
      }));
    // Cancelled: assignedEvents not removed, but canceled
    let cancelledEvents: DisplayEvent[] = events
      .filter(e =>
        volunteer.assignedEvents.includes(e.id) &&
        !((volunteer.removedEvents || []).includes(e.id)) &&
        e.canceled
      )
      .map((e) => ({
        ...e,
        status: 'cancelled',
        category: positions[e.id],
      }));
    // Pending events (unchanged)
    let pendingEvents: DisplayEvent[] = pending.map((p) => {
      const eventObj = allEvents.find(e => e.id === p.eventId);
      return {
        id: p.eventId,
        title: p.eventTitle,
        date: eventObj?.date || '',
        time: eventObj?.time || '',
        location: eventObj?.location || '',
        coverPhoto: eventObj?.coverPhoto,
        description: eventObj?.description || '',
        volunteerCategories: eventObj?.volunteerCategories || [],
        canceled: eventObj?.canceled || false,
        tags: eventObj?.tags || [],
        status: 'pending',
        category: p.position,
        pendingId: p.id,
      };
    });
    if (sortStatus === 'active') return activeEvents;
    if (sortStatus === 'pending') return pendingEvents;
    if (sortStatus === 'removed') return removedEvents;
    if (sortStatus === 'cancelled') return cancelledEvents;
    return [...activeEvents, ...pendingEvents, ...removedEvents, ...cancelledEvents];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.container}>
        <Text style={styles.title}>My Registered Events</Text>
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortButton, sortStatus === 'all' && styles.sortButtonActive]}
            onPress={() => setSortStatus('all')}
          >
            <Text style={styles.sortButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortStatus === 'active' && styles.sortButtonActive]}
            onPress={() => setSortStatus('active')}
          >
            <Text style={styles.sortButtonText}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortStatus === 'pending' && styles.sortButtonActive]}
            onPress={() => setSortStatus('pending')}
          >
            <Text style={styles.sortButtonText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortStatus === 'removed' && styles.sortButtonActive]}
            onPress={() => setSortStatus('removed')}
          >
            <Text style={styles.sortButtonText}>Removed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortStatus === 'cancelled' && styles.sortButtonActive]}
            onPress={() => setSortStatus('cancelled')}
          >
            <Text style={styles.sortButtonText}>Cancelled</Text>
          </TouchableOpacity>
        </View>
        {getDisplayEvents().length === 0 ? (
          <Text style={styles.emptyText}>You have no {sortStatus === 'all' ? '' : sortStatus} events.</Text>
        ) : (
          <FlatList
            data={getDisplayEvents()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: DisplayEvent }) => (
              <View style={styles.card}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag: string) => (
                      <View key={tag} style={styles.tagBadgeSmall}>
                        <Text style={styles.tagTextSmall}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {item.date ? <Text>Date: {item.date}</Text> : null}
                {item.time ? <Text>Time: {item.time}</Text> : null}
                {item.location ? <Text>Location: {item.location}</Text> : null}
                {item.description ? <Text>Description: {item.description}</Text> : null}
                {item.status === 'removed' && (
                  <Text style={{ color: '#ff6b6b', fontWeight: 'bold', fontStyle: 'italic', marginTop: 8 }}>Removed from event by admin</Text>
                )}
                {item.status === 'cancelled' && (
                  <Text style={{ color: '#888', fontWeight: 'bold', fontStyle: 'italic', marginTop: 8 }}>Event Cancelled</Text>
                )}
                <Text style={styles.positionText}>Category: {item.category}</Text>
                <Text style={styles.statusText}>Status: {item.status === 'active' ? 'Approved' : item.status === 'removed' ? 'Removed' : item.status === 'cancelled' ? 'Cancelled' : 'Pending'}</Text>
                {item.status === 'active' && (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditCategory(item)}>
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveRegistration(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {item.status === 'pending' && (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.editButton} onPress={() => {
                      // Find the event in allEvents to get all categories
                      const eventObj = allEvents.find(e => e.id === item.id);
                      setEditPending({
                        pendingId: item.pendingId,
                        category: item.category,
                        categories: eventObj ? eventObj.volunteerCategories : [item.category],
                      });
                    }}>
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleCancelPending(item.pendingId)}>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={{ marginTop: 20 }}
          />
        )}
        {renderEditModal()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  card: {
    backgroundColor: '#EFEFEF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  eventTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  positionText: { marginVertical: 8, color: '#62A0A5', fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#62A0A5',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  emptyText: { textAlign: 'center', color: '#888', fontSize: 16, marginTop: 20 },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingBottom: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    minHeight: 200,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  categoryText: { fontSize: 16 },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '500' },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 10,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  sortButtonActive: {
    backgroundColor: '#62A0A5',
  },
  sortButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  statusText: {
    marginTop: 5,
    color: '#888',
    fontWeight: 'bold',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  tagBadgeSmall: {
    backgroundColor: '#62A0A5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  tagTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 