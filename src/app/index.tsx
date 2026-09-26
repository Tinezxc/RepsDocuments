// src/app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Define the data for our cards to keep the code clean
const portals = [
  {
    id: 'student',
    title: 'Student Portal',
    subtitle: 'Find rides, track your trip, stay safe',
    icon: 'school-outline', // Ionicons
    iconBg: '#EEF2FF',
    iconColor: '#6366F1',
    route: '/student', // Make sure you create src/app/student.tsx
  },
  {
    id: 'driver',
    title: 'Professional Driver Portal',
    subtitle: 'Offer rides, manage passengers &\nearnings',
    icon: 'steering', // MaterialCommunityIcons
    iconBg: '#E0F2FE',
    iconColor: '#0EA5E9',
    route: '/driver', // Make sure you create src/app/driver.tsx
  },
];

export default function PortalSelectionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section: Logo and Title */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="location" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>ShareTrip</Text>
        <Text style={styles.subtitle}>Share the Ride. Connect with Students.</Text>
      </View>

      {/* Middle Section: Portal Cards */}
      <View style={styles.cardsContainer}>
        {portals.map((portal) => (
          <TouchableOpacity
            key={portal.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push(portal.route as any)}
          >
            {/* Icon Box */}
            <View style={[styles.iconBox, { backgroundColor: portal.iconBg }]}>
              {portal.id === 'driver' ? (
                <MaterialCommunityIcons name={portal.icon as any} size={28} color={portal.iconColor} />
              ) : (
                <Ionicons name={portal.icon as any} size={28} color={portal.iconColor} />
              )}
            </View>

            {/* Text Content */}
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{portal.title}</Text>
              <Text style={styles.cardSubtitle}>{portal.subtitle}</Text>
            </View>

            {/* Right Chevron */}
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Section: Version Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ShareTrip v1.0 - CMDI Transportation System</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark Navy background from the image
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#6366F1', // Purple/Indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Add a slight glow effect
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8', // Slate gray
    textAlign: 'center',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16, // Space between cards
    marginTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  footer: {
    paddingBottom: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#475569',
  },
});