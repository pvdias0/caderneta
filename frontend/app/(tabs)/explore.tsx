import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * Página de Explore
 */
export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Funcionalidades em desenvolvimento</Text>
      </View>

      {/* Placeholder para futuras funcionalidades */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Relatórios</Text>
        <Text style={styles.cardDescription}>
          Visualize relatórios detalhados sobre vendas, clientes e pagamentos.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📈 Estatísticas</Text>
        <Text style={styles.cardDescription}>
          Acompanhe as estatísticas em tempo real do seu negócio.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ Configurações</Text>
        <Text style={styles.cardDescription}>
          Configure as preferências e parâmetros do sistema.
        </Text>
      </View>
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
  section: {
    marginBottom: 24,
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
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
