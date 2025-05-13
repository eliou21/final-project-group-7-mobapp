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

type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export default function ManageVolunteersScreen() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setEditingId(null);
  };

  const handleAddOrUpdate = () => {
    if (!name || !email || !phone) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }

    if (editingId) {
      // Update
      setVolunteers(
        volunteers.map((v) =>
          v.id === editingId ? { ...v, name, email, phone } : v
        )
      );
      Alert.alert('Success', 'Volunteer updated!');
    } else {
      // Add
      const newVolunteer: Volunteer = {
        id: Date.now().toString(),
        name,
        email,
        phone,
      };
      setVolunteers([...volunteers, newVolunteer]);
      Alert.alert('Success', 'Volunteer added!');
    }

    clearForm();
  };

  const handleEdit = (volunteer: Volunteer) => {
    setName(volunteer.name);
    setEmail(volunteer.email);
    setPhone(volunteer.phone);
    setEditingId(volunteer.id);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Delete this volunteer?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () =>
          setVolunteers(volunteers.filter((vol) => vol.id !== id)),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Volunteer }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text>{item.email}</Text>
      <Text>{item.phone}</Text>
      <View style={styles.row}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Volunteer Management</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button
          title={editingId ? 'Update Volunteer' : 'Add Volunteer'}
          onPress={handleAddOrUpdate}
        />

        <FlatList
          data={volunteers}
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
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
