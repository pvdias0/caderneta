/**
 * Tela de Clientes
 * Lista todos os clientes, permite criar, editar e excluir
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiService } from "../services/api";
import { ClienteCard } from "../components/ClienteCard";
import { ClienteModal } from "../components/ClienteModal";
import { ICliente } from "../types/cliente";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeUpdates } from "../hooks/useRealtimeUpdates";

const ClientesScreenComponent: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<ICliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<ICliente[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ICliente | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllClientes();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      Alert.alert("Erro", "Não foi possível carregar os clientes");
    } finally {
      setLoading(false);
    }
  };

  // Hook para receber atualizações em tempo real
  const handleSaldoAtualizado = (clienteId: number, novoSaldo: number) => {
    setClientes((prevClientes) =>
      prevClientes.map((cliente) =>
        cliente.id_cliente === clienteId
          ? { ...cliente, saldo_devedor: novoSaldo }
          : cliente
      )
    );
  };

  useRealtimeUpdates(user?.id || null, handleSaldoAtualizado);

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClientes(clientes || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = (clientes || []).filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(query) ||
        cliente.email?.toLowerCase().includes(query) ||
        cliente.telefone?.includes(query)
    );

    setFilteredClientes(filtered);
  }, [searchQuery, clientes]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadClientes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectClient = (clienteId: number, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (isSelected) {
      newSelectedIds.add(clienteId);
      setSelectionMode(true); // Entra automaticamente no modo de seleção
    } else {
      newSelectedIds.delete(clienteId);
    }
    setSelectedIds(newSelectedIds);

    // Sair do modo de seleção se não houver nenhum selecionado
    if (newSelectedIds.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClientes.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredClientes.map((c) => c.id_cliente));
      setSelectedIds(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um cliente para excluir");
      return;
    }

    Alert.alert(
      "Excluir Clientes",
      `Tem certeza que deseja excluir ${selectedIds.size} cliente${
        selectedIds.size !== 1 ? "s" : ""
      }?`,
      [
        {
          text: "Cancelar",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              setDeleting(true);
              const idsArray = Array.from(selectedIds);
              await apiService.deleteClientes(idsArray);
              Alert.alert(
                "Sucesso",
                `${selectedIds.size} cliente${
                  selectedIds.size !== 1 ? "s" : ""
                } excluído${selectedIds.size !== 1 ? "s" : ""} com sucesso`
              );
              setSelectionMode(false);
              setSelectedIds(new Set());
              await loadClientes();
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Erro ao excluir clientes";
              Alert.alert("Erro", errorMessage);
            } finally {
              setDeleting(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleCreateCliente = () => {
    setSelectedCliente(null);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    loadClientes();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#ddd" />
      <Text style={styles.emptyTitle}>Nenhum cliente cadastrado</Text>
      <Text style={styles.emptyText}>
        Clique no botão abaixo para cadastrar seu primeiro cliente
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header com Search e Selection Tools */}
      <View style={styles.header}>
        {!selectionMode ? (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#ccc"
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={handleCancelSelection}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.selectionTitle}>
              {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
            </Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.selectAllButton}>
                {selectedIds.size === filteredClientes.length
                  ? "Desselecionar"
                  : "Todos"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Lista de Clientes */}
      {loading && clientes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : filteredClientes.length === 0 ? (
        <View style={styles.emptyContainer}>{renderEmptyState()}</View>
      ) : (
        <FlatList
          data={filteredClientes}
          keyExtractor={(item) => item.id_cliente.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                console.log(
                  "Client pressed:",
                  item.id_cliente,
                  "Selection mode:",
                  selectionMode
                );
                if (!selectionMode) {
                  console.log(
                    "Navigating to:",
                    `/(tabs)/clientes/${item.id_cliente}`
                  );
                  router.push({
                    pathname: "/(tabs)/clientes/[id]",
                    params: {
                      id: item.id_cliente.toString(),
                      clienteName: item.nome,
                    },
                  });
                }
              }}
              activeOpacity={selectionMode ? 1 : 0.7}
            >
              <ClienteCard
                cliente={item}
                showCheckbox={selectionMode}
                isSelected={selectedIds.has(item.id_cliente)}
                onSelect={handleSelectClient}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {filteredClientes.length} cliente
              {filteredClientes.length !== 1 ? "s" : ""}
            </Text>
          }
          scrollIndicatorInsets={{ right: 1 }}
        />
      )}

      {/* Botões Flutuantes */}
      {!selectionMode ? (
        <View style={styles.fabContainer}>
          {filteredClientes.length > 0 && (
            <TouchableOpacity
              style={[styles.fab, styles.fabDelete]}
              onPress={() => setSelectionMode(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateCliente}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.fab, styles.fabDelete, styles.fabAbsolute]}
          onPress={handleDeleteSelected}
          disabled={deleting || selectedIds.size === 0}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="trash" size={28} color="#fff" />
          )}
        </TouchableOpacity>
      )}

      {/* Modal de Criar/Editar */}
      <ClienteModal
        visible={showModal}
        cliente={selectedCliente}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#333",
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  selectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectAllButton: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e91e63",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 80,
  },
  resultCount: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e91e63",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
    flexDirection: "row",
    gap: 12,
  },
  fabAbsolute: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  fabDelete: {
    backgroundColor: "#f44336",
  },
});

export default ClientesScreenComponent;
