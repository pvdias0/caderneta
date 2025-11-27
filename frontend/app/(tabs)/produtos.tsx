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
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { apiService } from "../../services/api";
import { ProdutoCard } from "../../components/ProdutoCard";
import { ProdutoModal } from "../../components/ProdutoModal";
import { IProduto } from "../../types/produto";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<IProduto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<IProduto | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const response = (await apiService.getProdutos()) as any;
      const data = response?.data || [];
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      Alert.alert("Erro", "Não foi possível carregar os produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProdutos();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProdutos(produtos || []);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = (produtos || []).filter((produto) =>
      produto.nome.toLowerCase().includes(query)
    );

    setFilteredProdutos(filtered);
  }, [searchQuery, produtos]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadProdutos();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectProduto = (produtoId: number, isSelected: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (isSelected) {
      newSelectedIds.add(produtoId);
      setSelectionMode(true);
    } else {
      newSelectedIds.delete(produtoId);
    }
    setSelectedIds(newSelectedIds);

    if (newSelectedIds.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProdutos.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredProdutos.map((p) => p.id_produto));
      setSelectedIds(allIds);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um produto para excluir");
      return;
    }

    Alert.alert(
      "Excluir Produtos",
      `Tem certeza que deseja excluir ${selectedIds.size} produto${
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
              await apiService.deleteProdutos(idsArray);
              Alert.alert(
                "Sucesso",
                `${selectedIds.size} produto${
                  selectedIds.size !== 1 ? "s" : ""
                } excluído${selectedIds.size !== 1 ? "s" : ""} com sucesso`
              );
              setSelectionMode(false);
              setSelectedIds(new Set());
              await loadProdutos();
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Erro ao excluir produtos";
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

  const handleCreateProduto = () => {
    setSelectedProduto(null);
    setShowModal(true);
  };

  const handleEditProduto = (produto: IProduto) => {
    setSelectedProduto(produto);
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    loadProdutos();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color="#ddd" />
      <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
      <Text style={styles.emptyText}>
        Clique no botão abaixo para cadastrar seu primeiro produto
      </Text>
    </View>
  );

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {/* Header com Search e Selection Tools */}
        <View style={styles.header}>
          {!selectionMode ? (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar produto..."
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
                {selectedIds.size} selecionado
                {selectedIds.size !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity onPress={handleSelectAll}>
                <Text style={styles.selectAllButton}>
                  {selectedIds.size === filteredProdutos.length
                    ? "Desselecionar"
                    : "Todos"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Lista de Produtos */}
        {loading && produtos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff9800" />
          </View>
        ) : filteredProdutos.length === 0 ? (
          <View style={styles.emptyContainer}>{renderEmptyState()}</View>
        ) : (
          <FlatList
            data={filteredProdutos}
            keyExtractor={(item) => item.id_produto.toString()}
            renderItem={({ item }) => (
              <ProdutoCard
                produto={item}
                showCheckbox={selectionMode}
                isSelected={selectedIds.has(item.id_produto)}
                onSelect={handleSelectProduto}
                onEdit={handleEditProduto}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {filteredProdutos.length} produto
                {filteredProdutos.length !== 1 ? "s" : ""}
              </Text>
            }
            scrollIndicatorInsets={{ right: 1 }}
          />
        )}

        {/* Botões Flutuantes */}
        {!selectionMode ? (
          <View style={styles.fabContainer}>
            {filteredProdutos.length > 0 && (
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
              onPress={handleCreateProduto}
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
        <ProdutoModal
          visible={showModal}
          produto={selectedProduto}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      </View>
    </ProtectedRoute>
  );
}

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
    color: "#ff9800",
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
    paddingHorizontal: 24,
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
    lineHeight: 22,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ff9800",
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
