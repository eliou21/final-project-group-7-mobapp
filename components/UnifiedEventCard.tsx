import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UnifiedEventCardProps {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  tags?: string[];
  coverPhoto?: string;
  imageError?: boolean;
  onImageError?: () => void;
  volunteerCount?: number;
  maxVolunteers?: number;
  showVolunteerCount?: boolean;
  canceled?: boolean;
  showCancelIcon?: boolean;
  onCancelPress?: () => void;
  cancelDisabled?: boolean;
  showFullSlot?: boolean;
  style?: any;
  saveButton?: React.ReactNode;
}

const UnifiedEventCard: React.FC<UnifiedEventCardProps> = ({
  title,
  date,
  time,
  location,
  description,
  tags = [],
  coverPhoto,
  imageError,
  onImageError,
  volunteerCount,
  maxVolunteers,
  showVolunteerCount = false,
  canceled = false,
  showCancelIcon = false,
  onCancelPress,
  cancelDisabled = false,
  showFullSlot = false,
  style,
  saveButton,
}) => {
  return (
    <View style={[styles.eventCard, style]}>
      <View>
        {coverPhoto && !imageError ? (
          <View>
            <Image
              source={{ uri: coverPhoto }}
              style={styles.eventImage}
              resizeMode="cover"
              onError={onImageError}
            />
            {canceled && (
              <View style={styles.canceledBadgePhoto}>
                <Text style={styles.canceledBadgePhotoText}>Event Cancelled</Text>
              </View>
            )}
            {showVolunteerCount && (
              <View style={styles.volunteerCountOverlay}>
                <View style={styles.volunteerCountBadge}>
                  <Text style={styles.volunteerCountText}>
                    {volunteerCount ?? 0}/{maxVolunteers ?? 0}
                  </Text>
                  <Text style={styles.volunteerCountLabel}>Volunteers</Text>
                </View>
              </View>
            )}
            {showFullSlot && !canceled && (
              <View style={styles.fullSlotBadgePhoto}>
                <Text style={styles.fullSlotBadgePhotoText}>Full Slot</Text>
              </View>
            )}
            {saveButton && (
              <View style={styles.saveButtonContainer}>
                {saveButton}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
            {canceled && (
              <View style={styles.canceledBadgePhoto}>
                <Text style={styles.canceledBadgePhotoText}>Event Cancelled</Text>
              </View>
            )}
            {showVolunteerCount && (
              <View style={styles.volunteerCountOverlay}>
                <View style={styles.volunteerCountBadge}>
                  <Text style={styles.volunteerCountText}>
                    {volunteerCount ?? 0}/{maxVolunteers ?? 0}
                  </Text>
                  <Text style={styles.volunteerCountLabel}>Volunteers</Text>
                </View>
              </View>
            )}
            {showFullSlot && !canceled && (
              <View style={styles.fullSlotBadgePhoto}>
                <Text style={styles.fullSlotBadgePhotoText}>Full Slot</Text>
              </View>
            )}
            {saveButton && (
              <View style={styles.saveButtonContainer}>
                {saveButton}
              </View>
            )}
          </View>
        )}
        {showCancelIcon && (
          <TouchableOpacity
            style={styles.cancelIcon}
            onPress={onCancelPress}
            disabled={cancelDisabled}
            activeOpacity={cancelDisabled ? 1 : 0.7}
          >
            <View style={styles.cancelIconBg}>
              <Ionicons
                name="close-circle-outline"
                size={30}
                color={cancelDisabled ? '#ccc' : '#ff4444'}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.eventContent}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>{title}</Text>
          </View>
        </View>
        {tags && tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4, marginTop: 2 }}>
            {tags.map(tag => (
              <View key={tag} style={styles.eventTagBadge}>
                <Text style={styles.eventTagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {description && (
          <Text style={styles.eventDescription}>{description}</Text>
        )}
        <View style={styles.dividerLine} />
        <View style={styles.infoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="calendar" size={16} color="#62A0A5" style={styles.infoIcon} />
            <Text style={styles.eventDate}>{date}</Text>
          </View>
          <View style={{ width: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="time" size={16} color="#62A0A5" style={styles.infoIcon} />
            <Text style={styles.eventTime}>{time}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location" size={16} color="#7F4701" style={{ marginRight: 6 }} />
            <Text style={styles.eventLocation}>{location}</Text>
          </View>
        </View>
        {showFullSlot && !canceled && (
          null
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: 'rgb(252, 252, 252)',
    borderRadius: 25,
    borderColor: '#7F4701',
    marginBottom: 18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  volunteerCountOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 2,
  },
  volunteerCountBadge: {
    backgroundColor: 'rgb(252, 204, 145)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 60,
  },
  volunteerCountText: {
    color: '#7F4701',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  volunteerCountLabel: {
    color: '#7F4701',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 1,
  },
  cancelIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
  cancelIconBg: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 2,
  },
  eventContent: {
    padding: 18,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
    marginLeft: 3,
    marginBottom: 6,
  },
  dividerLine: {
    height: 2,
    backgroundColor: '#7F4701',
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
    gap: 8,
  },
  infoIcon: {
    marginRight: 6,
    color: '#7F4701',
  },
  eventDate: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },
  eventTime: {
    fontSize: 14,
    color: '#7F4701',
    fontWeight: '600',
    marginBottom: 0,
  },
  eventLocation: {
    fontSize: 14,
    color: '#7F4701',
    flex: 1,
  },
  eventTagBadge: {
    backgroundColor: '#FEBD6B',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  eventTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fullSlotBadgePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  fullSlotBadgePhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  canceledBadgePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  canceledBadgePhotoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  saveButtonContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 3,
  },
});

export default UnifiedEventCard; 