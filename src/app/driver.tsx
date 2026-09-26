import { View, Text, StyleSheet } from 'react-native';

export default function DriverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Driver Portal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  text: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
});