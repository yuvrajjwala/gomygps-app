import Api from '@/config/Api';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/slices/authSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogin = async () => {

    const response = await Api.call(
      `/api/session`,
      'POST',
      { email, password },
      ""
    );
    console.log(response.data);
    if (response.data) {
      dispatch(setCredentials({
        token: response.data.token || "",
        user: response.data || {}
      }));
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo or App Icon */}
        <Image source={require('../assets/images/partial-react-logo.png')} style={styles.logo} />
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subheading}>Login to your account</Text>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="email" />}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          left={<TextInput.Icon icon="lock" />}
          right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure(!secure)} />}
          secureTextEntry={secure}
        />
        <TouchableOpacity style={styles.forgotWrap}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
        <Button
          mode="contained"
          style={styles.loginBtn}
          contentStyle={{ paddingVertical: 8 }}
          labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
          buttonColor="#2979FF"
          onPress={handleLogin}
        >
          Login
        </Button>
        <View style={styles.signupWrap}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}> Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 18,
    borderRadius: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2979FF',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgot: {
    color: '#2979FF',
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 18,
    elevation: 2,
  },
  signupWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    color: '#888',
    fontSize: 15,
  },
  signupLink: {
    color: '#2979FF',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 