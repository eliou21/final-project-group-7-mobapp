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
  Animated,
  Easing,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import HeaderBanner from '../components/HeaderBanner';

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  volunteerCategories: string[];
  canceled?: boolean;
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
  positions?: { [eventId: string]: string }; // Map of eventId to position
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
  position: string;
};

export default function ManageVolunteersScreen() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editPositionModal, setEditPositionModal] = useState<{ volunteer: Volunteer; eventId: string; positions: string[] } | null>(null);
  const [selectedEditPosition, setSelectedEditPosition] = useState<string>('');
  const tabAnim = React.useRef(new Animated.Value(0)).current;

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

  // Animate tab indicator on tab change
  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: viewMode === 'all' ? 0 : viewMode === 'pending' ? 1 : 2,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [viewMode]);

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
        // If we have users data, add profile pictures and phone numbers to volunteers
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const volunteersWithPictures = parsedVolunteers.map((volunteer: Volunteer) => {
            const matchingUser = users.find((user: any) => user.email === volunteer.email);
            return {
              ...volunteer,
              profilePicture: matchingUser?.profilePicture || '',
              phone: matchingUser?.phone || volunteer.phone || '',
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
    <View style={styles.card} key={item.id}>
      <View style={styles.cardAccent} />
      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => { setSelectedVolunteer(item); setShowHistoryModal(true); }}>
            {item.profilePicture ? (
              <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
            ) : (
              <View style={[styles.profilePicture, styles.placeholderImage]}>
                <Ionicons name="person" size={30} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <TouchableOpacity onPress={() => { setSelectedVolunteer(item); setShowHistoryModal(true); }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </TouchableOpacity>
            <View style={styles.cardInfoRow}>
              <Ionicons name="mail" size={16} style={styles.cardInfoIcon} />
              <Text style={styles.cardInfoText}>{item.email}</Text>
            </View>
            <View style={styles.cardInfoRow}>
              <Ionicons name="call" size={16} style={styles.cardInfoIcon} />
              <Text style={styles.cardInfoText}>{item.phone}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.actionColumn}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#62A0A5', borderColor: '#62A0A5' }]}
            onPress={() => { setSelectedVolunteer(item); setShowHistoryModal(true); }}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>View Volunteer History</Text>
          </TouchableOpacity>
        </View>
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
        // Update existing volunteer's assigned events and positions
        const updatedVolunteers = volunteers.map(v => 
          v.id === existingVolunteer.id 
            ? { 
                ...v, 
                assignedEvents: [...v.assignedEvents, pendingVolunteer.eventId],
                positions: {
                  ...v.positions,
                  [pendingVolunteer.eventId]: pendingVolunteer.position
                }
              }
            : v
        );
        await AsyncStorage.setItem('volunteers', JSON.stringify(updatedVolunteers));
        setVolunteers(updatedVolunteers);
      } else {
        // Create new volunteer with position
        const newVolunteer: Volunteer = {
          id: Date.now().toString(),
          name: pendingVolunteer.volunteerName,
          email: pendingVolunteer.volunteerEmail,
          phone: '', // You might want to get this from user data
          assignedEvents: [pendingVolunteer.eventId],
          status: 'active',
          profilePicture,
          positions: {
            [pendingVolunteer.eventId]: pendingVolunteer.position
          }
        };
        const updatedVolunteers = [...volunteers, newVolunteer];
        await AsyncStorage.setItem('volunteers', JSON.stringify(updatedVolunteers));
        setVolunteers(updatedVolunteers);
      }

      Alert.alert('Success', 'Volunteer has been approved!');
    } catch (error) {
      console.error('Error approving volunteer:', error);
      Alert.alert('Error', 'Failed to approve volunteer');
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

  const handleRemoveVolunteerFromEvent = async (volunteer: Volunteer, eventId: string) => {
    Alert.alert(
      'Remove Volunteer from Event',
      `Are you sure you want to remove this volunteer from the event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive', onPress: async () => {
            // Add eventId to removedEvents
            const updatedRemoved = Array.from(new Set([...(volunteer.removedEvents || []), eventId]));
            // Optionally, remove position for this event
            const updatedPositions = { ...volunteer.positions };
            if (updatedPositions) delete updatedPositions[eventId];
            // Update in AsyncStorage
            const storedVolunteers = await AsyncStorage.getItem('volunteers');
            let volunteersArr: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
            volunteersArr = volunteersArr.map(v =>
              v.id === volunteer.id
                ? { ...v, removedEvents: updatedRemoved, positions: updatedPositions }
                : v
            );
            await AsyncStorage.setItem('volunteers', JSON.stringify(volunteersArr));
            setVolunteers(volunteersArr);
            // If editing self, update selectedVolunteer
            if (selectedVolunteer && selectedVolunteer.id === volunteer.id) {
              setSelectedVolunteer({ ...volunteer, removedEvents: updatedRemoved, positions: updatedPositions });
            }
          }
        }
      ]
    );
  };

  const handleEditVolunteerPosition = (volunteer: Volunteer, eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    setEditPositionModal({
      volunteer,
      eventId,
      positions: event.volunteerCategories || [],
    });
    setSelectedEditPosition(volunteer.positions?.[eventId] || '');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>Manage Volunteers</Text>
        <Text style={styles.bannerSubtitle}>View, approve, and manage volunteers</Text>
      </View>
      <View style={styles.bannerDivider} />
      {/* Tab Label directly under the divider, above the tab buttons */}
      {viewMode === 'all' && (
        <Text style={[styles.sectionTitle, styles.tabLabel]}>All Volunteers</Text>
      )}
      {viewMode === 'pending' && (
        <Text style={[styles.sectionTitle, styles.tabLabel]}>Pending Volunteer Requests</Text>
      )}
      {viewMode === 'approved' && (
        <Text style={[styles.sectionTitle, styles.tabLabel]}>Approved Volunteers</Text>
      )}
      <View style={styles.container}>
        {/* Animated Tab Bar */}
        <View style={styles.tabBar}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: tabAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['2%', '34%', '66%'],
                }),
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.tab, viewMode === 'all' && styles.activeTab]}
            onPress={() => setViewMode('all')}
          >
            <Text style={[styles.tabText, viewMode === 'all' && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'pending' && styles.activeTab]}
            onPress={() => setViewMode('pending')}
          >
            <Text style={[styles.tabText, viewMode === 'pending' && styles.activeTabText]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'approved' && styles.activeTab]}
            onPress={() => setViewMode('approved')}
          >
            <Text style={[styles.tabText, viewMode === 'approved' && styles.activeTabText]}>Approved</Text>
          </TouchableOpacity>
        </View>
        {/* Pending Volunteers Section */}
        {viewMode === 'all' && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {[
              ...pendingVolunteers
                .filter(v => v.status === 'pending')
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(volunteer => (
                  <View key={volunteer.id} style={styles.card}>
                    <View style={styles.cardAccent} />
                    <View style={styles.cardContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        {volunteer.profilePicture ? (
                          <Image source={{ uri: volunteer.profilePicture }} style={styles.profilePicture} />
                        ) : (
                          <View style={[styles.profilePicture, styles.placeholderImage]}>
                            <Ionicons name="person" size={30} color="#ccc" />
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.cardTitle}>{volunteer.volunteerName}</Text>
                          <View style={styles.cardInfoRow}>
                            <Ionicons name="mail" size={16} style={styles.cardInfoIcon} />
                            <Text style={styles.cardInfoText}>{volunteer.volunteerEmail}</Text>
                          </View>
                          <View style={styles.cardInfoRow}>
                            <Ionicons name="calendar" size={16} style={styles.cardInfoIcon} />
                            <Text style={styles.cardInfoText}>{volunteer.eventTitle}</Text>
                          </View>
                          <View style={styles.cardInfoRow}>
                            <Ionicons name="briefcase" size={16} style={styles.cardInfoIcon} />
                            <Text style={styles.cardInfoText}>{volunteer.position}</Text>
                          </View>
                          <Text style={styles.timestamp}>
                            Requested: {new Date(volunteer.timestamp).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.actionColumn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }]}> 
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: '#62A0A5', borderColor: '#62A0A5' }]}
                          onPress={() => handleApproveVolunteer(volunteer)}
                        >
                          <Text style={[styles.buttonText, { color: '#fff' }]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, styles.deleteButton]}
                          onPress={() => handleRejectVolunteer(volunteer)}
                        >
                          <Text style={styles.buttonText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )),
              ...volunteers
                .slice()
                .sort((a, b) => Number(b.id) - Number(a.id))
                .map(item => renderItem({ item })),
            ]}
            {pendingVolunteers.filter(v => v.status === 'pending').length === 0 && volunteers.length === 0 && (
              <Text style={styles.emptyText}>No volunteers to display.</Text>
            )}
          </ScrollView>
        )}
        {viewMode === 'pending' && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {pendingVolunteers
              .filter(v => v.status === 'pending')
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(volunteer => (
                <View key={volunteer.id} style={styles.card}>
                  <View style={styles.cardAccent} />
                  <View style={styles.cardContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      {volunteer.profilePicture ? (
                        <Image source={{ uri: volunteer.profilePicture }} style={styles.profilePicture} />
                      ) : (
                        <View style={[styles.profilePicture, styles.placeholderImage]}>
                          <Ionicons name="person" size={30} color="#ccc" />
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cardTitle}>{volunteer.volunteerName}</Text>
                        <View style={styles.cardInfoRow}>
                          <Ionicons name="mail" size={16} style={styles.cardInfoIcon} />
                          <Text style={styles.cardInfoText}>{volunteer.volunteerEmail}</Text>
                        </View>
                        <View style={styles.cardInfoRow}>
                          <Ionicons name="calendar" size={16} style={styles.cardInfoIcon} />
                          <Text style={styles.cardInfoText}>{volunteer.eventTitle}</Text>
                        </View>
                        <View style={styles.cardInfoRow}>
                          <Ionicons name="briefcase" size={16} style={styles.cardInfoIcon} />
                          <Text style={styles.cardInfoText}>{volunteer.position}</Text>
                        </View>
                        <Text style={styles.timestamp}>
                          Requested: {new Date(volunteer.timestamp).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.actionColumn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }]}> 
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#62A0A5', borderColor: '#62A0A5' }]}
                        onPress={() => handleApproveVolunteer(volunteer)}
                      >
                        <Text style={[styles.buttonText, { color: '#fff' }]}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.deleteButton]}
                        onPress={() => handleRejectVolunteer(volunteer)}
                      >
                        <Text style={styles.buttonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            {pendingVolunteers.filter(v => v.status === 'pending').length === 0 && (
              <Text style={styles.emptyText}>No pending volunteer requests.</Text>
            )}
          </ScrollView>
        )}
        {viewMode === 'approved' && (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            {volunteers
              .slice()
              .sort((a, b) => Number(b.id) - Number(a.id))
              .map(item => renderItem({ item }))}
            {volunteers.length === 0 && (
              <Text style={styles.emptyText}>No approved volunteers to display.</Text>
            )}
          </ScrollView>
        )}
      </View>
      {/* Volunteer History Modal */}
      <Modal
        visible={showHistoryModal && !!selectedVolunteer}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowHistoryModal(false); setSelectedVolunteer(null); }}
      >
        <View style={styles.modalOverlay}>
          {selectedVolunteer && (
            <View style={styles.profileModalCard}>
              <TouchableOpacity style={styles.closeIconButton} onPress={() => { setShowHistoryModal(false); setSelectedVolunteer(null); }}>
                <Ionicons name="close" size={28} color="#62A0A5" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Volunteer Profile</Text>
              {selectedVolunteer.profilePicture ? (
                <Image source={{ uri: selectedVolunteer.profilePicture }} style={styles.modalProfilePicture} />
              ) : (
                <View style={[styles.modalProfilePicture, styles.placeholderImage]}>
                  <Ionicons name="person" size={50} color="#ccc" />
                </View>
              )}
              <Text style={styles.modalName}>{selectedVolunteer.name}</Text>
              <Text style={styles.modalEmail}>{selectedVolunteer.email}</Text>
              <Text style={styles.modalPhone}>{selectedVolunteer.phone}</Text>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Events Volunteered For</Text>
              {selectedVolunteer.assignedEvents.length === 0 ? (
                <Text style={styles.noEventsText}>No volunteer records found.</Text>
              ) : (
                selectedVolunteer.assignedEvents.map((eventId, idx, arr) => {
                  const event = events.find(e => e.id === eventId);
                  if (!event) return null;
                  const isRemoved = selectedVolunteer.removedEvents && selectedVolunteer.removedEvents.includes(eventId);
                  const isCancelled = event.canceled;
                  return (
                    <React.Fragment key={eventId}>
                      <View style={[styles.profileEventRow, isRemoved || isCancelled ? { opacity: 0.6 } : null]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.profileEventTitle}>{event.title} <Text style={styles.profileEventDate}>({event.date})</Text></Text>
                          {selectedVolunteer.positions?.[eventId] && !isRemoved && !isCancelled && (
                            <Text style={styles.profileEventPosition}>Position: {selectedVolunteer.positions[eventId]}</Text>
                          )}
                          {isRemoved && (
                            <Text style={{ color: '#ff6b6b', fontStyle: 'italic', fontWeight: 'bold', marginTop: 2 }}>Removed from event by admin</Text>
                          )}
                          {isCancelled && (
                            <Text style={{ color: '#888', fontStyle: 'italic', fontWeight: 'bold', marginTop: 2 }}>Event Cancelled</Text>
                          )}
                        </View>
                        {/* Edit and Trash buttons aligned right */}
                        {!isRemoved && !isCancelled && (
                          <View style={[styles.profileEventActions, { flexDirection: 'row', gap: 8, marginLeft: 'auto' }]}> 
                            <TouchableOpacity
                              style={styles.profileEventIconBtn}
                              onPress={() => {
                                setShowHistoryModal(false);
                                setTimeout(() => handleEditVolunteerPosition(selectedVolunteer, eventId), 300);
                              }}
                            >
                              <Ionicons name="create-outline" size={22} color="#62A0A5" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.profileEventIconBtn}
                              onPress={() => handleRemoveVolunteerFromEvent(selectedVolunteer, eventId)}
                            >
                              <Ionicons name="trash" size={22} color="#ff6b6b" />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      {idx < arr.length - 1 && <View style={styles.profileEventDivider} />}
                    </React.Fragment>
                  );
                })
              )}
            </View>
          )}
        </View>
      </Modal>
      {/* Edit Position Modal */}
      <Modal
        visible={!!editPositionModal}
        transparent
        animationType="slide"
        onRequestClose={() => { setEditPositionModal(null); setSelectedEditPosition(''); }}
      >
        <View style={styles.modalOverlay}>
          {editPositionModal && (
            <View style={[styles.profileModalCard, { backgroundColor: '#7BB1B7' }]}>
              <Text style={[styles.modalTitle, { color: '#FFF1C7' }]}>Edit Position</Text>
              <Text style={{ color: '#FFF1C7', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                {editPositionModal.volunteer.name}
              </Text>
              <Text style={{ color: '#FFF1C7', marginBottom: 10, textAlign: 'center' }}>
                {getEventTitle(editPositionModal.eventId)}
              </Text>
              <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                {editPositionModal.positions.map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.profileEventRow,
                      selectedEditPosition === pos && { backgroundColor: 'rgb(113, 165, 174)', borderRadius: 10 }
                    ]}
                    onPress={() => setSelectedEditPosition(pos)}
                  >
                    <Text style={[
                      styles.profileEventTitle,
                      { color: '#FFF1C7' },
                      selectedEditPosition === pos && { color: '#fff', fontWeight: 'bold' }
                    ]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#ff6b6b', flex: 1 }]}
                  onPress={() => { setEditPositionModal(null); setSelectedEditPosition(''); }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: '#7AA47D', flex: 1 }]}
                  onPress={async () => {
                    if (!selectedEditPosition) return;
                    // Update volunteer's position for this event
                    const storedVolunteers = await AsyncStorage.getItem('volunteers');
                    let volunteersArr: Volunteer[] = storedVolunteers ? JSON.parse(storedVolunteers) : [];
                    volunteersArr = volunteersArr.map(v =>
                      v.id === editPositionModal.volunteer.id
                        ? {
                            ...v,
                            positions: {
                              ...v.positions,
                              [editPositionModal.eventId]: selectedEditPosition,
                            },
                          }
                        : v
                    );
                    await AsyncStorage.setItem('volunteers', JSON.stringify(volunteersArr));
                    // Reload volunteers from AsyncStorage to ensure UI is in sync
                    const reloaded = await AsyncStorage.getItem('volunteers');
                    setVolunteers(reloaded ? JSON.parse(reloaded) : []);
                    // Update selectedVolunteer if needed
                    if (selectedVolunteer && selectedVolunteer.id === editPositionModal.volunteer.id) {
                      setSelectedVolunteer({
                        ...editPositionModal.volunteer,
                        positions: {
                          ...editPositionModal.volunteer.positions,
                          [editPositionModal.eventId]: selectedEditPosition,
                        },
                      });
                    }
                    setEditPositionModal(null);
                    setSelectedEditPosition('');
                    Alert.alert('Success', 'Volunteer position updated!');
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFEAB8' },
  container: { 
    flex: 1, 
    padding: 20,
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
    width: '90%',
    alignSelf: 'center',
    marginBottom: 10,
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
    color: '#7F4701',
    marginTop: 10,
  },
  volunteersList: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderColor: '#7F4701',
    borderWidth: 3,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    padding: 0,
    overflow: 'hidden',
    flexDirection: 'column',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: '#FEBD6B',
    borderTopLeftRadius: 19,
    borderBottomLeftRadius: 19,
  },
  cardContent: {
    padding: 18,
    paddingLeft: 28,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 2,
  },
  cardDivider: {
    height: 2,
    backgroundColor: '#7F4701',
    marginVertical: 10,
    borderRadius: 1,
    width: '100%',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardInfoIcon: {
    marginRight: 6,
    color: '#7F4701',
  },
  cardInfoText: {
    fontSize: 15,
    color: '#7F4701',
    fontWeight: '500',
  },
  positionPill: {
    backgroundColor: '#62A0A5',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: 10,
    marginBottom: 2,
  },
  positionPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
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
  eventItemContainer: {
    marginBottom: 8,
  },
  eventItem: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  pendingVolunteerCard: {
    backgroundColor: '#fff',
    borderRadius: 25,
    borderColor: '#7F4701',
    borderWidth: 3,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    padding: 18,
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
  positionText: {
    color: '#62A0A5',
    fontSize: 14,
    marginLeft: 20,
    marginTop: 2,
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
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
    backgroundColor: '#FFF1C7',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 0,
    borderWidth: 2,
    borderColor: '#7F4701',
    minWidth: 0,
    alignSelf: 'center',
    marginVertical: 4,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    paddingHorizontal: 2,
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
    width: '32%',
    height: 40,
    backgroundColor: '#FEBD6B',
    borderRadius: 20,
    zIndex: 0,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  historyModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#7F4701',
  },
  modalProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#7F4701',
  },
  modalEmail: {
    fontSize: 15,
    color: 'rgb(133, 104, 69)',
    marginBottom: 2,
  },
  modalPhone: {
    fontSize: 15,
    color: 'rgb(133, 104, 69)',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#62A0A5',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  actionColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    marginTop: 6,
  },
  closeIconButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  profileModalCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderColor: '#7F4701',
    borderWidth: 3,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  profileEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
    gap: 0,
  },
  profileEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 2,
  },
  profileEventDate: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'normal',
  },
  profileEventPosition: {
    fontSize: 14,
    color: '#62A0A5',
    marginTop: 2,
  },
  profileEventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  profileEventIconBtn: {
    padding: 6,
    borderRadius: 16,
    marginLeft: 2,
  },
  profileEventDivider: {
    height: 2,
    backgroundColor: '#7F4701',
    borderRadius: 1,
    width: '100%',
    marginVertical: 2,
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 400,
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
  selectedCategoryItem: {
    backgroundColor: 'rgb(113, 165, 174)',
    borderRadius: 10,
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
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
  editButton: {
    backgroundColor: '#FFF1C7',
    borderRadius: 16,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 0,
    borderWidth: 2,
    borderColor: '#7F4701',
    minWidth: 0,
    alignSelf: 'center',
    marginVertical: 4,
  },
});
