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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

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

type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  location: string;
  coverPhoto?: string;
  volunteerCategories: string[];
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

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('events');
      if (stored) setEvents(JSON.parse(stored));
    })();
  }, []);

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
  };

  const handleAddOrUpdateEvent = async () => {
    if (!title || !date || !time || !description || !location) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }

    if (editingId) {
      // Update
      const updated = events.map((e) =>
        e.id === editingId ? { ...e, title, date, time, description, location, coverPhoto, volunteerCategories: selectedCategories } : e
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
      };
      await saveEvents([...events, newEvent]);
      Alert.alert('System Notification', 'A new event has been posted!');
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (event.type === 'set' && selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setTime(`${hours}:${minutes}`);
    }
  };

  const handleDatePress = () => {
    const currentDate = new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date ? new Date(date) : currentDate,
        mode: 'date',
        is24Hour: true,
        onChange: handleDateChange,
        display: 'default',
        minimumDate: currentDate,
      });
    } else {
      setShowDatePicker(true);
      setShowTimePicker(false);
    }
  };

  const handleTimePress = () => {
    const currentDate = new Date();
    const selectedDate = date ? new Date(date) : currentDate;
    const isToday = selectedDate.toDateString() === currentDate.toDateString();
    
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: time ? new Date(`1970-01-01T${time}:00`) : currentDate,
        mode: 'time',
        is24Hour: true,
        onChange: handleTimeChange,
        display: 'default',
        minimumDate: isToday ? currentDate : new Date('1970-01-01T00:00:00'),
      });
    } else {
      setShowTimePicker(true);
      setShowDatePicker(false);
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
      {item.volunteerCategories && item.volunteerCategories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <Text style={styles.categoriesTitle}>Volunteer Categories:</Text>
          {item.volunteerCategories.map((category, index) => (
            <Text key={index} style={styles.categoryText}>• {category}</Text>
          ))}
        </View>
      )}
      <View style={styles.row}>
        <Button title="Edit" onPress={() => handleEdit(item)} />
        <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Manage Events</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.coverPhoto} />
          ) : (
            <Text style={styles.imagePickerText}>Pick Cover Photo</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Event Title"
          value={title}
          onChangeText={setTitle}
        />
        <View style={styles.rowInputs}>
          <TouchableOpacity style={styles.inputWithIcon} onPress={handleDatePress}>
            <Ionicons name="calendar" size={20} color="#62A0A5" style={styles.inputIcon} />
            <Text style={{ color: date ? '#000' : '#888', marginLeft: 28 }}>{date ? `Date: ${date}` : 'Select Date'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputWithIcon} onPress={handleTimePress}>
            <Ionicons name="time" size={20} color="#62A0A5" style={styles.inputIcon} />
            <Text style={{ color: time ? '#000' : '#888', marginLeft: 28 }}>{time ? `Time: ${time}` : 'Select Time'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.categoryPickerButton} 
          onPress={() => setShowCategoryPicker(true)}
        >
          <Text style={styles.categoryPickerButtonText}>
            {selectedCategories.length > 0 
              ? `${selectedCategories.length} Categories Selected` 
              : 'Select Volunteer Categories'}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={showCategoryPicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Volunteer Categories</Text>
              <ScrollView style={styles.pickerContainer}>
                {VOLUNTEER_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryItem,
                      selectedCategories.includes(category) && styles.selectedCategory
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
                      styles.categoryItemText,
                      selectedCategories.includes(category) && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Button title="Done" onPress={() => setShowCategoryPicker(false)} />
            </View>
          </View>
        </Modal>
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Button
          title={editingId ? 'Update Event' : 'Add Event'}
          onPress={handleAddOrUpdateEvent}
        />
        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ marginTop: 20 }}
        />
      </ScrollView>
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
    backgroundColor: '#fff',
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
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
    backgroundColor: '#62A0A5',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
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
    borderWidth: 1,
    borderColor: '#aaa',
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
    paddingBottom: 0,
  },
  modalContent: {
    backgroundColor: 'black',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    minHeight: 300,
    width: '100%',
  },
  categoryPickerButton: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  categoryPickerButtonText: {
    color: '#62A0A5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  pickerContainer: {
    maxHeight: 300,
    width: '100%',
  },
  categoryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedCategory: {
    backgroundColor: '#62A0A5',
  },
  categoryItemText: {
    color: '#fff',
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
  categoryText: {
    marginLeft: 10,
    marginBottom: 3,
  },
});
