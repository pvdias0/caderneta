import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../context/auth.context';
import { useRouter } from 'expo-router';

/**
 * Página de Home/Dashboard
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📘 Caderneta</Text>
        <Text style={styles.subtitle}>Bem-vindo ao sistema de fiado</Text>
      </View>

      {/* User Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Perfil do Usuário</Text>
        <View style={styles.userInfo}>
          <Text style={styles.label}>Nome:</Text>
          <Text style={styles.value}>{user?.nome_usuario || 'N/A'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email || 'N/A'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>👥</Text>
            <Text style={styles.actionButtonLabel}>Clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>🛍️</Text>
            <Text style={styles.actionButtonLabel}>Produtos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📝</Text>
            <Text style={styles.actionButtonLabel}>Compras</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>💰</Text>
            <Text style={styles.actionButtonLabel}>Pagamentos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  userInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 0.48,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  actionButtonText: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
