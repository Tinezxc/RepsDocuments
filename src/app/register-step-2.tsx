// src/app/register-step2.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterStep2Screen() {
  const router = useRouter();

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Checkbox States
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedEnrolled, setConfirmedEnrolled] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#334155" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 2 — Credentials</Text>
        </View>
      </View>

      {/* Progress Bar (Step 2 Active) */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarInactive} />
        <View style={styles.progressBarActive} />
        <View style={styles.progressBarInactive} />
        <View style={styles.progressBarInactive} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* SECTION 1: Profile Photo */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PROFILE PHOTO</Text>

          <View style={styles.photoUploadRow}>
            {/* Upload Icon Circle */}
            <View style={styles.photoCircle}>
              <Ionicons name="camera-outline" size={28} color="#94A3B8" />
            </View>

            {/* Upload Text & Button */}
            <View style={styles.photoTextContainer}>
              <Text style={styles.photoTitle}>Upload Profile Photo</Text>
              <Text style={styles.photoSubtitle}>Optional: JPG or PNG, max 5 MB</Text>

              <TouchableOpacity style={styles.chooseFileButton} activeOpacity={0.7}>
                <Ionicons name="cloud-upload-outline" size={18} color="#6366F1" />
                <Text style={styles.chooseFileText}>Choose file</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 2: Account Credentials */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACCOUNT CREDENTIALS</Text>

          {/* Username */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Create a username"
                placeholderTextColor="#94A3B8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Create a password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.inputFlex}
                placeholder="Re-enter your password"
                placeholderTextColor="#94A3B8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 3: Agreements */}
        <View style={styles.sectionCard}>
          {/* Agreement 1: Terms */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to the ShareTrip{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </TouchableOpacity>

          {/* Agreement 2: Enrolled Student */}
          <TouchableOpacity
            style={[styles.checkboxRow, { marginTop: 16 }]}
            onPress={() => setConfirmedEnrolled(!confirmedEnrolled)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, confirmedEnrolled && styles.checkboxChecked]}>
              {confirmedEnrolled && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I confirm that I am a currently enrolled student.
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Fixed Bottom Section */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            (!agreedToTerms || !confirmedEnrolled) && styles.createButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={!agreedToTerms || !confirmedEnrolled}
        >
          <Text style={styles.createButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonBottomText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleContainer: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  progressBarActive: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366F1',
  },
  progressBarInactive: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  /* ===== Profile Photo Section ===== */
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#F8FAFC',
  },
  photoTextContainer: {
    flex: 1,
  },
  photoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  photoSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  chooseFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chooseFileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366F1',
  },

  /* ===== Form Inputs ===== */
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: { marginRight: 10 },
  inputFlex: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },

  /* ===== Checkboxes ===== */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  linkText: {
    color: '#6366F1',
    fontWeight: '600',
  },

  /* ===== Bottom Buttons ===== */
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  createButton: {
    backgroundColor: '#6366F1',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#C7D2FE', // Lighter purple when disabled
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButtonBottom: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonBottomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});