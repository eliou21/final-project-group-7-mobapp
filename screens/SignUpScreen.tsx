// SignupScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/types';

export default function SignupScreen() {
  const navigation = useNavigation<any>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const validate = () => {
    if (!firstName || !lastName || !userName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return false;
    }

    const phoneRegex = /^[0-9]{11}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Phone number must be 11 digits.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return false;
    }

    if (!profilePicture) {
      Alert.alert('Error', 'Please upload a profile picture.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      const newUser = {
        id: Date.now().toString(),
        username: userName, // normalized field name
        firstName,
        lastName,
        email,
        phone,
        password,
        profilePicture,
        role: 'user', // add default role
    };


      const existingUsersJson = await AsyncStorage.getItem('users');
      const existingUsers: User[] = existingUsersJson ? JSON.parse(existingUsersJson) : [];


      const usernameExists = existingUsers.some(user => user.username === userName);
      if (usernameExists) {
        Alert.alert('Error', 'Username already exists.');
        return;
      }

      const updatedUsers = [...existingUsers, newUser];
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));

      Alert.alert('Success', 'Registered successfully! Please log in.');
      navigation.navigate('Login');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred while registering.');
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera roll access to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'We need camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      base64: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/signup bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.title}>Signup</Text>

        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.profilePictureContainer}
            onPress={() =>
              Alert.alert('Choose an Option', 'Select a photo or take a new one', [
                { text: 'Select Photo', onPress: handlePickImage },
                { text: 'Take Photo', onPress: handleTakePhoto },
              ])
            }
          >
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
            ) : (
              <FontAwesome name="camera" size={40} color="#fff" />
            )}
          </TouchableOpacity>

          <TextInput placeholder="First Name" placeholderTextColor="#ccc" value={firstName} onChangeText={setFirstName} style={styles.input} />
          <TextInput placeholder="Last Name" placeholderTextColor="#ccc" value={lastName} onChangeText={setLastName} style={styles.input} />
          <TextInput placeholder="Username" placeholderTextColor="#ccc" value={userName} onChangeText={setUserName} style={styles.input} />
          <TextInput placeholder="Email" placeholderTextColor="#ccc" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} />
          <TextInput placeholder="Phone Number" placeholderTextColor="#ccc" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.input} />
          <TextInput placeholder="Password" placeholderTextColor="#ccc" secureTextEntry value={password} onChangeText={setPassword} style={styles.input} />
          <TextInput placeholder="Confirm Password" placeholderTextColor="#ccc" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} style={styles.input} />

          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.button} onPress={handleSignup}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <Text style={styles.loginText} onPress={() => navigation.navigate('Login')}>
              Already have an account? Log in here
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  scrollView: { flexGrow: 1, justifyContent: 'flex-start', paddingBottom: 40 },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 300,
    textAlign: 'center',
    color: '#62A0A5',
    letterSpacing: 1,
  },
  profilePictureContainer: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#62A0A5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#000',
  },
  button: {
    backgroundColor: '#62A0A5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 250,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 5,
    color: '#BAD6D9',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
