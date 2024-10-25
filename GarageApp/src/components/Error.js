// components/Error.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Error = ({ message }) => {
  if (!message) return null;
  
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 5,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
  },
});

export default Error;
