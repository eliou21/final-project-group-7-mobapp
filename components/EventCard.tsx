import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

type EventCardProps = {
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  volunteerCategories?: string[];
  coverPhoto?: string;
  onPress?: () => void;
  tags?: string[];
};

export default function EventCard({ 
  title, 
  date, 
  time, 
  description, 
  location, 
  volunteerCategories = [], 
  coverPhoto, 
  onPress, 
  tags 
}: EventCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {coverPhoto ? (
        <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
      ) : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {tags && tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <View key={tag} style={styles.tagBadgeSmall}>
                <Text style={styles.tagTextSmall}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.date}>{date}{time ? ` at ${time}` : ''}</Text>
        <Text style={styles.location}>{location}</Text>
        <Text style={styles.description}>{description}</Text>
        {volunteerCategories.length > 0 && (
          <View style={styles.categoriesRow}>
            {volunteerCategories.map((cat) => (
              <View key={cat} style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
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
  categoriesContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  categoriesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  categoryText: {
    marginLeft: 10,
    marginBottom: 3,
    color: '#666',
  },
  coverPhoto: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  content: {
    // Add appropriate styles for the content container
  },
  date: {
    // Add appropriate styles for the date
  },
  location: {
    // Add appropriate styles for the location
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  tagBadgeSmall: {
    backgroundColor: '#62A0A5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  tagTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  categoryBadge: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 4,
    marginBottom: 4,
  },
});
