import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EventCard from '../components/EventCard';

type Event = {
  id: string;
  title: string;
  date: string;
  description: string;
};

export default function SavedEventsScreen() {
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('savedEvents');
      if (stored) setSavedEvents(JSON.parse(stored));
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Saved Events</Text>
        <FlatList
          data={savedEvents}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <EventCard title={item.title} date={item.date} description={item.description} />
          )}
          contentContainerStyle={{ marginTop: 20 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888' }}>No saved events.</Text>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
}); 