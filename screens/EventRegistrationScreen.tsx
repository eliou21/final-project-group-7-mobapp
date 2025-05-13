import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Button, Alert } from 'react-native';

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
};

const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'Beach Cleanup',
    date: '2025-05-18',
    description: 'Join us to clean the local beach.',
  },
  {
    id: '2',
    title: 'Food Drive',
    date: '2025-05-20',
    description: 'Help organize and distribute food donations.',
  },
];

export default function EventRegistrationScreen() {
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);

  const handleRegister = (eventId: string) => {
    if (registeredEventIds.includes(eventId)) {
      Alert.alert('Already Registered', 'You have already registered for this event.');
      return;
    }
    setRegisteredEventIds([...registeredEventIds, eventId]);
    Alert.alert('Success', 'You are registered for the event!');
  };

  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text>Date: {item.date}</Text>
      <Text>{item.description}</Text>
      <Button
        title={registeredEventIds.includes(item.id) ? 'Registered' : 'Register'}
        disabled={registeredEventIds.includes(item.id)}
        onPress={() => handleRegister(item.id)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Events</Text>
      <FlatList
        data={dummyEvents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
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
});
