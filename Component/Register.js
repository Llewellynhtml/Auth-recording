import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';

const Register = ({ navigation }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        const userData = { firstName, lastName, email, password, recordings: [] };

        const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = existingUsers.find(user => user.email === email);

        if (userExists) {
            Alert.alert("User already exists. Please log in.");
            return;
        }

        existingUsers.push(userData);
        localStorage.setItem('users', JSON.stringify(existingUsers));

        Alert.alert("Registration successful! Please log in.");
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Create an Account</Text>
            <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
            <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
                Already have an account? Login here
            </Text>
        </View>
    );
};

const styles = {
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    input: { width: '100%', padding: 10, borderColor: '#ddd', borderWidth: 1, borderRadius: 5, marginBottom: 10 },
    button: { backgroundColor: '#FF6F61', padding: 15, borderRadius: 5, width: '100%', alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    link: { color: '#FF6F61', marginTop: 10 }
};

export default Register;
