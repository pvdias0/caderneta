/**
 * Tela de Detalhes do Cliente - Modern & Juicy
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiService } from "../services/api";
import { ICliente } from "../types/cliente";
import { IMovimento } from "../types/movimento";
import { MovimentoCard } from "../components/MovimentoCard";
import { PagamentoModal } from "../components/PagamentoModal";
import { CompraModal } from "../components/CompraModal";
import { ClienteModal } from "../components/ClienteModal";
import * as Print from "expo-print";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";
import { useThemeColors } from "../context/ThemeContext";

const ClienteDetailsScreenComponent: React.FC = () => {
  const { id } = useLocalSearchParams();
  const clienteId = parseInt(id as string, 10);
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cliente, setCliente] = useState<ICliente | null>(null);
  const [movimentos, setMovimentos] = useState<IMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingMovimento, setProcessingMovimento] = useState(false);

  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<IMovimento | null>(
    null,
  );
  const [editingCompra, setEditingCompra] = useState<IMovimento | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clienteData, movimentosData] = await Promise.all([
        apiService.getClienteById(clienteId),
        apiService.getMovimentosByCliente(clienteId),
      ]);
      setCliente(clienteData.data || clienteData);
      setMovimentos(movimentosData.data || movimentosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      Alert.alert("Erro", "NÃ£o foi possÃ­vel carregar os dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId) loadData();
  }, [clienteId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSavePagamento = async (data: {
    valor_pagamento: number;
    data_pagamento?: string;
  }) => {
    try {
      setProcessingMovimento(true);
      if (editingPagamento) {
        await apiService.request(
          "PUT",
          `/api/v1/clientes/${clienteId}/movimentos/pagamento/${editingPagamento.id_pagamento}`,
          data,
        );
        Alert.alert("Sucesso", "Pagamento atualizado");
      } else {
        await apiService.createPagamento(clienteId, data);
        Alert.alert("Sucesso", "Pagamento criado");
      }
      setShowPagamentoModal(false);
      setEditingPagamento(null);
      await loadData();
    } catch (error) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel salvar o pagamento");
    } finally {
      setProcessingMovimento(false);
    }
  };

  const handleSaveCompra = async (data: {
    data_compra: string;
    itens: { id_produto: number; quantidade: number; valor_unitario: number }[];
  }) => {
    try {
      setProcessingMovimento(true);
      if (editingCompra) {
        await apiService.request(
          "PUT",
          `/api/v1/clientes/${clienteId}/movimentos/compra/${editingCompra.id_compra}/com-`,
          data,
        );
        Alert.alert("Sucesso", "Compra atualizada");
      } else {
        await apiService.createCompraComItens(clienteId, data);
        Alert.alert("Sucesso", "Compra criada");
      }
      setShowCompraModal(false);
      setEditingCompra(null);
      await loadData();
    } catch (error) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel salvar a compra");
    } finally {
      setProcessingMovimento(false);
    }
  };

  const handleDeleteMovimento = async (movimento: IMovimento) => {
    try {
      setProcessingMovimento(true);
      if (movimento.tipo === "COMPRA" && movimento.id_compra) {
        await apiService.request(
          "DELETE",
          `/api/v1/clientes/${clienteId}/movimentos/compra/${movimento.id_compra}`,
        );
      } else if (movimento.tipo === "PAGAMENTO" && movimento.id_pagamento) {
        await apiService.request(
          "DELETE",
          `/api/v1/clientes/${clienteId}/movimentos/pagamento/${movimento.id_pagamento}`,
        );
      }
      Alert.alert("Sucesso", "Movimento deletado");
      await loadData();
    } catch (error) {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel deletar");
    } finally {
      setProcessingMovimento(false);
    }
  };

  const handleEditMovimento = (movimento: IMovimento) => {
    if (movimento.tipo === "PAGAMENTO") {
      setEditingPagamento(movimento);
      setShowPagamentoModal(true);
    } else if (movimento.tipo === "COMPRA") {
      setEditingCompra(movimento);
      setShowCompraModal(true);
    }
  };

  const generateExtratoPDF = async () => {
    if (!cliente) return;
    try {
      setGeneratingPDF(true);
      const pdfBlob = await apiService.gerarExtratoCliente(clienteId);
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        try {
          await Print.printAsync({ uri: reader.result as string });
          Alert.alert("Sucesso", "Extrato gerado!");
        } catch {
          Alert.alert("Erro", "NÃ£o foi possÃ­vel exibir o extrato");
        } finally {
          setGeneratingPDF(false);
        }
      };
    } catch {
      Alert.alert("Erro", "NÃ£o foi possÃ­vel gerar o extrato");
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={styles.centerBox}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={styles.errorText}>Cliente nÃ£o encontrado</Text>
      </View>
    );
  }

  const initial = (cliente.nome || "?").charAt(0).toUpperCase();
  const hasDebt = cliente.saldo_devedor > 0;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primaryDark}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[...colors.gradientPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerNav}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.navBtn}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowClienteModal(true)}
              style={styles.navBtn}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileCenter}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initial}</Text>
            </View>
            <Text style={styles.profileName}>{cliente.nome}</Text>
            {cliente.email && (
              <Text style={styles.profileDetail}>{cliente.email}</Text>
            )}
            {cliente.telefone && (
              <Text style={styles.profileDetail}>{cliente.telefone}</Text>
            )}
          </View>

          {/* Saldo Card */}
          <View style={styles.saldoCard}>
            <Text style={styles.saldoLabel}>Saldo Devedor</Text>
            <Text
              style={[styles.saldoValue, hasDebt && { color: colors.primary }]}
            >
              {formatCurrency(cliente.saldo_devedor)}
            </Text>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setEditingCompra(null);
              setShowCompraModal(true);
            }}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: colors.dangerSoft },
              ]}
            >
              <Ionicons name="cart" size={20} color={colors.danger} />
            </View>
            <Text style={styles.actionLabel}>Compra</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setEditingPagamento(null);
              setShowPagamentoModal(true);
            }}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: colors.successSoft },
              ]}
            >
              <Ionicons name="cash" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionLabel}>Pagamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={generateExtratoPDF}
            disabled={generatingPDF}
          >
            <View
              style={[
                styles.actionCircle,
                { backgroundColor: colors.infoSoft },
              ]}
            >
              <Ionicons name="document-text" size={20} color={colors.info} />
            </View>
            <Text style={styles.actionLabel}>
              {generatingPDF ? "..." : "Extrato"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Movimentos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimentos</Text>
            {movimentos.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{movimentos.length}</Text>
              </View>
            )}
          </View>

          {movimentos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={colors.border}
              />
              <Text style={styles.emptyText}>Nenhum movimento registrado</Text>
            </View>
          ) : (
            <View style={styles.movList}>
              {movimentos.map((mov, i) => (
                <MovimentoCard
                  key={i}
                  movimento={mov}
                  onEdit={handleEditMovimento}
                  onDelete={handleDeleteMovimento}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <ClienteModal
        visible={showClienteModal}
        cliente={cliente}
        onClose={() => setShowClienteModal(false)}
        onSuccess={() => {
          setShowClienteModal(false);
          loadData();
        }}
      />
      <PagamentoModal
        visible={showPagamentoModal}
        pagamento={editingPagamento || undefined}
        onClose={() => {
          setShowPagamentoModal(false);
          setEditingPagamento(null);
        }}
        onSave={handleSavePagamento}
        loading={processingMovimento}
      />
      <CompraModal
        visible={showCompraModal}
        compra={editingCompra || undefined}
        onClose={() => {
          setShowCompraModal(false);
          setEditingCompra(null);
        }}
        onSave={handleSaveCompra}
        loading={processingMovimento}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerBox: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      gap: Spacing.md,
    },
    errorText: {
      fontSize: FontSize.md,
      color: colors.textTertiary,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 60 : 48,
      paddingBottom: Spacing.xxl,
      paddingHorizontal: Spacing.xl,
      borderBottomLeftRadius: BorderRadius.xxl,
      borderBottomRightRadius: BorderRadius.xxl,
    },
    headerNav: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xl,
    },
    navBtn: {
      padding: Spacing.sm,
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: BorderRadius.sm,
    },
    profileCenter: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    avatarLarge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    avatarLargeText: {
      fontSize: FontSize.xxl,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
    },
    profileName: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
      marginBottom: Spacing.xs,
    },
    profileDetail: {
      fontSize: FontSize.sm,
      color: "rgba(255,255,255,0.8)",
    },
    saldoCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: "center",
      ...Shadows.lg,
    },
    saldoLabel: {
      fontSize: FontSize.xs,
      color: colors.textTertiary,
      fontWeight: FontWeight.medium,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: Spacing.xs,
    },
    saldoValue: {
      fontSize: FontSize.xxxl,
      fontWeight: FontWeight.heavy,
      color: colors.textSecondary,
      letterSpacing: -0.5,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.xxxl,
      paddingVertical: Spacing.xl,
      marginTop: -Spacing.md,
    },
    actionItem: {
      alignItems: "center",
      gap: Spacing.sm,
    },
    actionCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: "center",
      alignItems: "center",
    },
    actionLabel: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
      color: colors.textSecondary,
    },
    section: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.huge,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    countBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 2,
    },
    countText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.bold,
      color: colors.primary,
    },
    emptyBox: {
      alignItems: "center",
      paddingVertical: Spacing.huge,
      gap: Spacing.md,
    },
    emptyText: {
      fontSize: FontSize.md,
      color: colors.textTertiary,
    },
    movList: {
      gap: Spacing.xs,
    },
  });

export default ClienteDetailsScreenComponent;
