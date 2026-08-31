import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function PendingScreen() {
  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⏳</Text>
            </View>
            <Text style={styles.title}>Ожидание доступа</Text>
            <Text style={styles.text}>
              Ваш аккаунт успешно зарегистрирован, но администратор еще не выдал вам доступ к филиалу.
            </Text>
            <Text style={styles.textHighlight}>
              Пожалуйста, подождите или свяжитесь с администратором.
            </Text>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={() => supabase.auth.signOut()}
            >
              <Text style={styles.buttonText}>Выйти из аккаунта</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glassCard: {
    borderRadius: 30,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 20,
    color: '#f8fafc',
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#cbd5e1',
    lineHeight: 24,
  },
  textHighlight: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    color: '#818cf8',
    fontWeight: '600',
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
  },
});
