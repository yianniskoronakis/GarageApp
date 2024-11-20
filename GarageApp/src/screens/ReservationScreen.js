import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const ReservationScreen = ({ navigation, route }) => {
    const { garageId } = route.params;
    const { user } = useAuth();

    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [userReservations, setUserReservations] = useState([]);

    // Συνάρτηση για φόρτωση κρατήσεων χρήστη
    const fetchUserReservations = async () => {
        try {
            const response = await fetch(`${config.server.baseUrl}/api/reservations/userReservations/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setUserReservations(data.userReservations);
                console.log("User Reservations:", data.userReservations); // Προσθήκη για έλεγχο
            } else {
                Alert.alert('Σφάλμα', data.message || 'Πρόβλημα στην ανάκτηση των κρατήσεων.');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Σφάλμα', 'Πρόβλημα στην επικοινωνία με τον διακομιστή.');
        }
    };    

    // Συνάρτηση για φόρτωση διαθέσιμων slots
        const fetchAvailableSlots = async () => {
            try {
                const response = await fetch(`${config.server.baseUrl}/api/garages/${garageId}/availableSlots`, {
                    headers: {
                        'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setAvailableSlots(data.availableHours); // Ενημέρωση των διαθέσιμων ωρών
                } else {
                    Alert.alert('Σφάλμα', data.message || 'Πρόβλημα στην ανάκτηση των slots.');
                }
            } catch (error) {
                console.error('Error:', error);
                Alert.alert('Σφάλμα', 'Πρόβλημα στην επικοινωνία με τον διακομιστή.');
            }
        };
    

    // Κλήση των fetch λειτουργιών κατά την εκκίνηση
    useEffect(() => {
        fetchUserReservations(); 
        fetchAvailableSlots();
        const interval = setInterval(() => {
            fetchAvailableSlots(); // Ανανεώνει τις διαθέσιμες ώρες κάθε 15 λεπτά
        }, 900000); // 900000 ms = 15 λεπτά
    
        return () => clearInterval(interval);
    }, [garageId, user.id]);

    // Λειτουργία επιλογής/αποεπιλογής slot
    const toggleSlotSelection = (slot) => {
        if (selectedSlots.includes(slot)) {
            setSelectedSlots(selectedSlots.filter(s => s !== slot));
        } else {
            setSelectedSlots([...selectedSlots, slot]);
        }
    };

    // Επιβεβαίωση κράτησης
    const handleConfirmReservation = async () => {
        if (selectedSlots.length === 0) {
            Alert.alert('Παρακαλώ επιλέξτε τουλάχιστον ένα χρονικό διάστημα');
            return;
        }
    
        try {
            const response = await fetch(`${config.server.baseUrl}/api/reservations/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    garageId,
                    userId: user.id,
                    startHours: selectedSlots,
                }),
            });
    
            const data = await response.json();
            if (response.ok) {
                setSelectedSlots([]);
                fetchAvailableSlots(); // Ανανεώνουμε τις διαθέσιμες ώρες
                fetchUserReservations(); // Επαναφόρτωση των κρατήσεων
            } else {
                Alert.alert('Σφάλμα', data.message || 'Σφάλμα κατά την κράτηση.');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Σφάλμα', 'Πρόβλημα στην επικοινωνία με τον διακομιστή.');
        }
    };
    
    

    // Ακύρωση κράτησης
    const handleCancelReservation = async (reservationId) => {
        try {
            const response = await fetch(`${config.server.baseUrl}/api/reservations/${reservationId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
                },
            });

            const data = await response.json();
            if (response.ok) {
                fetchUserReservations(); // Επαναφόρτωση των κρατήσεων μετά από διαγραφή
            } else {
                Alert.alert('Σφάλμα', data.message || 'Σφάλμα κατά τη διαγραφή της κράτησης.');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Σφάλμα', 'Πρόβλημα στην επικοινωνία με τον διακομιστή.');
        }
    };

    // Προβολή slot για κράτηση
    const renderTimeSlot = ({ item }) => (
        <TouchableOpacity
            style={{
                padding: 10,
                backgroundColor: selectedSlots.includes(item) ? '#007BFF' : '#f4f4f4',
                marginVertical: 5,
                borderRadius: 5,
            }}
            onPress={() => toggleSlotSelection(item)}
        >
            <Text style={{ color: selectedSlots.includes(item) ? 'white' : 'black' }}>{item}</Text>
        </TouchableOpacity>
    );

    // Προβολή κράτησης χρήστη
    const renderUserReservation = ({ item }) => (
        <View style={styles.reservationItem}>
            <Text>
                {`Time: ${item.startHour}`}
            </Text>
            <Button title="Cancel" onPress={() => handleCancelReservation(item._id)} />
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select reservation's hours:</Text>
            <FlatList
                data={availableSlots}
                renderItem={renderTimeSlot}
                keyExtractor={(item) => item}
                ListFooterComponent={
                    <View style={styles.footer}>
                        <Button title="Confirm" onPress={handleConfirmReservation} />
                    </View>
                }
            />

            <Text style={styles.title}>My reservations:</Text>
            <FlatList
                data={userReservations}
                renderItem={renderUserReservation}
                keyExtractor={(item) => item._id}
            />
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
    footer: {
        marginTop: 20,
        paddingBottom: 20,
    },
    reservationItem: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#f9f9f9',
        borderRadius: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default ReservationScreen;