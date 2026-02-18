/**
 * Tela de Clientes - Modern & Juicy
 */

import React, { useState, useEffect, useMemo } from "react";
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
import { useRouter } from "expo-router";
import { apiService } from "../services/api";
import { ClienteCard } from "../components/ClienteCard";
import { ClienteModal } from "../components/ClienteModal";
import { ICliente } from "../types/cliente";
import { useAuth } from "../hooks/useAuth";
import { useRealtimeUpdates } from "../hooks/useRealtimeUpdates";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";
import { useThemeColors } from "../context/ThemeContext";
import { SwipeableTabView } from "../components/SwipeableTabView";

const ClientesScreenComponent: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
      Alert.alert("Erro", "NÃ£o foi possÃ­vel carregar os clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSaldoAtualizado = (clienteId: number, novoSaldo: number) => {
    setClientes((prev) =>
      prev.map((c) =>
        c.id_cliente === clienteId ? { ...c, saldo_devedor: novoSaldo } : c,
      ),
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
    const q = searchQuery.toLowerCase();
    setFilteredClientes(
      (clientes || []).filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.telefone?.includes(q),
      ),
    );
  }, [searchQuery, clientes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClientes();
    setRefreshing(false);
  };

  const handleSelectClient = (clienteId: number, isSelected: boolean) => {
    const newIds = new Set(selectedIds);
    if (isSelected) {
      newIds.add(clienteId);
      setSelectionMode(true);
    } else {
      newIds.delete(clienteId);
    }
    setSelectedIds(newIds);
    if (newIds.size === 0) setSelectionMode(false);
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClientes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClientes.map((c) => c.id_cliente)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Excluir Clientes",
      `Tem certeza que deseja excluir ${selectedIds.size} cliente${selectedIds.size !== 1 ? "s" : ""}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);
              await apiService.deleteClientes(Array.from(selectedIds));
              Alert.alert("Sucesso", "Clientes excluÃ­dos com sucesso");
              setSelectionMode(false);
              setSelectedIds(new Set());
              await loadClientes();
            } catch (error) {
              Alert.alert(
                "Erro",
                error instanceof Error ? error.message : "Erro ao excluir",
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SwipeableTabView>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primaryDark}
        />

        {/* Header */}
        <LinearGradient
          colors={[...colors.gradientPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {!selectionMode ? (
            <>
              <Text style={styles.headerTitle}>Clientes</Text>
              <View style={styles.searchBar}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textTertiary}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar cliente..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.selectionBar}>
              <TouchableOpacity onPress={handleCancelSelection}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.selectionText}>
                {selectedIds.size} selecionado
                {selectedIds.size !== 1 ? "s" : ""}
              </Text>
              <TouchableOpacity onPress={handleSelectAll}>
                <Text style={styles.selectAllBtn}>
                  {selectedIds.size === filteredClientes.length
                    ? "Limpar"
                    : "Todos"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {/* List */}
        {loading && clientes.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredClientes.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="people-outline" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Nenhum cliente</Text>
            <Text style={styles.emptyText}>Adicione seu primeiro cliente</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClientes}
            keyExtractor={(item) => item.id_cliente.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (!selectionMode) {
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <Text style={styles.resultCount}>
                {filteredClientes.length} cliente
                {filteredClientes.length !== 1 ? "s" : ""}
              </Text>
            }
          />
        )}

        {/* FABs */}
        {!selectionMode ? (
          <View style={styles.fabRow}>
            {filteredClientes.length > 0 && (
              <TouchableOpacity
                style={[styles.fabSecondary]}
                onPress={() => setSelectionMode(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.danger}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.fabPrimary}
              onPress={() => {
                setSelectedCliente(null);
                setShowModal(true);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...colors.gradientPrimary]}
                style={styles.fabGradient}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.fabDeleteAbsolute]}
            onPress={handleDeleteSelected}
            disabled={deleting || selectedIds.size === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.danger, "#D50000"]}
              style={styles.fabGradient}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash" size={24} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <ClienteModal
          visible={showModal}
          cliente={selectedCliente}
          onClose={() => setShowModal(false)}
          onSuccess={loadClientes}
        />
      </View>
    </SwipeableTabView>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: colors.textInverse,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: FontSize.md,
    color: colors.text,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textInverse,
  },
  selectAllBtn: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: colors.textInverse,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: colors.textTertiary,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 120,
  },
  resultCount: {
    fontSize: FontSize.xs,
    color: colors.textTertiary,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  fabRow: {
    position: "absolute",
    bottom: 36,
    right: Spacing.xl,
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    ...Shadows.fab,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.md,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fabDeleteAbsolute: {
    position: "absolute",
    bottom: 36,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    ...Shadows.fab,
  },
});

export default ClientesScreenComponent;
