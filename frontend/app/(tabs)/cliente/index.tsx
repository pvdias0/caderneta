import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService, Cliente, Movimento } from "../../../services/api";
import { styles } from "./styles";

// Função para formatar moeda real
const formatCurrency = (value: string): string => {
  let numericValue = value.replace(/\D/g, "");
  if (numericValue === "") return "";
  const numberValue = parseInt(numericValue, 10);
  const formatted = (numberValue / 100).toFixed(2).replace(".", ",");
  const parts = formatted.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${parts.join(",")}`;
};

// Função para extrair valor numérico da moeda formatada
const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue === "" ? 0 : parseInt(cleanValue, 10) / 100;
};

export default function ClienteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const clienteId = typeof id === "string" ? parseInt(id, 10) : 0;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovimentoModal, setShowMovimentoModal] = useState(false);
  const [movimentoType, setMovimentoType] = useState<"compra" | "pagamento">(
    "compra"
  );
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });
  const [movimentoData, setMovimentoData] = useState({
    valor: "",
  });

  const loadClienteDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getClienteById(clienteId);

      if (response.status === 200) {
        let cliente: any;

        // Se a resposta retorna um objeto com propriedade 'data'
        if (
          response.data &&
          typeof response.data === "object" &&
          "data" in response.data
        ) {
          cliente = (response.data as any).data;
        } else {
          cliente = response.data;
        }

        // Converter id_cliente para número se for string
        if (cliente) {
          cliente.id_cliente =
            typeof cliente.id_cliente === "string"
              ? parseInt(cliente.id_cliente, 10)
              : cliente.id_cliente;

          setCliente(cliente);
          setFormData({
            nome: cliente.nome || "",
            email: cliente.email || "",
            telefone: cliente.telefone || "",
          });
        } else {
          Alert.alert("Erro", "Cliente não encontrado");
          router.push("/(tabs)/clientes");
        }
      } else {
        Alert.alert("Erro", response.error || "Erro ao carregar cliente");
        router.push("/(tabs)/clientes");
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      Alert.alert("Erro", "Erro ao carregar cliente");
      router.push("/(tabs)/clientes");
    } finally {
      setLoading(false);
    }
  }, [clienteId, router]);

  const loadMovimentos = useCallback(async () => {
    try {
      const response = await apiService.getMovimentos(clienteId);

      if (response.status === 200) {
        let movArray: any[] = [];

        if (Array.isArray(response.data)) {
          movArray = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          movArray = response.data.data;
        } else if (
          response.data?.movimentos &&
          Array.isArray(response.data.movimentos)
        ) {
          movArray = response.data.movimentos;
        }

        const movimentosConvertidos = movArray.map((mov) => ({
          ...mov,
          id_movimento: Number(mov.id_movimento),
          valor: Number(mov.valor) || 0,
        }));

        setMovimentos(movimentosConvertidos);
      }
    } catch (error) {
      console.error("Erro ao carregar movimentos:", error);
    }
  }, [clienteId]);

  // Carregar dados do cliente ao montar o componente
  useEffect(() => {
    if (clienteId > 0) {
      loadClienteDetails();
      loadMovimentos();
    }
  }, [clienteId, loadClienteDetails, loadMovimentos]);

  const handleUpdateCliente = async () => {
    if (!formData.nome.trim()) {
      Alert.alert("Erro", "Nome do cliente é obrigatório");
      return;
    }

    try {
      const response = await apiService.updateCliente(clienteId, {
        nome: formData.nome,
        email: formData.email.trim() ? formData.email : undefined,
        telefone: formData.telefone.trim() ? formData.telefone : undefined,
      });

      if (response.status === 200) {
        Alert.alert("Sucesso", "Cliente atualizado com sucesso");
        setShowEditModal(false);
        await loadClienteDetails();
      } else {
        Alert.alert("Erro", response.error || "Erro ao atualizar cliente");
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      Alert.alert("Erro", "Erro ao atualizar cliente");
    }
  };

  const handleCreateMovimento = async () => {
    const valor = parseCurrency(movimentoData.valor);

    if (!movimentoData.valor.trim()) {
      Alert.alert("Erro", `Valor do ${movimentoType} é obrigatório`);
      return;
    }

    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Erro", `Valor deve ser um número maior que 0`);
      return;
    }

    try {
      let response;
      if (movimentoType === "compra") {
        response = await apiService.createCompra(clienteId, valor);
      } else {
        response = await apiService.createPagamento(clienteId, valor);
      }

      if (response.status === 201) {
        Alert.alert("Sucesso", `${movimentoType} criado(a) com sucesso`);
        setMovimentoData({ valor: "" });
        setShowMovimentoModal(false);
        await loadMovimentos();
      } else {
        Alert.alert("Erro", response.error || `Erro ao criar ${movimentoType}`);
      }
    } catch (error) {
      console.error(`Erro ao criar ${movimentoType}:`, error);
      Alert.alert("Erro", `Erro ao criar ${movimentoType}`);
    }
  };

  const handleDeleteMovimento = (movimento: Movimento) => {
    Alert.alert(
      "Confirmar",
      `Deletar este ${movimento.tipo === "COMPRA" ? "compra" : "pagamento"}?`,
      [
        { text: "Cancelar", onPress: () => {} },
        {
          text: "Deletar",
          onPress: async () => {
            try {
              let response;
              if (movimento.tipo === "COMPRA") {
                response = await apiService.deleteCompra(
                  clienteId,
                  movimento.id_compra || 0
                );
              } else {
                response = await apiService.deletePagamento(
                  clienteId,
                  movimento.id_pagamento || 0
                );
              }

              if (response.status === 200) {
                Alert.alert(
                  "Sucesso",
                  `${movimento.tipo} deletado(a) com sucesso`
                );
                await loadMovimentos();
              } else {
                Alert.alert(
                  "Erro",
                  response.error || `Erro ao deletar ${movimento.tipo}`
                );
              }
            } catch (error) {
              console.error(`Erro ao deletar ${movimento.tipo}:`, error);
              Alert.alert("Erro", `Erro ao deletar ${movimento.tipo}`);
            }
          },
        },
      ]
    );
  };

  const renderMovimentoItem = ({ item }: { item: Movimento }) => (
    <View
      style={[
        styles.movimentoCard,
        item.tipo === "COMPRA"
          ? styles.movimentoCardCompra
          : styles.movimentoCardPagamento,
      ]}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Ionicons
            name={item.tipo === "COMPRA" ? "cart" : "cash"}
            size={18}
            color={item.tipo === "COMPRA" ? "#ff3b30" : "#34C759"}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.movimentoType}>
            {item.tipo === "COMPRA" ? "Compra" : "Pagamento"}
          </Text>
        </View>
        <Text style={styles.movimentoValue}>R$ {item.valor.toFixed(2)}</Text>
        <Text style={styles.movimentoDate}>
          {new Date(item.data_movimento).toLocaleDateString("pt-BR")}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteMovimento(item)}
        style={{ padding: 8 }}
      >
        <Ionicons name="trash" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!cliente) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/clientes")}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Cliente</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text>Cliente não encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/clientes")}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 {cliente.nome}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Informações Básicas */}
        <View style={styles.infoCard}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{cliente.nome}</Text>

              <Text style={styles.infoLabel}>Email</Text>
              <Text
                style={[
                  styles.infoValue,
                  !cliente.email && styles.infoValueEmpty,
                ]}
              >
                {cliente.email || "Não informado"}
              </Text>

              <Text style={styles.infoLabel}>Telefone</Text>
              <Text
                style={[
                  styles.infoValue,
                  !cliente.telefone && styles.infoValueEmpty,
                ]}
              >
                {cliente.telefone || "Não informado"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowEditModal(true)}
              style={{ marginLeft: 12 }}
            >
              <Ionicons name="create" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Data de Criação */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Cadastrado em</Text>
          <Text style={styles.infoValue}>
            {new Date(cliente.datacriacao).toLocaleDateString("pt-BR")}
          </Text>
        </View>

        {/* Saldo Devedor */}
        <View style={[styles.infoCard, styles.saldoCard]}>
          <Text style={styles.infoLabel}>Saldo Devedor</Text>
          <Text
            style={[
              styles.infoValue,
              {
                fontSize: 24,
                color: (cliente.saldo_devedor ?? 0) > 0 ? "#ff3b30" : "#34C759",
              },
            ]}
          >
            R$ {((cliente.saldo_devedor ?? 0) as number).toFixed(2)}
          </Text>
          {(cliente.saldo_devedor ?? 0) > 0 && (
            <Text style={{ fontSize: 12, color: "#ff3b30", marginTop: 4 }}>
              Débito pendente
            </Text>
          )}
          {(cliente.saldo_devedor ?? 0) === 0 && (
            <Text style={{ fontSize: 12, color: "#34C759", marginTop: 4 }}>
              Tudo em dia ✓
            </Text>
          )}
        </View>

        {/* Seção de Movimentos */}
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>📊 Movimentos</Text>
            <TouchableOpacity
              onPress={() => {
                setMovimentoType("compra");
                setMovimentoData({ valor: "" });
                setShowMovimentoModal(true);
              }}
              style={{
                backgroundColor: "#ff3b30",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Compra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMovimentoType("pagamento");
                setMovimentoData({ valor: "" });
                setShowMovimentoModal(true);
              }}
              style={{
                backgroundColor: "#34C759",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Pagamento
              </Text>
            </TouchableOpacity>
          </View>

          {movimentos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                Nenhum movimento registrado
              </Text>
            </View>
          ) : (
            <FlatList
              data={movimentos}
              renderItem={renderMovimentoItem}
              keyExtractor={(item) => item.id_movimento.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Modal de Edição do Cliente */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Editar Cliente</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome *"
              placeholderTextColor="#ccc"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Telefone"
              placeholderTextColor="#ccc"
              keyboardType="phone-pad"
              value={formData.telefone}
              onChangeText={(text) =>
                setFormData({ ...formData, telefone: text })
              }
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleUpdateCliente}
            >
              <Text style={styles.submitButtonText}>Salvar Alterações</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Novo Movimento */}
      <Modal
        visible={showMovimentoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMovimentoModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>
              Nova {movimentoType === "compra" ? "Compra" : "Pagamento"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Valor (R$) *"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              value={movimentoData.valor}
              onChangeText={(text) => {
                const formatted = formatCurrency(text);
                setMovimentoData({ valor: formatted });
              }}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateMovimento}
            >
              <Text style={styles.submitButtonText}>
                Criar {movimentoType === "compra" ? "Compra" : "Pagamento"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowMovimentoModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
