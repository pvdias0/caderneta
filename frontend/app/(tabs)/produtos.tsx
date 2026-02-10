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
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { apiService } from "../../services/api";
import { ProdutoCard } from "../../components/ProdutoCard";
import { ProdutoModal } from "../../components/ProdutoModal";
import { IProduto } from "../../types/produto";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../../theme";

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
    if (newSelectedIds.size === 0) setSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredProdutos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProdutos.map((p) => p.id_produto)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Aviso", "Selecione pelo menos um produto para excluir");
      return;
    }
    Alert.alert(
      "Excluir Produtos",
      `Tem certeza que deseja excluir ${selectedIds.size} produto${selectedIds.size !== 1 ? "s" : ""}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await apiService.deleteProdutos(Array.from(selectedIds));
              Alert.alert("Sucesso", `${selectedIds.size} produto${selectedIds.size !== 1 ? "s" : ""} excluído${selectedIds.size !== 1 ? "s" : ""}`);
              setSelectionMode(false);
              setSelectedIds(new Set());
              await loadProdutos();
            } catch (error) {
              Alert.alert("Erro", error instanceof Error ? error.message : "Erro ao excluir");
            } finally {
              setDeleting(false);
            }
          },
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

  return (
    <ProtectedRoute>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

        {/* Header */}
        <LinearGradient
          colors={[...Colors.gradientPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {!selectionMode ? (
            <>
              <Text style={styles.headerTitle}>Produtos</Text>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar produto..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.selectionBar}>
              <TouchableOpacity onPress={handleCancelSelection} style={styles.selBarBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.selBarTitle}>
                {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity onPress={handleSelectAll} style={styles.selBarBtn}>
                <Text style={styles.selBarAction}>
                  {selectedIds.size === filteredProdutos.length ? "Nenhum" : "Todos"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* Content */}
        {loading && produtos.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredProdutos.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="cube-outline" size={56} color={Colors.border} />
            <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
            <Text style={styles.emptyText}>Toque no botão + para adicionar</Text>
          </View>
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {filteredProdutos.length} produto{filteredProdutos.length !== 1 ? "s" : ""}
              </Text>
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* FABs */}
        {!selectionMode ? (
          <View style={styles.fabRow}>
            {filteredProdutos.length > 0 && (
              <TouchableOpacity
                style={styles.fabSecondary}
                onPress={() => setSelectionMode(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={22} color={Colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.fabPrimary} onPress={handleCreateProduto} activeOpacity={0.85}>
              <LinearGradient
                colors={[...Colors.gradientPrimary]}
                style={styles.fabGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.fabDeleteActive]}
            onPress={handleDeleteSelected}
            disabled={deleting || selectedIds.size === 0}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="trash" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}

        <ProdutoModal
          visible={showModal}
          produto={selectedProduto}
          onClose={() => setShowModal(false)}
          onSuccess={() => loadProdutos()}
        />
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selBarBtn: {
    padding: Spacing.sm,
  },
  selBarTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  selBarAction: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textTertiary,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fabRow: {
    position: "absolute",
    bottom: Spacing.xxl,
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  fabPrimary: {
    borderRadius: BorderRadius.full,
    ...Shadows.fab,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  fabDeleteActive: {
    position: "absolute",
    bottom: Spacing.xxl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.danger,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.fab,
  },
});
