import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl, TextInput, SafeAreaView, Animated, useWindowDimensions } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/database';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import CustomPicker from '../../components/CustomPicker';

type Item = Database['public']['Tables']['inventory_items']['Row'] & {
  branches?: { name: string } | null;
};

export default function InventoryListScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const numCols = isDesktop ? 3 : 1;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, branches(name)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error);
      } else {
        setItems(data || []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const uniqueBranches = useMemo(() => {
    const branches = items.map(i => i.branches?.name).filter(Boolean) as string[];
    return Array.from(new Set(branches)).sort();
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = items.map(i => i.category).filter(Boolean) as string[];
    return Array.from(new Set(categories)).sort();
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesSearch = search === '' || 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      (item.inventory_number && item.inventory_number.toLowerCase().includes(search.toLowerCase())) ||
      (item.usage_location && item.usage_location.toLowerCase().includes(search.toLowerCase())) ||
      (item.branches?.name && item.branches.name.toLowerCase().includes(search.toLowerCase()));
      
    const matchesBranch = filterBranch === '' || item.branches?.name === filterBranch;
    const matchesCategory = filterCategory === '' || item.category === filterCategory;

    return matchesSearch && matchesBranch && matchesCategory;
  });

  const renderItem = ({ item, index }: { item: Item, index: number }) => (
    <Animated.View style={[
      styles.cardContainer, 
      isDesktop && { flex: 1, margin: 8, minWidth: 300, maxWidth: '33.33%' },
      { 
        opacity: fadeAnim, 
        transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + index * 5, 0] }) }] 
      }
    ]}>
      <BlurView intensity={20} tint="dark" style={styles.card}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>Нет фото</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{item.quantity} шт.</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.locationContainer}>
            {item.inventory_number && (
              <Text style={styles.idBadge}>
                <Ionicons name="barcode-outline" size={12} /> {item.inventory_number}
              </Text>
            )}
            {item.category && (
              <Text style={styles.categoryText}>
                <Ionicons name="pricetag" size={12} /> {item.category}
              </Text>
            )}
            <Text style={styles.branchName}>
              <Ionicons name="business" size={12} /> {item.branches?.name || 'Неизвестный филиал'}
            </Text>
            <Text style={styles.itemDetail}>
              <Ionicons name="location" size={12} /> {item.usage_location || 'Локация не указана'}
            </Text>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <BlurView intensity={30} tint="dark" style={styles.header}>
          <Text style={styles.headerTitle}>Инвентаризация</Text>
          
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={{ flex: 1, color: '#f8fafc' }}
              placeholder="Поиск по названию, ID или локации..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          
          <View style={styles.filtersContainer}>
            <View style={styles.pickerWrapper}>
              <CustomPicker
                options={[
                  { label: "Все города", value: "" },
                  ...uniqueBranches.map(b => ({ label: b, value: b }))
                ]}
                selectedValue={filterBranch}
                onValueChange={setFilterBranch}
                placeholder="Все города..."
              />
            </View>
            
            <View style={styles.pickerWrapper}>
              <CustomPicker
                options={[
                  { label: "Все категории", value: "" },
                  ...uniqueCategories.map(c => ({ label: c, value: c }))
                ]}
                selectedValue={filterCategory}
                onValueChange={setFilterCategory}
                placeholder="Все категории..."
              />
            </View>
          </View>
        </BlurView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#818cf8" />
          </View>
        ) : (
          <View style={styles.listWrapper}>
            <FlatList
              key={numCols}
              numColumns={numCols}
              data={filteredItems}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#818cf8" />}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>Ничего не найдено</Text>
                </View>
              }
            />
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 110,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  image: {
    width: 120,
    height: '100%',
    minHeight: 130,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  noImage: {
    width: 120,
    minHeight: 130,
    backgroundColor: 'rgba(255,255,255,0.02)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  noImageText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    flex: 1,
    marginRight: 8,
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  locationContainer: {
    marginTop: 4,
    gap: 4,
  },
  idBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 2,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c084fc',
    marginBottom: 2,
  },
  branchName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818cf8',
  },
  itemDetail: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
