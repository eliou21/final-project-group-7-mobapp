import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import HeaderBanner from '../components/HeaderBanner';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setPhone(user.phone || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        const newProfilePicture = result.assets[0].uri;
        setProfilePicture(newProfilePicture);
        // Update user profile with new image
        if (user) {
          const updatedUser = {
            ...user,
            profilePicture: newProfilePicture,
          };
          updateUser(updatedUser);
          
          // Update in AsyncStorage
          const usersStr = await AsyncStorage.getItem('users');
          if (usersStr) {
            const users = JSON.parse(usersStr);
            const updatedUsers = users.map((u: any) =>
              u.email === user.email ? updatedUser : u
            );
            await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        username,
        phone,
        profilePicture,
      };

      // Update in AsyncStorage
      const usersStr = await AsyncStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const updatedUsers = users.map((u: any) =>
          u.email === user.email ? updatedUser : u
        );
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      }

      // Update in context
      updateUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      const usersStr = await AsyncStorage.getItem('users');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const userIndex = users.findIndex((u: any) => u.email === user.email);

        if (userIndex === -1) {
          throw new Error('User not found');
        }

        // Verify current password
        if (users[userIndex].password !== currentPassword) {
          Alert.alert('Error', 'Current password is incorrect.');
          return;
        }

        // Update password
        users[userIndex].password = newPassword;
        await AsyncStorage.setItem('users', JSON.stringify(users));

        // Update in context
        updateUser({ ...user, password: newPassword });

        // Clear password fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);

        Alert.alert('Success', 'Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Failed to change password. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaCustom}>
      <HeaderBanner />
      <ScrollView style={styles.containerCustom} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.bannerHeader}>
          <Text style={styles.bannerTitle}>Profile</Text>
          <Text style={styles.bannerSubtitle}>View and update your profile information</Text>
        </View>
        <View style={styles.dividerCustom} />
        {/* Profile Picture Section */}
        <View style={styles.sectionCustom}>
          <Text style={styles.sectionTitleCustom}>Profile Picture</Text>
          <View style={styles.profileImageContainerCustom}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.profileImageCustom} />
            ) : (
              <View style={[styles.profileImageCustom, styles.placeholderImageCustom]}>
                <Ionicons name="person" size={50} color="#ccc" />
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButtonCustom} onPress={pickImage}>
              <Text style={styles.changePhotoTextCustom}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* User Information Section */}
        <View style={styles.sectionCustom}>
          <Text style={styles.sectionTitleCustom}>Personal Information</Text>
          <View style={styles.infoRowCustom}>
            <Text style={styles.labelCustom}>First Name:</Text>
            <Text style={styles.valueCustom}>{user?.firstName}</Text>
          </View>
          <View style={styles.infoRowCustom}>
            <Text style={styles.labelCustom}>Last Name:</Text>
            <Text style={styles.valueCustom}>{user?.lastName}</Text>
          </View>
          <View style={styles.infoRowCustom}>
            <Text style={styles.labelCustom}>Email:</Text>
            <Text style={styles.valueCustom}>{user?.email}</Text>
          </View>
          {isEditing ? (
            <>
              <TextInput
                style={styles.inputCustom}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
              />
              <TextInput
                style={styles.inputCustom}
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.buttonRowCustom}>
                <TouchableOpacity
                  style={[styles.buttonCustom, styles.saveButtonCustom]}
                  onPress={handleUpdateProfile}
                >
                  <Text style={styles.buttonTextCustom}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buttonCustom, styles.cancelButtonCustom]}
                  onPress={() => {
                    setIsEditing(false);
                    setUsername(user?.username || '');
                    setPhone(user?.phone || '');
                  }}
                >
                  <Text style={styles.buttonTextCustom}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRowCustom}>
                <Text style={styles.labelCustom}>Username:</Text>
                <Text style={styles.valueCustom}>{user?.username || 'Not set'}</Text>
              </View>
              <View style={styles.infoRowCustom}>
                <Text style={styles.labelCustom}>Phone:</Text>
                <Text style={styles.valueCustom}>{user?.phone || 'Not set'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.buttonCustom, styles.editButtonCustom]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonTextCustom}>Edit Profile</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        {/* Change Password Section */}
        <View style={styles.sectionCustom}>
          <Text style={styles.sectionTitleCustom}>Change Password</Text>
          {isChangingPassword ? (
            <>
              <TextInput
                style={styles.inputCustom}
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.inputCustom}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                style={styles.inputCustom}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <View style={styles.buttonRowCustom}>
                <TouchableOpacity
                  style={[styles.buttonCustom, styles.saveButtonCustom]}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.buttonTextCustom}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buttonCustom, styles.cancelButtonCustom]}
                  onPress={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.buttonTextCustom}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.buttonCustom, styles.editButtonCustom]}
              onPress={() => setIsChangingPassword(true)}
            >
              <Text style={styles.buttonTextCustom}>Change Password</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaCustom: {
    flex: 1,
    backgroundColor: '#FFEAB8',
  },
  containerCustom: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
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
  dividerCustom: {
    height: 3,
    backgroundColor: '#62A0A5',
    marginBottom: 10,
    borderRadius: 2,
    width: '100%',
    alignSelf: 'center',
  },
  sectionCustom: {
    backgroundColor: 'rgb(255, 252, 236)',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#7F4701',
    padding: 22,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitleCustom: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#7F4701',
  },
  infoRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#7F4701',
  },
  labelCustom: {
    fontSize: 16,
    color: '#7F4701',
  },
  valueCustom: {
    fontSize: 16,
    color: '#7F4701',
    fontWeight: '500',
  },
  inputCustom: {
    borderWidth: 2,
    borderColor: '#7F4701',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  buttonRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  buttonCustom: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 0,
  },
  editButtonCustom: {
    backgroundColor: '#62A0A5',
    borderWidth: 2,
    borderColor: '#fff',
    marginTop: 10,
  },
  saveButtonCustom: {
    backgroundColor: '#62A0A5',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cancelButtonCustom: {
    backgroundColor: '#ff6b6b',
    borderWidth: 2,
    borderColor: '#fff',
  },
  buttonTextCustom: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileImageContainerCustom: {
    alignItems: 'center',
    marginVertical: 6,
    marginBottom: 0,
  },
  profileImageCustom: {
    width: 120,
    height: 120,
    borderRadius: 75,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: '#7F4701',
  },
  placeholderImageCustom: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButtonCustom: {
    backgroundColor: '#62A0A5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoTextCustom: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
