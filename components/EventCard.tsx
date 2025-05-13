import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type EventCardProps = {
  title: string;
  date: string;
  description: string;
};

export default function EventCard({ title, date, description }: EventCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text>{date}</Text>
      <Text>{description}</Text>
    </View>
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
  },
});
