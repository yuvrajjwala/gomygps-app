import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DriversScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Drivers Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
}); 