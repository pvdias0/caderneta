/**
 * Tela de Detalhes do Cliente
 * Exibe informações do cliente, movimentos, e permite criar compras e pagamentos
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
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

const ClienteDetailsScreenComponent: React.FC = () => {
  const { id } = useLocalSearchParams();
  const clienteId = parseInt(id as string, 10);
  const router = useRouter();
  console.log(
    "ClienteDetailsScreen loaded - ID from params:",
    id,
    "Parsed:",
    clienteId
  );

  const [cliente, setCliente] = useState<ICliente | null>(null);
  const [movimentos, setMovimentos] = useState<IMovimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingMovimento, setProcessingMovimento] = useState(false);

  // Modals
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [editingPagamento, setEditingPagamento] = useState<IMovimento | null>(
    null
  );
  const [editingCompra, setEditingCompra] = useState<IMovimento | null>(null);

  // PDF
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
      Alert.alert("Erro", "Não foi possível carregar os dados do cliente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } finally {
      setRefreshing(false);
    }
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
        // Editar pagamento
        await apiService.request(
          "PUT",
          `/api/v1/clientes/${clienteId}/movimentos/pagamento/${editingPagamento.id_pagamento}`,
          data
        );
        Alert.alert("Sucesso", "Pagamento atualizado com sucesso");
      } else {
        // Criar novo pagamento
        await apiService.createPagamento(clienteId, data);
        Alert.alert("Sucesso", "Pagamento criado com sucesso");
      }

      setShowPagamentoModal(false);
      setEditingPagamento(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error);
      Alert.alert("Erro", "Não foi possível salvar o pagamento");
    } finally {
      setProcessingMovimento(false);
    }
  };

  const handleSaveCompra = async (data: {
    data_compra: string;
    itens: {
      id_produto: number;
      quantidade: number;
      valor_unitario: number;
    }[];
  }) => {
    try {
      setProcessingMovimento(true);

      if (editingCompra) {
        // Editar compra com itens
        await apiService.request(
          "PUT",
          `/api/v1/clientes/${clienteId}/movimentos/compra/${editingCompra.id_compra}/com-`,
          data
        );
        Alert.alert("Sucesso", "Compra atualizada com sucesso");
      } else {
        // Criar nova compra com itens
        await apiService.createCompraComItens(clienteId, data);
        Alert.alert("Sucesso", "Compra criada com sucesso");
      }

      setShowCompraModal(false);
      setEditingCompra(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar compra:", error);
      Alert.alert("Erro", "Não foi possível salvar a compra");
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
          `/api/v1/clientes/${clienteId}/movimentos/compra/${movimento.id_compra}`
        );
      } else if (movimento.tipo === "PAGAMENTO" && movimento.id_pagamento) {
        await apiService.request(
          "DELETE",
          `/api/v1/clientes/${clienteId}/movimentos/pagamento/${movimento.id_pagamento}`
        );
      }

      Alert.alert("Sucesso", "Movimento deletado com sucesso");
      await loadData();
    } catch (error) {
      console.error("Erro ao deletar movimento:", error);
      Alert.alert("Erro", "Não foi possível deletar o movimento");
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

      // Baixar PDF do backend
      const pdfBlob = await apiService.gerarExtratoCliente(clienteId);

      // Converter blob para base64 URI
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);

      reader.onloadend = async () => {
        try {
          const uri = reader.result as string;

          // Exibir com Print
          await Print.printAsync({
            uri,
          });

          Alert.alert("Sucesso", "Extrato gerado com sucesso!");
        } catch (error) {
          console.error("Erro ao exibir PDF:", error);
          Alert.alert("Erro", "Não foi possível exibir o extrato");
        } finally {
          setGeneratingPDF(false);
        }
      };
    } catch (error) {
      console.error("Erro ao gerar extrato:", error);
      Alert.alert("Erro", "Não foi possível gerar o extrato");
      setGeneratingPDF(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cliente não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cliente Info Card */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.clienteCard}>
          <View style={styles.cardHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#e91e63" />
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={60} color="#e91e63" />
            </View>
            <View
              style={[
                styles.clienteInfoContent,
                !cliente.email &&
                  !cliente.telefone &&
                  styles.clienteInfoContentCentered,
              ]}
            >
              <Text style={styles.clienteName}>{cliente.nome}</Text>
              <Text style={styles.clienteEmail}>{cliente.email}</Text>
              {cliente.telefone && (
                <Text style={styles.clientePhone}>{cliente.telefone}</Text>
              )}
            </View>
          </View>

          {/* Saldo */}
          <View style={styles.saldoContainer}>
            <View style={styles.saldoBox}>
              <Text style={styles.saldoLabel}>Saldo Devedor</Text>
              <Text
                style={[
                  styles.saldoValue,
                  cliente.saldo_devedor > 0 && styles.saldoPositivo,
                ]}
              >
                {formatCurrency(cliente.saldo_devedor)}
              </Text>
            </View>
          </View>

          {/* Botões de ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowClienteModal(true)}
            >
              <Ionicons name="pencil" size={20} color="#e91e63" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingCompra(null);
                setShowCompraModal(true);
              }}
            >
              <Ionicons name="cart" size={20} color="#e91e63" />
              <Text style={styles.actionButtonText}>Compra</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingPagamento(null);
                setShowPagamentoModal(true);
              }}
            >
              <Ionicons name="cash" size={20} color="#e91e63" />
              <Text style={styles.actionButtonText}>Pagamento</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={generateExtratoPDF}
              disabled={generatingPDF}
            >
              <Ionicons name="document" size={20} color="#e91e63" />
              <Text style={styles.actionButtonText}>
                {generatingPDF ? "..." : "PDF"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Movimentos Section */}
        <View style={styles.movimentosSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#e91e63" />
            <Text style={styles.sectionTitle}>Movimentos</Text>
            {movimentos.length > 0 && (
              <Text style={styles.sectionSubtitle}>({movimentos.length})</Text>
            )}
          </View>

          {movimentos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum movimento registrado</Text>
            </View>
          ) : (
            <View style={styles.movimentosList}>
              {movimentos.map((movimento, index) => (
                <MovimentoCard
                  key={index}
                  movimento={movimento}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  clienteCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 16,
  },
  avatarContainer: {
    marginTop: 4,
  },
  clienteInfoContent: {
    flex: 1,
  },
  clienteInfoContentCentered: {
    justifyContent: "center",
  },
  clienteName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  clienteEmail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  clientePhone: {
    fontSize: 13,
    color: "#999",
  },
  saldoContainer: {
    marginBottom: 16,
  },
  saldoBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#e91e63",
    alignItems: "center",
  },
  saldoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
    marginBottom: 4,
  },
  saldoValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e91e63",
  },
  saldoPositivo: {
    color: "#e91e63",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  movimentosSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  movimentosList: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
  },
});

export default ClienteDetailsScreenComponent;
