import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, Dimensions, Animated, Easing, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import HeaderBanner from '../components/HeaderBanner';
import UnifiedEventCard from '../components/UnifiedEventCard';

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

type SelectedEventVolunteers = {
  eventId: string;
  volunteers: Volunteer[];
};

export default function CancelledEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [activeTab, setActiveTab] = useState<'cancelled' | 'full'>('cancelled');
  const [selectedEventVolunteers, setSelectedEventVolunteers] = useState<SelectedEventVolunteers | null>(null);
  const navigation = useNavigation();
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: activeTab === 'cancelled' ? 0 : 1,
      duration: 220,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      const storedEvents = await AsyncStorage.getItem('events');
      const storedVolunteers = await AsyncStorage.getItem('volunteers');
      let parsedEvents = storedEvents ? JSON.parse(storedEvents) : [];
      if (storedVolunteers) {
        const volunteers = JSON.parse(storedVolunteers);
        parsedEvents = parsedEvents.map((event: any) => {
          const eventVolunteers = volunteers.filter((v: any) =>
            v.assignedEvents && v.assignedEvents.includes(event.id)
          );
          return {
            ...event,
            currentVolunteers: eventVolunteers.length,
          };
        });
      }
      setEvents(parsedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleImageError = (eventId: string) => {
    setImageErrors((prev) => new Set(prev).add(eventId));
  };

  const loadEventVolunteers = async (eventId: string) => {
    try {
      const storedVolunteers = await AsyncStorage.getItem('volunteers');
      if (storedVolunteers) {
        const volunteers: Volunteer[] = JSON.parse(storedVolunteers);
        const eventVolunteers = volunteers.filter(v => 
          v.assignedEvents && v.assignedEvents.includes(eventId)
        );
        setSelectedEventVolunteers({
          eventId,
          volunteers: eventVolunteers
        });
      }
    } catch (error) {
      console.error('Error loading volunteers:', error);
    }
  };

  const filteredEvents: Event[] = events.filter((e: Event) => {
    if (activeTab === 'cancelled') return e.canceled;
    // Full slot: not canceled, maxVolunteers > 0, and currentVolunteers >= maxVolunteers
    return (
      !e.canceled &&
      typeof e.maxVolunteers === 'number' &&
      e.maxVolunteers > 0 &&
      typeof e.currentVolunteers === 'number' &&
      e.currentVolunteers >= e.maxVolunteers
    );
  });

  // Sort full slot events by id descending (newest first)
  const sortedEvents: Event[] = activeTab === 'full'
    ? [...filteredEvents].sort((a, b) => Number(b.id) - Number(a.id))
    : filteredEvents;

  const renderEventItem = ({ item }: { item: Event }) => (
    <View style={{ position: 'relative' }}>
      <UnifiedEventCard
        title={item.title}
        date={item.date}
        time={item.time}
        location={item.location}
        description={item.description}
        tags={item.tags}
        coverPhoto={item.coverPhoto}
        imageError={imageErrors.has(item.id)}
        onImageError={() => handleImageError(item.id)}
        volunteerCount={item.currentVolunteers}
        maxVolunteers={item.maxVolunteers}
        showVolunteerCount={activeTab === 'full'}
        canceled={item.canceled}
        showFullSlot={!item.canceled && (item.currentVolunteers ?? 0) >= (item.maxVolunteers ?? 0)}
      />
      {activeTab === 'full' && (
        <View style={styles.actionButtonsRow}>
          <View style={[styles.singleActionButtonContainer, styles.firstActionButton]}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('AdminTabs', { screen: 'ManageEvents', params: { event: item } })}
            >
              <Ionicons name="create-outline" size={24} color="#7F4701" />
            </TouchableOpacity>
          </View>
          <View style={styles.singleActionButtonContainer}>
            <TouchableOpacity
              style={styles.volunteersButton}
              onPress={() => loadEventVolunteers(item.id)}
            >
              <Ionicons name="people-outline" size={24} color="#7F4701" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>Cancelled & Full Events</Text>
        <Text style={styles.bannerSubtitle}>View events that are cancelled or have filled volunteer slots</Text>
      </View>
      <View style={styles.bannerDivider} />
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cancelled' ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'cancelled' ? styles.activeTabText : styles.inactiveTabText]}>Cancelled Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'full' ? styles.activeTab : styles.inactiveTab]}
            onPress={() => setActiveTab('full')}
          >
            <Text style={[styles.tabText, activeTab === 'full' ? styles.activeTabText : styles.inactiveTabText]}>Full Volunteer Slots</Text>
          </TouchableOpacity>
        </View>
        {sortedEvents.length === 0 ? (
          <Text style={styles.emptyText}>
            {activeTab === 'cancelled' ? 'No cancelled events.' : 'No full slot events.'}
          </Text>
        ) : (
          <FlatList
            data={sortedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Volunteer List Modal */}
        <Modal
          visible={selectedEventVolunteers !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedEventVolunteers(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Registered Volunteers</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedEventVolunteers(null)}
                >
                  <Ionicons name="close" size={24} color="#7F4701" />
                </TouchableOpacity>
              </View>
              {selectedEventVolunteers?.volunteers.length === 0 ? (
                <Text style={styles.noVolunteersText}>No volunteers registered for this event.</Text>
              ) : (
                <FlatList
                  data={selectedEventVolunteers?.volunteers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.volunteerItem}>
                      <Text style={styles.volunteerName}>{item.name}</Text>
                      <Text style={styles.volunteerEmail}>{item.email}</Text>
                      {item.positions?.[selectedEventVolunteers?.eventId || ''] && (
                        <Text style={styles.volunteerPosition}>
                          Position: {item.positions[selectedEventVolunteers?.eventId || '']}
                        </Text>
                      )}
                    </View>
                  )}
                  contentContainerStyle={styles.volunteerList}
                />
              )}
            </View>
          </View>
        </Modal>
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
    width: '100%',
    alignSelf: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#7F4701',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    paddingVertical: 10,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginHorizontal: 2,
    borderWidth: 2,
    borderColor: '#7F4701',
  },
  activeTab: {
    backgroundColor: '#62A0A5',
    borderColor: '#62A0A5',
    zIndex: 2,
  },
  inactiveTab: {
    backgroundColor: '#FFF1C7',
    borderColor: '#7F4701',
    zIndex: 1,
  },
  tabText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTabText: {
    color: '#FFF1C7',
  },
  inactiveTabText: {
    color: '#7F4701',
  },
  eventsList: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#7F4701',
    fontSize: 16,
    marginTop: 20,
  },
  actionButtonsRow: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  singleActionButtonContainer: {
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  firstActionButton: {
    marginRight: 8,
  },
  editButton: {
    backgroundColor: '#FFF1C7',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7F4701',
  },
  volunteersButton: {
    backgroundColor: '#FFF1C7',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7F4701',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#7BB1B7',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 3,
    borderColor: '#7F4701',
    padding: 24,
    maxHeight: '80%',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
  },
  modalCloseButton: {
    padding: 4,
  },
  volunteerList: {
    paddingBottom: 20,
  },
  volunteerItem: {
    backgroundColor: '#FFF1C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#7F4701',
  },
  volunteerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 4,
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#7F4701',
    marginBottom: 4,
  },
  volunteerPosition: {
    fontSize: 14,
    color: '#7F4701',
    fontStyle: 'italic',
  },
  noVolunteersText: {
    textAlign: 'center',
    color: '#FFF1C7',
    fontSize: 16,
    marginTop: 20,
  },
}); 