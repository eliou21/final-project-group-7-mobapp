import React, { useState, useEffect } from 'react';
import { Platform, StatusBar, ScrollView, TextInput } from 'react-native';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Dimensions, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import HeaderBanner from '../components/HeaderBanner';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  assignedEvents: string[];
};

const TAG_OPTIONS = [
  'Environmental',
  'Animal',
  'Social Work',
  'Healthcare',
  'Blood Donation',
  'Sports',
  'Others',
];

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [selectedEventVolunteers, setSelectedEventVolunteers] = useState<{
    eventId: string;
    volunteers: Volunteer[];
  } | null>(null);
  const navigation: any = useNavigation();

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

  const handleCancelEvent = async (eventId: string) => {
    try {
      // Mark event as canceled in AsyncStorage
      const storedEvents = await AsyncStorage.getItem('events');
      if (storedEvents) {
        let eventsArr: Event[] = JSON.parse(storedEvents);
        eventsArr = eventsArr.map(e => e.id === eventId ? { ...e, canceled: true } : e);
        await AsyncStorage.setItem('events', JSON.stringify(eventsArr));
        loadEvents();
      }
      // Optionally, you could also notify volunteers here
    } catch (error) {
      console.error('Error canceling event:', error);
    }
  };

  const confirmCancelEvent = (eventId: string) => {
    // Show confirmation dialog
    // Only call handleCancelEvent if confirmed
    Alert.alert(
      'Cancel Event',
      'Are you sure you want to cancel this event? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => handleCancelEvent(eventId) },
      ]
    );
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
        showVolunteerCount={true}
        canceled={item.canceled}
        showCancelIcon={true}
        onCancelPress={() => !item.canceled && confirmCancelEvent(item.id)}
        cancelDisabled={item.canceled}
        showFullSlot={!item.canceled && (item.currentVolunteers ?? 0) >= (item.maxVolunteers ?? 0)}
      />
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('AdminTabs', { screen: 'ManageEvents', params: { event: item } })}
        >
          <Ionicons name="create-outline" size={24} color="#7F4701" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.volunteersButton}
          onPress={() => loadEventVolunteers(item.id)}
        >
          <Ionicons name="people-outline" size={24} color="#7F4701" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Filter events by search and tag
  const getFilteredEvents = () => {
    let filtered = events.filter(e => !e.canceled && (e.currentVolunteers ?? 0) < (e.maxVolunteers ?? 0));
    if (search.trim()) {
      filtered = filtered.filter(e => e.title.toLowerCase().includes(search.trim().toLowerCase()));
    }
    if (tagFilter.length > 0) {
      filtered = filtered.filter(e => tagFilter.every(tag => (e.tags ?? []).includes(tag)));
    }
    // Sort by id (timestamp) descending so newest is first
    filtered.sort((a, b) => Number(b.id) - Number(a.id));
    return filtered;
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
          <Text style={styles.title}>Welcome, Admin!</Text>
          <Text style={styles.subtitle}>Manage your events and volunteers</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.container}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search events by title..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
        {/* Tag Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterBar} contentContainerStyle={styles.tagFilterBarContent}>
          {TAG_OPTIONS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagBadge, tagFilter.includes(tag) && styles.tagBadgeSelected]}
              onPress={() => {
                if (tagFilter.includes(tag)) {
                  setTagFilter(tagFilter.filter(t => t !== tag));
                } else {
                  setTagFilter([...tagFilter, tag]);
                }
              }}
            >
              <Text style={[styles.tagText, tagFilter.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
          {tagFilter.length > 0 && (
            <TouchableOpacity style={styles.clearTagsButton} onPress={() => setTagFilter([])}>
              <Text style={styles.clearTagsText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        <View style={styles.eventsSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="hourglass" size={40} color="#62A0A5" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : getFilteredEvents().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No events scheduled</Text>
            </View>
          ) : (
            <FlatList
              data={getFilteredEvents()}
              keyExtractor={(item) => item.id}
              renderItem={renderEventItem}
              contentContainerStyle={{ paddingBottom: 0 }}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
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

      {/* Volunteer List Modal */}
      <Modal
        visible={!!selectedEventVolunteers}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedEventVolunteers(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.volunteerModalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>Registered Volunteers</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedEventVolunteers(null)}
                >
                  <Ionicons name="close" size={24} color="#7F4701" />
                </TouchableOpacity>
              </View>
            </View>
            
            {selectedEventVolunteers?.volunteers.length === 0 ? (
              <View style={styles.emptyVolunteersContainer}>
                <Ionicons name="people-outline" size={48} color="#ccc" />
                <Text style={styles.emptyVolunteersText}>No volunteers registered yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.volunteerList}>
                {selectedEventVolunteers?.volunteers.map((volunteer) => (
                  <View key={volunteer.id} style={styles.volunteerItem}>
                    <View style={styles.volunteerInfo}>
                      <Text style={styles.volunteerName}>{volunteer.name}</Text>
                      <Text style={styles.volunteerEmail}>{volunteer.email}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    minHeight: 0,
  },

  headerCard: {
    backgroundColor: '#62A0A5',
    borderRadius: 25,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 4,
  },
  
  subtitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },

  eventsSection: {
    flex: 1,
    paddingBottom: 0,
    minHeight: 0,
  },

  eventsList: {
    flexGrow: 1,
  },
  
  eventCard: {
    backgroundColor: 'rgb(252, 252, 252)',
    borderRadius: 25,
    borderColor: '#7F4701',
    marginBottom: 18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  eventImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  eventContent: {
    padding: 18,
  },

  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 10,
  },

  dividerLine: {
    height: 2,
    backgroundColor: '#7F4701',
    marginVertical: 6,
  },

  eventDate: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },

  eventTime: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
    gap: 8,
  },

  infoIcon: {
    marginRight: 6,
    color: '#7F4701',
  },

  eventLocation: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
  },

  eventDescription: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
    marginLeft: 3
  },

  volunteerCountBadge: {
    backgroundColor: 'rgb(252, 204, 145)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
    marginLeft: 8,
  },

  volunteerCountText: {
    color: '#7F4701',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },

  volunteerCountLabel: {
    color: '#7F4701',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
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

  cancelButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },

  cancelIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },

  cancelIconBg: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    borderWidth: 2,
    borderColor: '#7F4701',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
    marginTop: 15,
    backgroundColor: '#fff',
    color: '#333',
  },

  tagFilterBar: {
    marginBottom: 10,
    maxHeight: 44,
  },

  tagFilterBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 8,
  },

  tagBadge: {
    borderWidth: 2,
    backgroundColor: '#FEBD6B',
    borderRadius: 20,
    borderColor: '#7F4701',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 6,
    marginBottom: 4,
  },

  tagBadgeSelected: {
    backgroundColor: '#218686',
  },

  tagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  tagTextSelected: {
    color: '#fff',
  },

  divider: {
    height: 3,
    backgroundColor: '#62A0A5',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  canceledBadge: {
    backgroundColor: '#ffcccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  canceledBadgeText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 12,
  },

  clearTagsButton: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 8,
  },

  clearTagsText: {
    color: '#888',
    fontWeight: 'bold',
  },

  eventTagBadge: {
    backgroundColor: '#FEBD6B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },

  eventTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  closedBadge: {
    backgroundColor: '#ffe0e0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },

  closedBadgeText: {
    color: '#ff4444',
    fontWeight: 'bold',
    fontSize: 12,
  },

  volunteerCountOverlay: {
    position: 'absolute',
    top: 130,
    right: 10,
    zIndex: 2,
  },

  actionButtons: {
    position: 'absolute',
    top: 190,
    right: 15,
    flexDirection: 'row',
    gap: 8,
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

  volunteerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    marginTop: 'auto',
    marginBottom: 'auto',
  },

  modalHeader: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7F4701',
  },

  modalCloseButton: {
    padding: 4,
  },

  volunteerList: {
    maxHeight: '80%',
  },

  volunteerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  volunteerInfo: {
    flex: 1,
  },

  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  volunteerEmail: {
    fontSize: 14,
    color: '#666',
  },

  emptyVolunteersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  emptyVolunteersText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
