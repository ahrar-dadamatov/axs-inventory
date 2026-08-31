import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, Button, SafeAreaView, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { Database } from '../../types/database';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];

const COMPANIES = ['AURA', 'GREENLIGHT'];

export default function UsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'employee' | 'boss'>('employee');
  const [modalVisible, setModalVisible] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUsersAndBranches();
    } else {
      Alert.alert('Ошибка', 'Нет доступа');
    }
  }, [profile]);

  const fetchUsersAndBranches = async () => {
    try {
      const [usersResponse, branchesResponse] = await Promise.all([
        supabase.from('profiles').select('*').neq('role', 'admin'),
        supabase.from('branches').select('*')
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (branchesResponse.error) throw branchesResponse.error;

      setUsers(usersResponse.data || []);
      setBranches(branchesResponse.data || []);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    } finally {
      setLoading(false);
    }
  };

  const openManageModal = (user: Profile) => {
    setSelectedUser(user);
    setSelectedBranch(user.branch_id || '');
    setSelectedCompany(user.company || '');
    setSelectedRole(user.role === 'admin' ? 'employee' : user.role); // just in case
    setModalVisible(true);
  };

  const saveUser = async () => {
    if (!selectedUser) return;
    if (!selectedBranch) {
      Alert.alert('Ошибка', 'Выберите филиал');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ branch_id: selectedBranch, role: selectedRole, company: selectedCompany, is_approved: true } as any)
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      Alert.alert('Успех', 'Пользователь подтвержден и назначен в филиал');
      setModalVisible(false);
      fetchUsersAndBranches();
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const renderUser = ({ item }: { item: Profile }) => {
    const branchName = branches.find(b => b.id === item.branch_id)?.name;
    const displayName = item.username || item.email.split('@')[0];
    
    return (
      <BlurView intensity={20} tint="dark" style={styles.card}>
        <View style={styles.cardInfo}>
          <View style={styles.row}>
            <Ionicons name="person" size={16} color="#f8fafc" style={{marginRight: 6}} />
            <Text style={styles.username}>{displayName}</Text>
          </View>
          <View style={item.is_approved ? styles.statusBadgeApproved : styles.statusBadgePending}>
            <Text style={item.is_approved ? styles.statusTextApproved : styles.statusTextPending}>
              {item.is_approved ? 'Подтвержден' : 'Ожидает'}
            </Text>
          </View>
          {branchName && (
            <View style={styles.row}>
              <Ionicons name="location" size={14} color="#818cf8" style={{marginRight: 4}} />
              <Text style={styles.branch}>{branchName}</Text>
            </View>
          )}
          {item.company && (
            <View style={styles.row}>
              <Ionicons name="business" size={14} color={item.company === 'AURA' ? '#10b981' : '#3b82f6'} style={{marginRight: 4}} />
              <Text style={[styles.branch, { color: item.company === 'AURA' ? '#34d399' : '#60a5fa' }]}>{item.company}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.manageButton} onPress={() => openManageModal(item)}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.manageButtonGradient}
          >
            <Text style={styles.manageButtonText}>Управлять</Text>
          </LinearGradient>
        </TouchableOpacity>
      </BlurView>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.center}>
        <ActivityIndicator size="large" color="#818cf8" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Сотрудники</Text>
        </View>
        
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerText}>
              <Text style={styles.emptyText}>Нет сотрудников для управления</Text>
            </View>
          }
        />

        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <BlurView intensity={50} tint="dark" style={styles.modalContent}>
              <Text style={styles.modalTitle}>Настройка доступа</Text>
              <Text style={styles.modalSubtitle}>Пользователь: {selectedUser?.username || selectedUser?.email.split('@')[0]}</Text>
              
              <Text style={styles.label}>Назначить в филиал:</Text>
              <ScrollView style={styles.pickerContainer}>
                {branches.map(branch => (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.branchOption, 
                      selectedBranch === branch.id && styles.branchOptionSelected
                    ]}
                    onPress={() => setSelectedBranch(branch.id)}
                  >
                    <Text style={[
                      styles.branchOptionText,
                      selectedBranch === branch.id && styles.branchOptionTextSelected
                    ]}>{branch.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Компания:</Text>
              <View style={styles.pickerContainer}>
                {COMPANIES.map(company => (
                  <TouchableOpacity
                    key={company}
                    style={[
                      styles.branchOption, 
                      selectedCompany === company && styles.branchOptionSelected
                    ]}
                    onPress={() => setSelectedCompany(company)}
                  >
                    <Text style={[
                      styles.branchOptionText,
                      selectedCompany === company && styles.branchOptionTextSelected
                    ]}>{company}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Права доступа (Роль):</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={[styles.branchOption, selectedRole === 'employee' && styles.branchOptionSelected]}
                  onPress={() => setSelectedRole('employee')}
                >
                  <Text style={[styles.branchOptionText, selectedRole === 'employee' && styles.branchOptionTextSelected]}>
                    Сотрудник (Только свой филиал)
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.branchOption, selectedRole === 'boss' && styles.branchOptionSelected]}
                  onPress={() => setSelectedRole('boss')}
                >
                  <Text style={[styles.branchOptionText, selectedRole === 'boss' && styles.branchOptionTextSelected]}>
                    Начальник (Видит все филиалы)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalBtnCancelText}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnSave} onPress={saveUser}>
                  <Text style={styles.modalBtnSaveText}>Сохранить</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Modal>
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
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 110,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    overflow: 'hidden',
  },
  cardInfo: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statusBadgeApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 6,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 6,
  },
  statusTextApproved: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '700',
  },
  statusTextPending: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: '700',
  },
  branch: {
    fontSize: 14,
    color: '#818cf8',
    fontWeight: '600',
  },
  manageButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  manageButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  manageButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#818cf8',
    fontWeight: '600',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 24,
    maxHeight: 250,
  },
  branchOption: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  branchOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#818cf8',
  },
  branchOptionText: {
    fontSize: 16,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  branchOptionTextSelected: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtnCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnCancelText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  modalBtnSave: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
  },
  modalBtnSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
