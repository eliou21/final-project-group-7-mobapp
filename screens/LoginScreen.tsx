import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation<any>();
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      // Admin hardcoded credentials
      if (email === 'admin@gmail.com' && password === 'admin') {
  login({
        id: 'admin',
        username: 'admin',
        password,
        firstName: 'Admin',
        lastName: 'User',
        email,
        phone: '0000000000',
        profilePicture: '', // or a default image path if needed
        role: 'admin',
    });
    return;
    }

      // Check AsyncStorage for registered users
      const usersJson = await AsyncStorage.getItem('users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];

      const matchedUser = users.find(
        (user: User) => user.email === email && user.password === password
      );

      if (matchedUser) {
    login({
        id: matchedUser.id,
        username: matchedUser.username,
        password: matchedUser.password,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        email: matchedUser.email,
        phone: matchedUser.phone,
        profilePicture: matchedUser.profilePicture,
        role: matchedUser.role || 'user',
    });
    } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while logging in.');
    }
  };

  return (
    <ImageBackground
      source={require('../assets/login bg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Login</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#ccc"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.signup} onPress={() => navigation.navigate('Signup')}>
          Don't have an account? Sign up here
        </Text>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    marginTop: 250,
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#62A0A5',
    letterSpacing: 1,
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
    alignItems: 'center',       // ✅ Center horizontally
    justifyContent: 'center',   // ✅ Center vertically
    marginTop: 20,
    },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  signup: {
    marginTop: 20,
    color: '#BAD6D9',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});