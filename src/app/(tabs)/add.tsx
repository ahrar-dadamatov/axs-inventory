import { Ionicons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAlert from '../../components/CustomAlert';
import CustomPicker from '../../components/CustomPicker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

// Категории и Компании теперь будут загружаться из базы данных

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
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [base64Image2, setBase64Image2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<{ id: string, name: string, code: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const [companies, setCompanies] = useState<{ id: string, name: string, code: string }[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  
  const [categories, setCategories] = useState<{ id: string, name: string, code: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  const fetchBranches = async () => {
    const { data: branchData } = await supabase.from('branches').select('*');
    if (branchData) setBranches(branchData);
    
    const { data: compData } = await supabase.from('companies').select('*');
    if (compData) {
      setCompanies(compData);
      if (compData.length > 0) setSelectedCompany(compData[0].id);
    }
    
    const { data: catData } = await supabase.from('categories').select('*');
    if (catData) {
      setCategories(catData);
      if (catData.length > 0) setSelectedCategory(catData[0].id);
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

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Внимание', 'Нужно разрешение на использование камеры');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1, // original quality from picker
      base64: true,
    });

    if (!result.canceled) {
      // Compress manually using manipulator
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 600 } }],
        { compress: 0.2, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (index === 1) {
        setImage(manipResult.uri);
        setBase64Image(manipResult.base64 || null);
      } else {
        setImage2(manipResult.uri);
        setBase64Image2(manipResult.base64 || null);
      }
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
    if (!selectedCompany) {
      showAlert('Ошибка', 'Выберите компанию');
      return;
    }
    if (!selectedCategory) {
      showAlert('Ошибка', 'Выберите категорию');
      return;
    }

    setLoading(true);
    let imageUrl = null;
    let imageUrl2 = null;

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

      if (base64Image2) {
        const filePath2 = `${selectedBranch}/${Date.now()}_2.jpg`;
        const { error: uploadError2 } = await supabase.storage
          .from('inventory_images')
          .upload(filePath2, decode(base64Image2), {
            contentType: 'image/jpeg',
          });

        if (uploadError2) throw uploadError2;

        const { data: { publicUrl } } = supabase.storage
          .from('inventory_images')
          .getPublicUrl(filePath2);
          
        imageUrl2 = publicUrl;
      }

      const { data: insertedItem, error: insertError } = await (supabase.from('inventory_items').insert({
        name: finalName,
        quantity: parseInt(quantity, 10) || 1,
        usage_location: location,
        image_url: imageUrl,
        image_url_2: imageUrl2,
        branch_id: selectedBranch,
        company_id: selectedCompany,
        category_id: selectedCategory,
        created_by: profile?.id,
        // inventory_number генерируется триггером БД
      } as any).select().single());

      if (insertError) throw insertError;

      showAlert(
        'Успех', 
        `Инвентарь добавлен!\nПрисвоен номер: ${insertedItem?.inventory_number || 'Ожидание синхронизации'}\nПожалуйста, напишите этот номер на товаре.`, 
        true
      );
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
            <Text style={styles.sectionTitle}>Фотографии</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.imagePicker, { flex: 1 }]} onPress={() => pickImage(1)}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.image} />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="camera" size={32} color="#818cf8" style={{ marginBottom: 8, opacity: 0.9 }} />
                    <Text style={[styles.placeholderText, { fontSize: 13, textAlign: 'center' }]}>Общий вид</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.imagePicker, { flex: 1 }]} onPress={() => pickImage(2)}>
                {image2 ? (
                  <Image source={{ uri: image2 }} style={styles.image} />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="barcode-outline" size={32} color="#818cf8" style={{ marginBottom: 8, opacity: 0.9 }} />
                    <Text style={[styles.placeholderText, { fontSize: 13, textAlign: 'center' }]}>Штрихкод (доп.)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
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

            <Text style={styles.label}>Компания</Text>
            <CustomPicker
              options={companies.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))}
              selectedValue={selectedCompany}
              onValueChange={setSelectedCompany}
              placeholder="Выберите компанию..."
            />

            <Text style={styles.label}>Категория</Text>
            <CustomPicker
              options={categories.map(cat => ({ label: `${cat.name} (${cat.code})`, value: cat.id }))}
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
              placeholder="Выберите категорию..."
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
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
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
    height: 160,
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
