import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService, Cliente } from "../../../services/api";
import { styles } from "./styles";

export default function ClientesScreen() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientes, setSelectedClientes] = useState<Set<number>>(
    new Set()
  );

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });

  // Carregar clientes ao montar o componente
  useEffect(() => {
    loadClientes();
  }, []); // Adicionar lista de dependências vazia para executar apenas uma vez

  // Recarregar clientes quando a página ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadClientes();
    }, [])
  );

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getClientes();

      if (response.status === 200 && response.data) {
        let clientesArray: any[] = [];

        // Se a resposta retorna um array diretamente
        if (Array.isArray(response.data)) {
          clientesArray = response.data;
        }
        // Se a resposta retorna um objeto com propriedade 'data' (novo formato do backend)
        else if (response.data.data && Array.isArray(response.data.data)) {
          clientesArray = response.data.data;
        }
        // Se a resposta retorna um objeto com propriedade 'clientes'
        else if (
          response.data.clientes &&
          Array.isArray(response.data.clientes)
        ) {
          clientesArray = response.data.clientes;
        } else {
          clientesArray = [];
        }

        // Converter id_cliente para número se for string
        const clientesConvertidos = clientesArray.map((cliente) => ({
          ...cliente,
          id_cliente:
            typeof cliente.id_cliente === "string"
              ? parseInt(cliente.id_cliente, 10)
              : cliente.id_cliente,
        }));

        setClientes(clientesConvertidos);
      } else {
        Alert.alert("Erro", response.error || "Erro ao carregar clientes");
        setClientes([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar clientes:", error);
      Alert.alert("Erro", "Erro ao carregar clientes");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCliente = async () => {
    if (!formData.nome.trim()) {
      Alert.alert("Erro", "Nome do cliente é obrigatório");
      return;
    }

    try {
      const response = await apiService.createCliente({
        nome: formData.nome,
        email: formData.email.trim() ? formData.email : undefined,
        telefone: formData.telefone.trim() ? formData.telefone : undefined,
      });

      console.log("Resposta ao criar cliente:", response);

      if (response.status === 201 || response.status === 200) {
        Alert.alert("Sucesso", "Cliente criado com sucesso");
        setFormData({ nome: "", email: "", telefone: "" });
        setShowModal(false);

        // Se a resposta incluir o cliente criado, adicionar diretamente
        if (response.data && response.data.id_cliente) {
          setClientes([...clientes, response.data as Cliente]);
        } else {
          // Caso contrário, recarregar a lista
          await loadClientes();
        }
      } else {
        Alert.alert("Erro", response.error || "Erro ao criar cliente");
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      Alert.alert("Erro", "Erro ao criar cliente");
    }
  };

  const toggleClienteSelection = (id: number) => {
    const newSelected = new Set(selectedClientes);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedClientes(newSelected);
  };

  const handleDeleteClientes = async () => {
    if (selectedClientes.size === 0) {
      if (typeof window !== "undefined") {
        window.alert(`Selecione ao menos um cliente para deletar`);
      } else {
        Alert.alert("Aviso", "Selecione ao menos um cliente para deletar");
      }
      return;
    }

    const confirmDelete = typeof window !== "undefined" 
      ? window.confirm(`Deletar ${selectedClientes.size} cliente(s)?`)
      : true;

    if (!confirmDelete) return;

    try {
      const ids = Array.from(selectedClientes);

      // Remover localmente primeiro (otimistic update)
      const clientesAtualizados = clientes.filter(
        (cliente) => !ids.includes(cliente.id_cliente)
      );
      setClientes(clientesAtualizados);
      setSelectedClientes(new Set());
      setDeleteMode(false);

      // Depois enviar para o servidor
      const response = await apiService.deleteClientes(ids);

      if (response.status !== 200) {
        // Se falhar, recarregar a lista
        const errorMsg = response.error || "Erro ao deletar clientes";
        if (typeof window !== "undefined") {
          window.alert(`Erro: ${errorMsg}`);
        } else {
          Alert.alert("Erro", errorMsg);
        }
        await loadClientes();
      } else {
        const successMsg = "Clientes deletados com sucesso";
        if (typeof window !== "undefined") {
          window.alert(successMsg);
        } else {
          Alert.alert("Sucesso", successMsg);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao deletar clientes:", error);
      const errorMsg = "Erro ao deletar clientes";
      if (typeof window !== "undefined") {
        window.alert(errorMsg);
      } else {
        Alert.alert("Erro", errorMsg);
      }
      // Recarregar em caso de erro
      await loadClientes();
    }
  };

  const renderClienteItem = ({ item }: { item: Cliente }) => {
    const isSelected = selectedClientes.has(item.id_cliente);
    const saldoDevedor = item.saldo_devedor
      ? parseFloat(String(item.saldo_devedor))
      : 0;

    return (
      <TouchableOpacity
        style={[styles.clienteCard, isSelected && styles.clienteCardSelected]}
        onPress={() => {
          if (deleteMode) {
            toggleClienteSelection(item.id_cliente);
          } else {
            // Navegar para a página de detalhes do cliente
            router.push(`/cliente?id=${item.id_cliente}` as any);
          }
        }}
      >
        <View style={styles.clienteInfo}>
          <View style={styles.clienteNameRow}>
            <Text style={styles.clienteName}>{item.nome}</Text>
            <Text style={styles.clienteSaldoInline}>
              R$ {saldoDevedor.toFixed(2)}
            </Text>
          </View>
          {item.email && <Text style={styles.clienteDetail}>{item.email}</Text>}
          {item.telefone && (
            <Text style={styles.clienteDetail}>{item.telefone}</Text>
          )}
        </View>

        {deleteMode && (
          <View
            style={[
              styles.clienteCheckbox,
              isSelected && styles.clienteCheckboxSelected,
            ]}
          >
            {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Filtrar clientes baseado na busca
  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#007AFF" />
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
        <Text style={styles.headerTitle}>👥 Clientes</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor="#ccc"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de Clientes */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {clientesFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {searchQuery !== ""
                ? "Nenhum cliente encontrado"
                : "Nenhum cliente cadastrado ainda"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={clientesFiltrados}
            renderItem={renderClienteItem}
            keyExtractor={(item) => item.id_cliente.toString()}
            scrollEnabled={false}
            style={styles.listContainer}
          />
        )}
      </ScrollView>

      {/* Modal de Cadastro */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Cliente</Text>

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
              onPress={handleCreateCliente}
            >
              <Text style={styles.submitButtonText}>Criar Cliente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => {
                setShowModal(false);
                setFormData({ nome: "", email: "", telefone: "" });
              }}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAB Buttons */}
      {deleteMode ? (
        <View style={styles.deleteMode}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteClientes}
          >
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setDeleteMode(false);
              setSelectedClientes(new Set());
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>

          {clientes.length > 0 && (
            <TouchableOpacity
              style={[styles.fabButton, styles.fabButtonSecondary]}
              onPress={() => setDeleteMode(true)}
            >
              <Ionicons name="trash" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
