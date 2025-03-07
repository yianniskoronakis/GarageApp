import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

const SetAvailabilityScreen = ({ route, navigation }) => {
    const { garageId } = route.params;

    const [availableHours, setAvailableHours] = useState([]);
    const [selectedHours, setSelectedHours] = useState([]);

 
    useEffect(() => {
        const generateTimeSlots = () => {
            const slots = [];
            let currentTime = new Date();

 
            currentTime.setHours(currentTime.getHours() + 1);
            currentTime.setMinutes(0);
            currentTime.setSeconds(0);
            currentTime.setMilliseconds(0);

            for (let i = 0; i < 24; i++) {
                const slot = `${currentTime.getHours().toString().padStart(2, '0')}:00`;
                slots.push(slot);
                currentTime.setHours(currentTime.getHours() + 1); }

            setAvailableHours(slots);
        };

        generateTimeSlots();
    }, []);


    const toggleHourSelection = (hour) => {
        if (selectedHours.includes(hour)) {
            setSelectedHours(selectedHours.filter((h) => h !== hour));
        } else {
            setSelectedHours([...selectedHours, hour]);
        }
    };

    
    const handleSetAvailability = async () => {
        try {
            const response = await fetch(`${config.server.baseUrl}/api/garages/${garageId}/setAvailability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                },
                body: JSON.stringify({ availableHours: selectedHours }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error:', errorText);
                Alert.alert('Σφάλμα', 'Πρόβλημα κατά την ενημέρωση των διαθέσιμων ωρών.');
                return;
            }

            const data = await response.json();
            navigation.goBack();
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Σφάλμα', 'Πρόβλημα στην επικοινωνία με τον διακομιστή.');
        }
    };

    const renderHourSlot = ({ item }) => (
        <TouchableOpacity
            style={{
                padding: 10,
                backgroundColor: selectedHours.includes(item) ? '#007BFF' : '#f4f4f4',
                marginVertical: 5,
                borderRadius: 5,
            }}
            onPress={() => toggleHourSelection(item)}
        >
            <Text style={{ color: selectedHours.includes(item) ? 'white' : 'black' }}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select available hours:</Text>
            <FlatList
                data={availableHours}
                renderItem={renderHourSlot}
                keyExtractor={(item) => item}
            />
            <Button title="Save" onPress={handleSetAvailability} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default SetAvailabilityScreen;