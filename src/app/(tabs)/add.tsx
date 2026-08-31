import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import CustomPicker from '../../components/CustomPicker';
import CustomAlert from '../../components/CustomAlert';

const CATEGORIES = [
  'Электроника',
  'Оргтехника',
  'Мебель',
  'Канцелярия',
  'Расходные материалы',
  'Другое'
];

const STANDARD_ITEMS = [
  'Ноутбук',
  'Монитор',
  'Системный блок',
  'Кресло офисное',
  'Стол офисный',
  'Принтер / МФУ',
  'Клавиатура',
  'Мышка',
  'Стеллаж',
  'Тумба',
  'Другое...'
];

const getCityPrefix = (cityName: string) => {
  const map: Record<string, string> = {
    'Алматы': 'ALM-', 'Астана': 'AST-', 'Шымкент': 'SHY-',
    'Актобе': 'AKB-', 'Караганда': 'KRG-', 'Тараз': 'TRZ-',
    'Усть-Каменогорск': 'UKG-', 'Павлодар': 'PVL-', 'Атырау': 'ATR-',
    'Семей': 'SEM-', 'Кызылорда': 'KZO-', 'Костанай': 'KSN-',
    'Актау': 'AKU-', 'Уральск': 'URA-', 'Петропавловск': 'PTR-',
    'Туркестан': 'TUR-', 'Кокшетау': 'KOK-', 'Темиртау': 'TEM-',
    'Талдыкорган': 'TDK-', 'Экибастуз': 'EKI-', 'Рудный': 'RUD-',
    'Жезказган': 'ZHE-'
  };
  return map[cityName] || 'ID-';
};

export default function AddItemScreen() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedItemType, setSelectedItemType] = useState(STANDARD_ITEMS[0]);
  const [customName, setCustomName] = useState('');
  
  const [quantity, setQuantity] = useState('1');
  const [location, setLocation] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{id: string, name: string}[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const [alertState, setAlertState] = useState({ visible: false, title: '', message: '', onSuccess: false });
  
  const { profile } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (profile?.branch_id && !selectedBranch) {
      setSelectedBranch(profile.branch_id);
    }
  }, [profile]);

  useEffect(() => {
    if (selectedBranch && branches.length > 0) {
      const branchName = branches.find(b => b.id === selectedBranch)?.name;
      if (branchName) {
        setInventoryNumber(getCityPrefix(branchName));
      }
    }
  }, [selectedBranch, branches]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from('branches').select('*');
    if (!error && data) {
      setBranches(data);
    }
  };

  const showAlert = (title: string, message: string, onSuccess = false) => {
    setAlertState({ visible: true, title, message, onSuccess });
  };

  const hideAlert = () => {
    const wasSuccess = alertState.onSuccess;
    setAlertState({ ...alertState, visible: false });
    if (wasSuccess) {
      router.push('/(tabs)/list');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Внимание', 'Нужно разрешение на использование камеры');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.4,
      maxWidth: 800,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
    }
  };

  const handleSave = async () => {
    if (!image || !base64Image) {
      showAlert('Ошибка', 'Обязательно добавьте фотографию товара!');
      return;
    }

    const finalName = selectedItemType === 'Другое...' ? customName : selectedItemType;
    
    if (!finalName.trim()) {
      showAlert('Ошибка', 'Введите название предмета');
      return;
    }
    if (!selectedBranch) {
      showAlert('Ошибка', 'Выберите филиал');
      return;
    }

    const prefix = getCityPrefix(branches.find(b => b.id === selectedBranch)?.name || '');
    if (!inventoryNumber.trim() || inventoryNumber.trim() === prefix) {
      showAlert('Ошибка', 'Введите инвентарный номер (ID)');
      return;
    }

    setLoading(true);
    let imageUrl = null;

    try {
      if (base64Image) {
        const filePath = `${selectedBranch}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('inventory_images')
          .upload(filePath, decode(base64Image), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('inventory_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      const { error: insertError } = await (supabase.from('inventory_items').insert({
        name: finalName,
        category: selectedCategory,
        quantity: parseInt(quantity, 10) || 1,
        usage_location: location,
        image_url: imageUrl,
        branch_id: selectedBranch,
        created_by: profile?.id,
        inventory_number: inventoryNumber.trim(),
      } as any));

      if (insertError) throw insertError;

      showAlert('Успех', 'Инвентарь добавлен!', true);
    } catch (error: any) {
      showAlert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const canSelectBranch = profile?.role === 'admin' || profile?.role === 'boss';

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Фотография</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.image} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={44} color="#818cf8" style={{marginBottom: 12, opacity: 0.9}} />
                  <Text style={styles.placeholderText}>Нажмите чтобы добавить фото</Text>
                </View>
              )}
            </TouchableOpacity>
          </BlurView>

          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <Text style={styles.label}>Филиал</Text>
            <CustomPicker
              options={branches.map(b => ({ label: b.name, value: b.id }))}
              selectedValue={selectedBranch}
              onValueChange={setSelectedBranch}
              placeholder="Выберите филиал..."
              disabled={!canSelectBranch}
            />
            {!canSelectBranch && <Text style={styles.hintText}>Филиал привязан к вашему аккаунту</Text>}

            <Text style={styles.label}>Категория</Text>
            <CustomPicker
              options={CATEGORIES.map(cat => ({ label: cat, value: cat }))}
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
              placeholder="Категория"
            />

            <Text style={styles.label}>Инвентарный номер (ID)</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: ALM-001"
              placeholderTextColor="#64748b"
              value={inventoryNumber}
              onChangeText={setInventoryNumber}
            />

            <Text style={styles.label}>Название товара</Text>
            <CustomPicker
              options={STANDARD_ITEMS.map(item => ({ label: item, value: item }))}
              selectedValue={selectedItemType}
              onValueChange={setSelectedItemType}
              placeholder="Название"
            />

            {selectedItemType === 'Другое...' && (
              <TextInput
                style={[styles.input, styles.marginTop]}
                placeholder="Введите название вручную..."
                placeholderTextColor="#64748b"
                value={customName}
                onChangeText={setCustomName}
              />
            )}

            <Text style={styles.label}>Количество (штук)</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <Text style={styles.label}>Локация (Кабинет, Ресепшн...)</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Кабинет 204"
              placeholderTextColor="#64748b"
              value={location}
              onChangeText={setLocation}
            />
          </BlurView>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Добавить в базу</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <CustomAlert 
        visible={alertState.visible} 
        title={alertState.title} 
        message={alertState.message} 
        onClose={hideAlert} 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 110,
    paddingBottom: 110,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
  },
  marginTop: {
    marginTop: 15,
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  imagePicker: {
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.5)',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.8,
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 10,
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
