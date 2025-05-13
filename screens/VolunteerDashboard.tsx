import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventCard from '../components/EventCard';
import { Ionicons } from '@expo/vector-icons';

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
};

export default function VolunteerDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('events');
      if (stored) setEvents(JSON.parse(stored));
      const saved = await AsyncStorage.getItem('savedEvents');
      if (saved) setSavedIds(JSON.parse(saved).map((e: Event) => e.id));
    })();
  }, []);

  const handleSave = async (event: Event) => {
    const saved = await AsyncStorage.getItem('savedEvents');
    let savedEvents: Event[] = saved ? JSON.parse(saved) : [];
    if (!savedEvents.find(e => e.id === event.id)) {
      savedEvents.push(event);
      await AsyncStorage.setItem('savedEvents', JSON.stringify(savedEvents));
      setSavedIds([...savedIds, event.id]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome, Volunteer!</Text>
        <Text style={styles.subtitle}>Here are the events you can join:</Text>
        <FlatList
          data={events}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <EventCard title={item.title} date={item.date} description={item.description} />
              </View>
              <TouchableOpacity
                onPress={() => handleSave(item)}
                style={{ padding: 8 }}
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
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>No events available.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 10 },
});
