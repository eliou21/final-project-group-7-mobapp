import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function HeaderBanner() {
  return (
    <View style={styles.banner}>
      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.appName}>iVolunteer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7BB1B7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    gap: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  logo: {
    width: 48,
    height: 48,
  },
  
  appName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 