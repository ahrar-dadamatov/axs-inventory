import { Tabs } from 'expo-router';
import { useAuth } from '../../providers/AuthProvider';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function TabsLayout() {
  const { profile } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Вы уверены, что хотите выйти?')) {
        supabase.auth.signOut();
      }
    } else {
      Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Выйти', style: 'destructive', onPress: () => supabase.auth.signOut() }
      ]);
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTransparent: true,
        headerBackground: () => (
          <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.6)' }]} />
        ),
        headerTitleStyle: {
          color: '#f8fafc',
          fontWeight: '800',
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          elevation: 0,
          backgroundColor: 'transparent',
          height: 85,
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} />
        ),
        tabBarActiveTintColor: '#818cf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 12,
          marginBottom: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Дашборд',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {profile?.role === 'admin' && (
                <TouchableOpacity style={{ marginRight: 20 }} onPress={() => router.push('/admin/users')}>
                  <Ionicons name="settings-outline" size={24} color="#f8fafc" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={{ marginRight: 20 }} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={26} color="#f8fafc" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Инвентарь',
          headerShown: false, // Мы используем кастомный хедер в list.tsx
          tabBarIcon: ({ color }) => <Ionicons name="cube-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Добавить',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
