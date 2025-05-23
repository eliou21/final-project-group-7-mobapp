import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import HeaderBanner from '../components/HeaderBanner';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const VOLUNTEER_CATEGORIES = [
  'Logistics & Planning',
  'External Affairs/Outreach',
  'Secretary/Admin Support',
  'Program & Activities',
  'Publicity and Promotion',
  'Finance & Budgeting',
  'Documentation & Media',
  'Safety & Security',
  'Hospitality & Accomodation',
  'Technical Support/IT',
];

const TAG_OPTIONS = [
  'Environmental',
  'Animal',
  'Social Work',
  'Healthcare',
  'Blood Donation',
  'Sports',
  'Others',
];

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  locationCoordinates?: {
    latitude: number;
    longitude: number;
  };
  coverPhoto?: string;
  volunteerCategories: string[];
  canceled?: boolean;
  tags?: string[];
  maxVolunteers: number;
};

export default function ManageEventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [maxVolunteers, setMaxVolunteers] = useState('');
  const [errors, setErrors] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    location: '',
    coverPhoto: '',
    categories: '',
    tags: '',
    maxVolunteers: '',
  });
  const navigation: any = useNavigation();
  const route = useRoute();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState('');
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.5995,  // Manila, Philippines latitude
    longitude: 120.9842, // Manila, Philippines longitude
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('events');
      if (stored) setEvents(JSON.parse(stored));
    })();
  }, []);

  useEffect(() => {
    // Prefill form if editing an event
    if (route.params && (route.params as any).event) {
      const event = (route.params as any).event;
      setTitle(event.title || '');
      setDate(event.date || null);
      setTime(event.time || null);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setCoverPhoto(event.coverPhoto);
      setEditingId(event.id);
      setSelectedCategories(event.volunteerCategories || []);
      setSelectedTags(event.tags || []);
      setMaxVolunteers(event.maxVolunteers ? String(event.maxVolunteers) : '');
      // Set the selectedLocation if locationCoordinates exist
      if (event.locationCoordinates) {
        setSelectedLocation({
          latitude: event.locationCoordinates.latitude,
          longitude: event.locationCoordinates.longitude,
          address: event.location
        });
      } else {
        setSelectedLocation(null);
      }
    }
  }, [route.params]);

  const saveEvents = async (newEvents: Event[]) => {
    setEvents(newEvents);
    await AsyncStorage.setItem('events', JSON.stringify(newEvents));
  };

  const clearForm = () => {
    setTitle('');
    setDate(null);
    setTime(null);
    setDescription('');
    setLocation('');
    setCoverPhoto(undefined);
    setEditingId(null);
    setSelectedCategories([]);
    setSelectedTags([]);
    setMaxVolunteers('');
    setSelectedLocation(null);
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!coverPhoto) newErrors.coverPhoto = 'Cover photo is required.';
    if (!title) newErrors.title = 'Event title is required.';
    if (!date) newErrors.date = 'Date is required.';
    if (!time) newErrors.time = 'Time is required.';
    if (!location) newErrors.location = 'Location is required.';
    if (!description) newErrors.description = 'Description is required.';
    if (!maxVolunteers || isNaN(Number(maxVolunteers)) || Number(maxVolunteers) <= 0) newErrors.maxVolunteers = 'Enter a valid volunteer limit (>0).';
    if (selectedCategories.length === 0) newErrors.categories = 'Select at least one category.';
    if (selectedTags.length === 0) newErrors.tags = 'Select at least one tag.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOrUpdateEvent = async () => {
    if (!validateForm()) return;
    if (!title || !date || !time || !description || !location) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    if (selectedTags.length === 0) {
      Alert.alert('Validation', 'Please select at least one tag for this event.');
      return;
    }
    if (!maxVolunteers || isNaN(Number(maxVolunteers)) || Number(maxVolunteers) <= 0) {
      Alert.alert('Validation', 'Please enter a valid volunteer limit (must be greater than 0).');
      return;
    }

    if (editingId) {
      // Update
      const updated = events.map((e) =>
        e.id === editingId ? { 
          ...e, 
          title, 
          date, 
          time, 
          description, 
          location, 
          coverPhoto, 
          volunteerCategories: selectedCategories, 
          tags: selectedTags, 
          maxVolunteers: Number(maxVolunteers),
          locationCoordinates: selectedLocation ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
          } : undefined
        } : e
      );
      await saveEvents(updated);
      Alert.alert('Success', 'Event updated!');
    } else {
      // Create
      const newEvent: Event = {
        id: Date.now().toString(),
        title,
        date,
        time,
        description,
        location,
        coverPhoto,
        volunteerCategories: selectedCategories,
        tags: selectedTags,
        maxVolunteers: Number(maxVolunteers),
        locationCoordinates: selectedLocation ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        } : undefined
      };
      await saveEvents([...events, newEvent]);
      Alert.alert('System Notification', 'A new event has been posted!');
      navigation.navigate('AdminTabs', { screen: 'Dashboard' });
    }
    clearForm();
  };

  const handleEdit = (event: Event) => {
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time);
    setDescription(event.description);
    setLocation(event.location);
    setCoverPhoto(event.coverPhoto);
    setEditingId(event.id);
    setSelectedCategories(event.volunteerCategories || []);
    setSelectedTags(event.tags || []);
    setMaxVolunteers(event.maxVolunteers ? String(event.maxVolunteers) : '');
    // Set the selectedLocation if locationCoordinates exist
    if (event.locationCoordinates) {
      setSelectedLocation({
        latitude: event.locationCoordinates.latitude,
        longitude: event.locationCoordinates.longitude,
        address: event.location
      });
    } else {
      setSelectedLocation(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Delete this event?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const filtered = events.filter((e) => e.id !== id);
          await saveEvents(filtered);
          
          // Remove from saved events
          const savedEvents = await AsyncStorage.getItem('savedEvents');
          if (savedEvents) {
            const parsedSavedEvents = JSON.parse(savedEvents);
            const updatedSavedEvents = parsedSavedEvents.filter((e: Event) => e.id !== id);
            await AsyncStorage.setItem('savedEvents', JSON.stringify(updatedSavedEvents));
          }
        },
      },
    ]);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll access to upload a cover photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets.length > 0) {
      setCoverPhoto(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      setTempTime(selectedTime);
    }
  };

  const handleDateDone = () => {
    if (tempDate) {
      setDate(tempDate.toISOString().split('T')[0]);
      setTempDate(null);
    }
    setShowDatePicker(false);
  };

  const handleTimeDone = () => {
    if (tempTime) {
      const hours = tempTime.getHours().toString().padStart(2, '0');
      const minutes = tempTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
      setTempTime(null);
    }
    setShowTimePicker(false);
  };

  const handleDatePress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date ? new Date(date) : new Date(),
        onChange: handleDateChange,
        mode: 'date',
        display: 'default'
      });
    } else {
      setTempDate(date ? new Date(date) : new Date());
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  };

  const handleTimePress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: time ? new Date(`1970-01-01T${time}:00`) : new Date(),
        onChange: handleTimeChange,
        mode: 'time',
        display: 'default'
      });
    } else {
      setTempTime(time ? new Date(`1970-01-01T${time}:00`) : new Date());
      setShowTimePicker(true);
      setShowDatePicker(false);
    }
  };

  const handleCancelEvent = async (id: string) => {
    const updated = events.map((e) =>
      e.id === id ? { ...e, canceled: true } : e
    );
    await saveEvents(updated);
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission is required to select event locations.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      const formattedAddress = address ? 
        `${address.street ? address.street + ', ' : ''}${address.city ? address.city + ', ' : ''}${address.region ? address.region + ', ' : ''}${address.country || ''}` :
        `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setSelectedLocation({
        latitude,
        longitude,
        address: formattedAddress
      });
      setLocation(formattedAddress);
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Failed to get location. Please try again.');
    }
  };

  const handleManualLocationSubmit = () => {
    if (!manualLocation.trim()) {
      setLocationError('Please enter a location');
      return;
    }
    setLocation(manualLocation);
    setSelectedLocation(null); // Clear coordinates since we're using manual location
    setShowLocationModal(false);
  };

  const handleLocationSelect = () => {
    setLocationError(null);
    setManualLocation('');
    setShowLocationModal(true);
  };

  const handleMapPress = (e: any) => {
    const { coordinate } = e.nativeEvent;
    setSelectedMapLocation(coordinate);
  };

  const handleMapLocationSelect = async () => {
    if (selectedMapLocation) {
      try {
        // Get address from coordinates
        const response = await Location.reverseGeocodeAsync({
          latitude: selectedMapLocation.latitude,
          longitude: selectedMapLocation.longitude
        });

        if (response.length > 0) {
          const address = response[0];
          const formattedAddress = [
            address.street,
            address.city,
            address.region,
            address.country
          ].filter(Boolean).join(', ');

          setLocation(formattedAddress);
          setSelectedLocation({
            latitude: selectedMapLocation.latitude,
            longitude: selectedMapLocation.longitude,
            address: formattedAddress
          });
          setShowMapModal(false);
          setShowLocationModal(false);
        }
      } catch (error) {
        console.error('Error getting address:', error);
        Alert.alert('Error', 'Could not get address from selected location');
      }
    }
  };

  const renderItem = ({ item }: { item: Event }) => (
    <View style={styles.card}>
      {item.coverPhoto && (
        <Image source={{ uri: item.coverPhoto }} style={styles.coverPhoto} />
      )}
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text>Date: {item.date}</Text>
      <Text>Time: {item.time}</Text>
      <Text>Location: {item.location}</Text>
      <Text>{item.description}</Text>
      {item.canceled && (
        <Text style={{ color: 'red', fontWeight: 'bold', marginTop: 8 }}>Event Canceled</Text>
      )}
      {item.volunteerCategories && item.volunteerCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Volunteer Categories:</Text>
          {item.volunteerCategories.map((category, index) => (
            <Text key={index} style={styles.categoryText}>• {category}</Text>
          ))}
        </View>
      )}
      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {item.tags.map(tag => (
            <View key={tag} style={styles.tagBadgeSmall}>
              <Text style={styles.tagTextSmall}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      <View style={styles.row}>
        <Button title="Edit" onPress={() => handleEdit(item)} disabled={item.canceled} />
        <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} disabled={item.canceled} />
        {!item.canceled && (
          <Button title="Cancel Event" color="#888" onPress={() => handleCancelEvent(item.id)} />
        )}
      </View>
    </View>
  );

  const renderLocationModal = () => (
    <Modal
      visible={showLocationModal}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location</Text>
          
          {locationError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#ff4444" />
              <Text style={styles.errorText}>{locationError}</Text>
            </View>
          )}

          <View style={styles.locationOptions}>
            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Use Current Location</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={getCurrentLocation}
              >
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Get Current Location</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Select on Map</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowLocationModal(false);
                  setShowMapModal(true);
                }}
              >
                <Ionicons name="map" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Open Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Enter Location Manually</Text>
              <TextInput
                style={styles.manualInput}
                placeholder="Enter event location"
                value={manualLocation}
                onChangeText={setManualLocation}
                multiline
              />
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleManualLocationSubmit}
              >
                <Text style={styles.secondaryButtonText}>Use This Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowLocationModal(false);
              setLocationError(null);
              setManualLocation('');
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={styles.mapTitle}>Select Location</Text>
          <TouchableOpacity
            style={styles.mapConfirmButton}
            onPress={handleMapLocationSelect}
            disabled={!selectedMapLocation}
          >
            <Text style={[
              styles.mapConfirmText,
              !selectedMapLocation && styles.mapConfirmTextDisabled
            ]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
        <MapView
          style={styles.map}
          initialRegion={mapRegion}
          onRegionChangeComplete={setMapRegion}
          onPress={handleMapPress}
        >
          {selectedMapLocation && (
            <Marker
              coordinate={selectedMapLocation}
              pinColor="#62A0A5"
            />
          )}
        </MapView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBanner />
      <View style={styles.bannerHeader}>
        <Text style={styles.bannerTitle}>Create Events</Text>
        <Text style={styles.bannerSubtitle}>Create, edit, and manage your events</Text>
      </View>
      <View style={styles.bannerDivider} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>- EVENT DETAILS -</Text>
          <View style={styles.formDivider} />
          <Text style={styles.label}>Cover Photo</Text>
          <TouchableOpacity style={[styles.imagePicker, errors.coverPhoto && styles.inputError]} onPress={handlePickImage}>
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
            ) : (
              <Text style={styles.imagePickerText}>Pick Cover Photo</Text>
            )}
          </TouchableOpacity>
          {errors.coverPhoto ? <Text style={styles.errorText}>{errors.coverPhoto}</Text> : null}

          <Text style={styles.label}>Event Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Event Title"
            value={title}
            onChangeText={setTitle}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity style={[styles.inputWithIcon, errors.date && styles.inputError]} onPress={handleDatePress}>
                <Ionicons name="calendar" size={20} color="#62A0A5" style={styles.inputIcon} />
                <Text style={{ color: date ? '#000' : '#888', marginLeft: 28 }}>{date || 'Select Date'}</Text>
              </TouchableOpacity>
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity style={[styles.inputWithIcon, errors.time && styles.inputError]} onPress={handleTimePress}>
                <Ionicons name="time" size={20} color="#62A0A5" style={styles.inputIcon} />
                <Text style={{ color: time ? '#000' : '#888', marginLeft: 28 }}>{time || 'Select Time'}</Text>
              </TouchableOpacity>
              {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}
            </View>
          </View>
          {Platform.OS === 'ios' && (
            <>
              <Modal visible={showDatePicker} transparent animationType="slide">
                <View style={styles.modalContainer}>
                  <View style={[styles.modalContent, { backgroundColor: '#000000' }]}>
                    <DateTimePicker
                      value={tempDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#62A0A5' }]} 
                      onPress={handleDateDone}
                    >
                      <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Modal visible={showTimePicker} transparent animationType="slide">
                <View style={styles.modalContainer}>
                  <View style={[styles.modalContent, { backgroundColor: '#000000' }]}>
                    <DateTimePicker
                      value={tempTime || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={handleTimeChange}
                      minimumDate={date && new Date(date).toDateString() === new Date().toDateString() ? new Date() : new Date('1970-01-01T00:00:00')}
                    />
                    <TouchableOpacity 
                      style={[styles.button, { backgroundColor: '#62A0A5' }]} 
                      onPress={handleTimeDone}
                    >
                      <Text style={styles.buttonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </>
          )}
          <Text style={styles.label}>Volunteer Categories</Text>
          <TouchableOpacity 
            style={[styles.categoryPickerButton, errors.categories && styles.inputError]} 
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.categoryPickerButtonText}>
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} Categories Selected` 
                : 'Select Volunteer Categories'}
            </Text>
          </TouchableOpacity>
          {errors.categories ? <Text style={styles.errorText}>{errors.categories}</Text> : null}

          <Modal
            visible={showCategoryPicker}
            transparent
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, { backgroundColor: '#7BB1B7' }]}>
                <Text style={styles.modalTitle}>Select Volunteer Categories</Text>
                <ScrollView style={{ maxHeight: 300, width: '100%' }}>
                  {VOLUNTEER_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryItem,
                        selectedCategories.includes(category) && styles.selectedCategoryItem
                      ]}
                      onPress={() => {
                        if (selectedCategories.includes(category)) {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        } else {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                      }}
                    >
                      <Text style={[
                        styles.categoryText,
                        selectedCategories.includes(category) && styles.selectedCategoryText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <TouchableOpacity
                    style={[styles.cancelButtonCustom, { flex: 1 }]}
                    onPress={() => setShowCategoryPicker(false)}
                  >
                    <Text style={styles.cancelButtonTextCustom}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.changeButtonCustom, { flex: 1 }]}
                    onPress={() => setShowCategoryPicker(false)}
                  >
                    <Text style={styles.changeButtonTextCustom}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          <Text style={styles.label}>Location</Text>
          <TouchableOpacity 
            style={[styles.mapButton, errors.location && styles.inputError]} 
            onPress={handleLocationSelect}
          >
            <Ionicons name="location" size={20} color="#62A0A5" style={styles.inputIcon} />
            <Text style={styles.mapButtonText}>
              {location || 'Select Location'}
            </Text>
          </TouchableOpacity>
          {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

          {renderLocationModal()}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }, errors.description && styles.inputError]}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

          <Text style={styles.label}>Volunteer Limit</Text>
          <TextInput
            style={[styles.input, errors.maxVolunteers && styles.inputError]}
            placeholder="Volunteer Limit"
            value={maxVolunteers}
            onChangeText={setMaxVolunteers}
            keyboardType="numeric"
          />
          {errors.maxVolunteers ? <Text style={styles.errorText}>{errors.maxVolunteers}</Text> : null}

          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            {TAG_OPTIONS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagBadge, selectedTags.includes(tag) && styles.tagBadgeSelected]}
                onPress={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
              >
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.tags ? <Text style={styles.errorText}>{errors.tags}</Text> : null}

          <TouchableOpacity style={styles.submitButton} onPress={handleAddOrUpdateEvent}>
            <Text style={styles.submitButtonText}>{editingId ? 'Update Event' : 'Add Event'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {renderMapModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FFEAB8' 
  },

  container: { 
    flex: 1, 
    padding: 20, 
  },

  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  
  input: {
    borderWidth: 2,
    borderColor: '#FFF1C7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  imagePicker: {
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFF1C7',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },

  imagePickerText: {
    color: '#62A0A5',
    fontWeight: 'bold',
  },

  coverPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },

  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF1C7',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },

  mapButtonText: {
    color: '#62A0A5',
    marginLeft: 28,
    flex: 1,
  },

  card: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },

  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },

  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  inputWithIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF1C7',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#fff',
    marginBottom: 0,
    position: 'relative',
  },

  inputIcon: {
    position: 'absolute',
    left: 8,
    zIndex: 1,
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    backgroundColor: '#FFF1C7',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7F4701',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7F4701',
    marginBottom: 8,
  },

  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },

  modalButtons: {
    width: '100%',
    gap: 12,
  },

  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },

  primaryButton: {
    backgroundColor: '#62A0A5',
    gap: 8,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  secondaryButton: {
    backgroundColor: '#62A0A5',
  },

  secondaryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },

  categoryPickerButton: {
    borderWidth: 2,
    borderColor: '#FFF1C7',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  categoryPickerButtonText: {
    color: '#62A0A5',
  },

  pickerContainer: {
    maxHeight: 300,
    width: '100%',
  },

  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFF1C7',
    width: '100%',
  },

  categoryText: {
    fontSize: 16,
    color: '#FFF1C7',
  },

  selectedCategoryItem: {
    backgroundColor: 'rgb(113, 165, 174)',
    borderRadius: 10,
  },

  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
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
  },

  sectionLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 6,
    color: '#FFF1C7',
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },

  tagBadge: {
    borderWidth: 2,
    borderColor: '#7F4701',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: '#FFF1C7',
  },

  tagBadgeSelected: {
    backgroundColor: '#62A0A5',
  },

  tagText: {
    color: '#7F4701',
    fontWeight: 'bold',
  },

  tagTextSelected: {
    color: '#fff',
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
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

  formCard: {
    backgroundColor: '#7BB1B7',
    borderRadius: 25,
    borderColor: '#7F4701',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    padding: 22,
    marginBottom: 24,
  },

  label: {
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 4,
    marginTop: 6,
    fontSize: 15,
  },

  errorText: {
    color: '#ff4444',
    fontSize: 13,
    marginBottom: 4,
    marginLeft: 2,
  },

  inputError: {
    borderColor: '#ff4444',
  },

  submitButton: {
    backgroundColor: '#FFF1C7',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7F4701',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },

  submitButtonText: {
    color: '#7F4701',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 0.5,
  },

  bannerHeader: {
    backgroundColor: '#62A0A5',
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 420,
    width: '90%',
    alignSelf: 'center',
  },

  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF1C7',
    marginBottom: 2,
    textAlign: 'center',
  },

  bannerSubtitle: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.92,
  },

  bannerDivider: {
    height: 3,
    backgroundColor: '#62A0A5',
    borderRadius: 2,
    width: '100%',
    alignSelf: 'center',

  },

  formTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFF1C7',
    textAlign: 'center',
    marginBottom: 0,
    marginTop: 2,
    letterSpacing: 1,
  },

  formDivider: {
    height: 4,
    backgroundColor: '#FFF1C7',
    borderRadius: 2,
    width: 330,
    alignSelf: 'center',
    marginBottom: 18,
    marginTop: 20,
  },

  locationOptions: {
    width: '100%',
    gap: 16,
  },

  optionSection: {
    width: '100%',
    gap: 8,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F4701',
    marginBottom: 4,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },

  dividerText: {
    color: '#666',
    fontSize: 14,
  },

  manualInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  cancelButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    width: '100%',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },

  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },

  mapCloseButton: {
    padding: 5,
  },

  mapTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  mapConfirmButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#62A0A5',
  },

  mapConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  mapConfirmTextDisabled: {
    color: '#ccc',
  },

  map: {
    flex: 1,
  },

  button: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  cancelButtonCustom: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 0,
  },

  cancelButtonTextCustom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  changeButtonCustom: {
    backgroundColor: '#7AA47D',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 0,
  },

  changeButtonTextCustom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
