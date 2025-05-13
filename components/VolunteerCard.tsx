import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type VolunteerCardProps = {
  name: string;
  email: string;
  status: string;
};

export default function VolunteerCard({ name, email, status }: VolunteerCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text>{email}</Text>
      <Text>Status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
