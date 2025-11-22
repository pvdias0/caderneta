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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService, Cliente } from "../../../services/api";
import { styles } from "./styles";

export default function ClienteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const clienteId = typeof id === "string" ? parseInt(id, 10) : 0;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
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
          router.back();
        }
      } else {
        Alert.alert("Erro", response.error || "Erro ao carregar cliente");
        router.back();
      }
    } catch (error) {
      console.error("Erro ao carregar cliente:", error);
      Alert.alert("Erro", "Erro ao carregar cliente");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [clienteId, router]);

  // Carregar dados do cliente ao montar o componente
  useEffect(() => {
    if (clienteId > 0) {
      loadClienteDetails();
    }
  }, [clienteId, loadClienteDetails]);

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

  const handleDeleteCliente = () => {
    Alert.alert("Confirmar", "Deletar este cliente?", [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Deletar",
        onPress: async () => {
          try {
            const response = await apiService.deleteCliente(clienteId);

            if (response.status === 200) {
              Alert.alert("Sucesso", "Cliente deletado com sucesso");
              router.back();
            } else {
              Alert.alert("Erro", response.error || "Erro ao deletar cliente");
            }
          } catch (error) {
            console.error("Erro ao deletar cliente:", error);
            Alert.alert("Erro", "Erro ao deletar cliente");
          }
        },
      },
    ]);
  };

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
          <TouchableOpacity onPress={() => router.back()}>
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
        <TouchableOpacity onPress={() => router.back()}>
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
          <Text style={styles.infoLabel}>Nome</Text>
          <Text style={styles.infoValue}>{cliente.nome}</Text>

          <Text style={styles.infoLabel}>Email</Text>
          <Text
            style={[styles.infoValue, !cliente.email && styles.infoValueEmpty]}
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

        {/* Data de Criação */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Cadastrado em</Text>
          <Text style={styles.infoValue}>
            {new Date(cliente.datacriacao).toLocaleDateString("pt-BR")}
          </Text>
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="create" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteCliente}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Deletar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Edição */}
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
    </View>
  );
}
