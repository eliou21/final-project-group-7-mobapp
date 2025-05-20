import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';

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
  actionButton?: React.ReactNode;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
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
  actionButton,
  locationCoordinates,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);

  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={styles.mapModalContainer}>
        <View style={styles.mapHeader}>
          <TouchableOpacity
            style={styles.mapCloseButton}
            onPress={() => setShowMapModal(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.mapTitle}>Event Location</Text>
        </View>
        {locationCoordinates && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: locationCoordinates.latitude,
              longitude: locationCoordinates.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: locationCoordinates.latitude,
                longitude: locationCoordinates.longitude,
              }}
              title={title}
              description={location}
            />
          </MapView>
        )}
      </SafeAreaView>
    </Modal>
  );

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
              <View style={[styles.canceledBadgePhoto, styles.leftBadge]}>
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
              <View style={[styles.fullSlotBadgePhoto, styles.leftBadge]}>
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
              <View style={[styles.canceledBadgePhoto, styles.leftBadge]}>
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
              <View style={[styles.fullSlotBadgePhoto, styles.leftBadge]}>
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
          <Ionicons name="calendar-outline" size={20} color="#7F4701" style={styles.infoIcon} />
          <Text style={styles.infoText}>{date}</Text>
        </View>
        {time && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#7F4701" style={styles.infoIcon} />
            <Text style={styles.infoText}>{time}</Text>
          </View>
        )}
        {location && (
          <TouchableOpacity 
            style={styles.infoRow}
            onPress={() => locationCoordinates && setShowMapModal(true)}
            disabled={!locationCoordinates}
          >
            <Ionicons name="location-outline" size={20} color="#7F4701" style={styles.infoIcon} />
            <Text style={[styles.infoText, locationCoordinates && styles.clickableLocation]}>
              {location}
            </Text>
          </TouchableOpacity>
        )}
        {showFullSlot && !canceled && (
          null
        )}
        {actionButton && (
          <View style={styles.actionButtonWrapper}>
            {React.isValidElement(actionButton)
              ? (typeof actionButton.props === 'object'
                  ? React.cloneElement(
                      actionButton as React.ReactElement<any>,
                      {
                        ...(actionButton.props as object),
                        style: [styles.applyButtonUnified, (actionButton.props as any).style],
                      },
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#7F4701" style={{ marginRight: 8 }} />
                        <Text style={styles.applyButtonTextUnified}>{(actionButton.props as any).children}</Text>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#7F4701" style={{ marginLeft: 8 }} />
                      </>
                    )
                  : React.cloneElement(
                      actionButton as React.ReactElement<any>,
                      {
                        style: styles.applyButtonUnified,
                      },
                      <>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.applyButtonTextUnified}>Apply</Text>
                      </>
                    )
                )
              : actionButton}
          </View>
        )}
      </View>
      {renderMapModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: 'rgb(255, 252, 236)',
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
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    color: '#7F4701',
    fontSize: 15,
    flex: 1,
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
  leftBadge: {
    left: 10,
    right: undefined,
  },
  actionButtonWrapper: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 2,
  },
  applyButtonUnified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#62A0A5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    height: 40,
    width: 140,
    justifyContent: 'center',
  },
  applyButtonTextUnified: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mapCloseButton: {
    padding: 5,
  },
  mapTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  map: {
    flex: 1,
  },
  clickableLocation: {
    color: '#62A0A5',
    textDecorationLine: 'underline',
  },
});

export default UnifiedEventCard; 