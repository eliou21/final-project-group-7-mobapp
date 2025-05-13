import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Button,
  Alert,
  SafeAreaView
} from 'react-native';

type Notification = {
  id: string;
  title: string;
  message: string;
  date: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSendNotification = () => {
    if (!title || !message) {
      Alert.alert('Validation', 'Both fields are required.');
      return;
    }

    const newNotification: Notification = {
      id: Date.now().toString(),
      title,
      message,
      date: new Date().toLocaleString(),
    };

    setNotifications([newNotification, ...notifications]);
    setTitle('');
    setMessage('');
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text>{item.message}</Text>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Notifications</Text>

        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
        />
        <Button title="Send Notification" onPress={handleSendNotification} />

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  date: { marginTop: 5, fontSize: 12, color: 'gray' },
});
