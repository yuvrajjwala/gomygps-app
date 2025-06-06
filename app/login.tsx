import Api from '@/config/Api';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setCredentials } from './store/slices/authSlice';
import { setupNotifications } from './utils/notifications';
import { updateNotificationToken } from './utils/notificationToken';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();


  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await Api.call(
        `/api/session`,
        'POST',
        { email, password },
        true
      );
      if (response.data) {
        dispatch(setCredentials({
          token: response.data.token || "",
          user: response.data || {}
        }));
        await updateNotificationToken();
        router.push('/(tabs)');
      } else {
        setError('Please check your email or password.');
      }
    } catch (err) {
      setError('Please check your email or password.');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    setupNotifications();
  }, []); 

  return (
    <ImageBackground 
      source={{uri: 'https://images.pexels.com/photos/6169859/pexels-photo-6169859.jpeg?auto=compress&cs=tinysrgb&w=1200'}} 
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            <View style={styles.container}>
              <Image source={require('../assets/images/icon.png')} style={styles.logo} />
              <Text style={styles.heading}>Welcome Back</Text>
              <Text style={styles.subheading}>Login to your account</Text>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="flat"
                left={<TextInput.Icon icon="email" />}
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { primary: 'black' } }}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="flat"
                left={<TextInput.Icon icon="lock" />}
                right={<TextInput.Icon icon={secure ? 'eye-off' : 'eye'} onPress={() => setSecure(!secure)} />}
                secureTextEntry={secure}
                theme={{ colors: { primary: 'black' } }}
              />
              {error ? (
                <Text style={{ color: '#FF3D00', marginBottom: 10, fontWeight: 'bold', textAlign: 'center' }}>{error}</Text>
              ) : null}
              <Button
                mode="contained"
                style={styles.loginBtn}
                contentStyle={{ paddingVertical: 8 }}
                labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
                buttonColor="#FFFFFF"
                textColor="#000000"
                onPress={handleLogin}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  'Login'
                )}
              </Button>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    opacity: 0.8,
  },
  input: {
    width: '100%',
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loginBtn: {
    width: '100%',
    borderRadius: 10,
    marginBottom: 18,
    elevation: 2,
    marginTop: 20,
  },
}); 