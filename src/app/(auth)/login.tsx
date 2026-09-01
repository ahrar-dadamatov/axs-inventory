import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, Modal, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../../components/CustomAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Загружаем сохраненный логин и пароль при старте
    const loadCredentials = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('saved_username');
        const savedPassword = await AsyncStorage.getItem('saved_password');
        if (savedUsername) setUsername(savedUsername);
        if (savedPassword) setPassword(savedPassword);
      } catch (e) {
        console.log('Failed to load credentials');
      }
    };
    loadCredentials();
  }, []);

  // Registration Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [alertState, setAlertState] = useState({ visible: false, title: '', message: '' });

  const showAlert = (title: string, message: string) => {
    setAlertState({ visible: true, title, message });
  };

  const autoGenerateUsername = (first: string, last: string) => {
    const f = first.trim().toLowerCase();
    const l = last.trim().toLowerCase();
    if (f && l) return `${f}.${l[0]}`;
    if (f) return f;
    return l;
  };

  const generatedUsername = autoGenerateUsername(firstName, lastName);

  async function signInWithUsername() {
    if (!username || !password) {
      showAlert('Внимание', 'Пожалуйста, введите логин или email, а также пароль');
      return;
    }
    
    setLoading(true);
    let loginEmail = username.trim().toLowerCase();

    // Если введено без '@', значит это Username. Надо получить реальный Email через RPC.
    if (!loginEmail.includes('@')) {
      const { data: realEmail, error: rpcError } = await supabase.rpc('get_email_by_username', { p_username: loginEmail });
      
      if (rpcError) {
        console.error("RPC Error:", rpcError);
      }
      
      if (realEmail) {
        loginEmail = realEmail;
      } else {
        // Если RPC не вернул email (или функция еще не создана в БД),
        // используем старый фоллбэк метод для совместимости.
        loginEmail = `${loginEmail.replace(/\s+/g, '_')}@axs.local`;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password,
    });

    if (error) {
      showAlert('Ошибка входа', error.message === 'Invalid login credentials' ? 'Неверный логин или пароль' : error.message);
    } else {
      // Сохраняем логин и пароль при успешном входе
      try {
        await AsyncStorage.setItem('saved_username', username);
        await AsyncStorage.setItem('saved_password', password);
      } catch (e) {
        console.log('Failed to save credentials');
      }
    }
    setLoading(false);
  }

  async function handleRegistration() {
    if (!firstName || !lastName || !regEmail || !regPassword) {
      showAlert('Внимание', 'Пожалуйста, заполните все поля');
      return;
    }
    if (!regEmail.includes('@')) {
      showAlert('Внимание', 'Пожалуйста, введите корректный Email адрес');
      return;
    }
    if (regPassword.length < 6) {
      showAlert('Внимание', 'Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);
    const finalUsername = autoGenerateUsername(firstName, lastName);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      options: {
        data: {
          username: finalUsername,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }
      }
    });

    if (error) {
      showAlert('Ошибка', error.message);
    } else if (data.session) {
      setModalVisible(false);
      showAlert('Регистрация', 'Вы зарегистрированы. Ожидайте подтверждения администратором.');
    } else {
      setModalVisible(false);
      showAlert('Регистрация', 'Аккаунт успешно создан! На вашу почту отправлено письмо для подтверждения.');
    }
    setLoading(false);
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/logo.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
            <Text style={styles.title}>AXS Инвентарь</Text>
            <Text style={styles.subtitle}>Система учета имущества</Text>
          </View>
          
          <BlurView intensity={20} tint="dark" style={styles.glassCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Логин или Email</Text>
              <TextInput
                style={styles.input}
                onChangeText={setUsername}
                value={username}
                placeholder="ivan_petrov или ivan@mail.com"
                placeholderTextColor="#64748b"
                autoCapitalize={'none'}
                autoCorrect={false}
                textContentType="username"
                autoComplete="username"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Пароль</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={true}
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                autoCapitalize={'none'}
                textContentType="password"
                autoComplete="current-password"
              />
            </View>

            <TouchableOpacity style={styles.buttonPrimary} disabled={loading} onPress={signInWithUsername}>
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonPrimaryText}>Войти</Text>}
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonSecondaryText}>Создать аккаунт</Text>
            </TouchableOpacity>
          </BlurView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <BlurView intensity={40} tint="dark" style={styles.blurModal}>
              <Text style={styles.modalTitle}>Регистрация</Text>
              <Text style={styles.modalSubtitle}>Пожалуйста, укажите ваши данные</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Имя</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={setFirstName}
                    value={firstName}
                    placeholder="Иван"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>Фамилия</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={setLastName}
                    value={lastName}
                    placeholder="Петров"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email (для подтверждения)</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setRegEmail}
                  value={regEmail}
                  placeholder="ivan@example.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.generatedUsernameContainer}>
                <Text style={styles.generatedUsernameLabel}>Ваш логин (сохраните его):</Text>
                <Text style={styles.generatedUsernameValue}>{generatedUsername || '...'}</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Пароль</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={setRegPassword}
                  value={regPassword}
                  secureTextEntry={true}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={handleRegistration} disabled={loading}>
                  <LinearGradient
                    colors={['#4f46e5', '#7c3aed']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalBtnGradient}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnSaveText}>Зарегистрироваться</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertState.visible} 
        title={alertState.title} 
        message={alertState.message} 
        onClose={() => setAlertState({ ...alertState, visible: false })} 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 35,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#818cf8',
    marginTop: 8,
    fontWeight: '600',
  },
  glassCard: {
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#f8fafc',
  },
  buttonPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonPrimaryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  buttonSecondaryText: {
    color: '#818cf8',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  blurModal: {
    flex: 1,
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 20,
  },
  generatedUsernameContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 20,
    alignItems: 'center',
  },
  generatedUsernameLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 4,
  },
  generatedUsernameValue: {
    color: '#818cf8',
    fontSize: 22,
    fontWeight: '900',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 16,
  },
  modalBtnSave: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
