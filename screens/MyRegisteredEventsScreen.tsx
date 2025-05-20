import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView, SafeAreaView, Image, Animated, Easing } from 'react-native';
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
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'removed' | 'cancelled'>('active');
  const [editPending, setEditPending] = useState<{ pendingId: string; category: string; categories: string[] } | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [tabAnim] = useState(new Animated.Value(0));
  const [selectedEditCategory, setSelectedEditCategory] = useState<string | null>(null);
  const [selectedEditPendingCategory, setSelectedEditPendingCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  // Animate tab indicator on tab change
  useEffect(() => {
    let idx = 0;
    switch (activeTab) {
      case 'active': idx = 0; break;
      case 'pending': idx = 1; break;
      case 'removed': idx = 2; break;
      case 'cancelled': idx = 3; break;
    }
    Animated.timing(tabAnim, {
      toValue: idx,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

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
              <Text style={styles.modalTitle}>Select New Position</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {editCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      (selectedEditCategory ?? positions[editEvent.id]) === cat && styles.selectedCategoryItem
                    ]}
                    onPress={() => setSelectedEditCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryText,
                      (selectedEditCategory ?? positions[editEvent.id]) === cat && styles.selectedCategoryText
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.cancelButtonCustom, { flex: 1 }]}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditEvent(null);
                    setSelectedEditCategory(null);
                  }}
                >
                  <Text style={styles.cancelButtonTextCustom}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.changeButtonCustom, { flex: 1, }]}
                  disabled={!selectedEditCategory || selectedEditCategory === positions[editEvent.id]}
                  onPress={async () => {
                    if (selectedEditCategory && selectedEditCategory !== positions[editEvent.id]) {
                      await handleSelectCategory(selectedEditCategory);
                      setSelectedEditCategory(null);
                    }
                  }}
                >
                  <Text style={styles.changeButtonTextCustom}>Change</Text>
                </TouchableOpacity>
              </View>
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
              <Text style={styles.modalTitle}>Select New Position</Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {editPending.categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      (selectedEditPendingCategory ?? editPending.category) === cat && styles.selectedCategoryItem
                    ]}
                    onPress={() => setSelectedEditPendingCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryText,
                      (selectedEditPendingCategory ?? editPending.category) === cat && styles.selectedCategoryText
                    ]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.cancelButtonCustom, { flex: 1 }]}
                  onPress={() => {
                    setEditPending(null);
                    setSelectedEditPendingCategory(null);
                  }}
                >
                  <Text style={styles.cancelButtonTextCustom}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.changeButtonCustom, { flex: 1, opacity: selectedEditPendingCategory && selectedEditPendingCategory !== editPending.category ? 1 : 0.5 }]}
                  disabled={!selectedEditPendingCategory || selectedEditPendingCategory === editPending.category}
                  onPress={async () => {
                    if (selectedEditPendingCategory && selectedEditPendingCategory !== editPending.category) {
                      await handleEditPendingCategory(editPending.pendingId, selectedEditPendingCategory);
                      setSelectedEditPendingCategory(null);
                    }
                  }}
                >
                  <Text style={styles.changeButtonTextCustom}>Change</Text>
                </TouchableOpacity>
              </View>
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
    if (activeTab === 'active') return activeEvents;
    if (activeTab === 'pending') return pendingEvents;
    if (activeTab === 'removed') return removedEvents;
    if (activeTab === 'cancelled') return cancelledEvents;
    return [...activeEvents, ...pendingEvents];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>My Registered Events</Text>
        <Text style={styles.bannerSubtitle}>View and manage your event registrations</Text>
      </View>
      <View style={styles.bannerDivider} />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'removed' && styles.activeTab]}
            onPress={() => setActiveTab('removed')}
          >
            <Text style={[styles.tabText, activeTab === 'removed' && styles.activeTabText]}>Removed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>Cancelled</Text>
          </TouchableOpacity>
        </View>
        {getDisplayEvents().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>You have no {activeTab} events.</Text>
          </View>
        ) : (
          <FlatList
            data={getDisplayEvents()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: DisplayEvent }) => (
              <View style={styles.card}>
                {item.coverPhoto && (
                  <Image source={{ uri: item.coverPhoto }} style={styles.coverPhoto} />
                )}
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.tags && item.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {item.tags.map((tag: string) => (
                      <View key={tag} style={styles.tagBadgeSmall}>
                        <Text style={styles.tagTextSmall}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#7F4701" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{item.date}</Text>
                </View>
                {item.time && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#7F4701" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{item.time}</Text>
                  </View>
                )}
                {item.location && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#7F4701" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{item.location}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Ionicons name="briefcase-outline" size={20} color="#7F4701" style={styles.infoIcon} />
                  <Text style={styles.infoText}>Position: {item.category}</Text>
                </View>
                {item.status === 'removed' && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Removed from event by admin</Text>
                  </View>
                )}
                {item.status === 'cancelled' && (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>Event Cancelled</Text>
                  </View>
                )}
                {item.status === 'active' && (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditCategory(item)}>
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Position</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveRegistration(item.id)}>
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Unregister</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {item.status === 'pending' && (
                  <View style={styles.row}>
                    <TouchableOpacity style={styles.editButton} onPress={() => {
                      const eventObj = allEvents.find(e => e.id === item.id);
                      setEditPending({
                        pendingId: item.pendingId,
                        category: item.category,
                        categories: eventObj ? eventObj.volunteerCategories : [item.category],
                      });
                    }}>
                      <Ionicons name="create-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Edit Position</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleCancelPending(item.pendingId)}>
                      <Ionicons name="close-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        )}
        {renderEditModal()}
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
  bannerDivider: {
    height: 3,
    backgroundColor: '#62A0A5',
    borderRadius: 2,
    width: '100%',
    alignSelf: 'center',
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
  card: {
    backgroundColor: 'rgb(255, 252, 236)',
    borderRadius: 25,
    borderColor: '#7F4701',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    padding: 22,
    marginBottom: 24,
  },
  coverPhoto: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    color: '#7F4701',
    fontSize: 15,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#62A0A5',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F4701',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagBadgeSmall: {
    backgroundColor: '#FEBD6B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    backgroundColor: '#FFF1C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  statusBadgeText: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#7BB1B7',
    padding: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 3,
    borderColor: '#7F4701',
    alignItems: 'center',
    minHeight: 200,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 20,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF1C7',
    width: '100%',
  },
  categoryText: {
    fontSize: 16,
    color: '#FFF1C7',
  },
  cancelButtonCustom: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 0,
  },
  cancelButtonTextCustom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  changeButtonCustom: {
    backgroundColor: '#7AA47D',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 0,
  },
  changeButtonTextCustom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedCategoryItem: {
    backgroundColor: 'rgb(113, 165, 174)',
    borderRadius: 10,
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 