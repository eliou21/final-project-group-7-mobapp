import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert, Modal, TouchableOpacity, ScrollView } from 'react-native';

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
  volunteerCategories: string[];
};

type Registration = {
  eventId: string;
  position: string;
};

const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'Beach Cleanup',
    date: '2025-05-18',
    description: 'Join us to clean the local beach.',
    volunteerCategories: [
      'Logistics & Planning',
      'External Affairs/Outreach',
      'Safety & Security',
    ],
  },
  {
    id: '2',
    title: 'Food Drive',
    date: '2025-05-20',
    description: 'Help organize and distribute food donations.',
    volunteerCategories: [
      'Logistics & Planning',
      'Program & Activities',
      'Hospitality & Accomodation',
    ],
  },
];

export default function EventRegistrationScreen() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const handleRegister = (eventId: string) => {
    if (registrations.some(reg => reg.eventId === eventId)) {
      Alert.alert('Already Registered', 'You have already registered for this event.');
      return;
    }
    setSelectedEventId(eventId);
    setShowPositionModal(true);
  };

  const handlePositionSelect = (position: string) => {
    if (selectedEventId) {
      setRegistrations([...registrations, { eventId: selectedEventId, position }]);
      setShowPositionModal(false);
      setSelectedEventId(null);
      Alert.alert('Success', `You are registered for the event as ${position}!`);
    }
  };

  const getSelectedPosition = (eventId: string) => {
    const registration = registrations.find(reg => reg.eventId === eventId);
    return registration?.position;
  };

  const renderItem = ({ item }: { item: Event }) => {
    const selectedPosition = getSelectedPosition(item.id);
    const isRegistered = registrations.some(reg => reg.eventId === item.id);

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{item.title}</Text>
        <Text>Date: {item.date}</Text>
        <Text>{item.description}</Text>
        {selectedPosition && (
          <Text style={styles.positionText}>Selected Position: {selectedPosition}</Text>
        )}
        <Button
          title={isRegistered ? 'Registered' : 'Register'}
          disabled={isRegistered}
          onPress={() => handleRegister(item.id)}
        />
      </View>
    );
  };

  const renderPositionModal = () => {
    if (!selectedEventId) return null;
    
    const event = dummyEvents.find(e => e.id === selectedEventId);
    if (!event) return null;

    return (
      <Modal
        visible={showPositionModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Volunteer Position</Text>
            <ScrollView style={styles.positionsList}>
              {event.volunteerCategories.map((position) => (
                <TouchableOpacity
                  key={position}
                  style={styles.positionItem}
                  onPress={() => handlePositionSelect(position)}
                >
                  <Text style={styles.positionItemText}>{position}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button title="Cancel" onPress={() => setShowPositionModal(false)} />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Events</Text>
      <FlatList
        data={dummyEvents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      {renderPositionModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  list: { gap: 15 },
  card: {
    backgroundColor: '#EFEFEF',
    padding: 15,
    borderRadius: 10,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  positionText: {
    marginVertical: 8,
    color: '#62A0A5',
    fontWeight: '500',
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
});