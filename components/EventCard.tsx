import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type EventCardProps = {
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  onPress?: () => void;
};

export default function EventCard({ title, date, time, description, location, onPress }: EventCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>Date: {date}</Text>
      <Text style={styles.details}>Time: {time}</Text>
      <Text style={styles.details}>Location: {location}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EFEFEF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
  },
});
