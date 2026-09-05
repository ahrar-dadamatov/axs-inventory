import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Animated } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Database } from '../../types/database';

type Item = Database['public']['Tables']['inventory_items']['Row'] & {
  categories?: { name: string } | null;
};

export default function DashboardScreen() {
  const { profile } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({ total: 0, categories: 0 });
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const fetchStats = async () => {
    let query = supabase.from('inventory_items').select('*, categories(name)', { count: 'exact' }) as any;
    let recentQuery = supabase.from('inventory_items').select('*, categories(name)').order('created_at', { ascending: false }).limit(3) as any;
      
    if (profile?.role !== 'admin' && profile?.role !== 'boss') {
      if (profile?.branch_id) {
        query = query.eq('branch_id', profile.branch_id);
        recentQuery = recentQuery.eq('branch_id', profile.branch_id);
      } else {
        setStats({ total: 0, categories: 0 });
        setRecentItems([]);
        return;
      }
    }
      
    const { data, count } = await query;
    if (data && count !== null) {
      const uniqueCats = new Set(data.map(i => i.categories?.name).filter(Boolean));
      setStats({ total: count, categories: uniqueCats.size });
    }
    
    const { data: recentData } = await recentQuery;
    if (recentData) {
      setRecentItems(recentData);
    }
  };

  const displayName = profile?.first_name || profile?.username || profile?.email?.split('@')[0] || '';

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
            <View style={styles.header}>
              <Text style={styles.greeting}>Здравствуйте{displayName ? `, ${displayName}` : ''}!</Text>
              <View style={styles.roleBadge}>
                <Ionicons 
                  name={profile?.role === 'admin' ? 'shield-checkmark' : profile?.role === 'boss' ? 'star' : 'person'} 
                  size={14} color="#818cf8" style={{marginRight: 6}} 
                />
                <Text style={styles.roleText}>
                  {profile?.role === 'admin' ? 'Администратор' : profile?.role === 'boss' ? 'Начальник' : 'Сотрудник'}
                </Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <BlurView intensity={20} tint="dark" style={styles.statsCardHalf}>
                <Ionicons name="cube" size={24} color="#6366f1" />
                <Text style={styles.cardTitle}>Имущество</Text>
                <Text style={styles.cardNumber}>{stats.total}</Text>
                <Text style={styles.cardSub}>всего штук</Text>
              </BlurView>
              
              <BlurView intensity={20} tint="dark" style={styles.statsCardHalf}>
                <Ionicons name="pricetags" size={24} color="#8b5cf6" />
                <Text style={styles.cardTitle}>Категории</Text>
                <Text style={styles.cardNumber}>{stats.categories}</Text>
                <Text style={styles.cardSub}>используется</Text>
              </BlurView>
            </View>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => router.push('/(tabs)/add')}
            >
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.actionButtonText}>+ Добавить инвентарь</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Недавно добавленные</Text>
            <View style={styles.recentList}>
              {recentItems.length > 0 ? (
                recentItems.map((item, index) => (
                  <BlurView key={item.id} intensity={15} tint="dark" style={styles.recentItemCard}>
                  <View style={styles.recentIconContainer}>
                    <Ionicons name="cube-outline" size={20} color="#818cf8" />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{item.name}</Text>
                    <Text style={styles.recentCategory}>{item.categories?.name || 'Без категории'}</Text>
                  </View>
                  <View style={styles.recentQuantityBadge}>
                    <Text style={styles.recentQuantity}>{item.quantity} шт</Text>
                  </View>
                </BlurView>
              ))
            ) : (
              <BlurView intensity={10} tint="dark" style={styles.emptyRecent}>
                <Text style={styles.emptyRecentText}>Пока ничего не добавлено</Text>
                </BlurView>
              )}
            </View>
            
          </Animated.View>
          
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 110,
    paddingBottom: 110,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#818cf8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 16,
  },
  statsCardHalf: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardNumber: {
    color: '#f8fafc',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 4,
  },
  cardSub: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 30,
  },
  buttonGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 16,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  recentItemCard: {
    flex: 1,
    minWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recentCategory: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
  recentQuantityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  recentQuantity: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyRecent: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyRecentText: {
    color: '#64748b',
    fontWeight: '600',
  }
});
