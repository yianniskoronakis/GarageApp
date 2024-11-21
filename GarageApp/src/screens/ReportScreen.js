import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import config from '../config';

const ReportScreen = ({ route, navigation }) => {
  const { garageId } = route.params; // Λαμβάνουμε το ID του garage
  const [reportText, setReportText] = useState('');

  const handleSubmitReport = async () => {
    if (!reportText.trim()) {
      Alert.alert('Error', 'Please provide details for the report.');
      return;
    }
  
    console.log('Submitting report for garageId:', garageId); // Προσθήκη καταγραφής
    console.log('Report Text:', reportText); // Προσθήκη καταγραφής
  
    try {
      const response = await fetch(`${config.server.baseUrl}/api/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ garageId, reportText }),
      });
  
      if (response.ok) {
        Alert.alert('Success', 'Your report has been submitted successfully.');
        navigation.goBack();
      } else {
        const errorData = await response.json();
        console.error('Error Response:', errorData); // Προσθήκη καταγραφής
        Alert.alert('Error', errorData.error || 'Failed to submit report.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Garage</Text>
      <Text style={styles.subtitle}>
        If you believe this garage violates our policies, please provide details below.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Enter report details..."
        value={reportText}
        onChangeText={setReportText}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmitReport}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ReportScreen;
