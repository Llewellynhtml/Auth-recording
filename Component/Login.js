import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        const existingUsers = JSON.parse(localStorage.getItem('users')) || [];
        const user = existingUsers.find(user => user.email === email && user.password === password);

        if (user) {
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            Alert.alert("Login successful!");
            navigation.navigate('Recording');
        } else {
            Alert.alert("Invalid email or password.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Login</Text>
            <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
                Don’t have an account? Register here
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

export default Login;
