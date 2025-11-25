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
import { apiService, Produto } from "../../../services/api";
import { styles } from "./styles";

// Função para formatar moeda real
const formatCurrency = (value: string): string => {
  // Remove caracteres não numéricos
  let numericValue = value.replace(/\D/g, "");

  // Garante que tem pelo menos um dígito
  if (numericValue === "") return "";

  // Converte para número e formata com vírgula
  const numberValue = parseInt(numericValue, 10);
  const formatted = (numberValue / 100).toFixed(2).replace(".", ",");

  // Adiciona separador de milhares
  const parts = formatted.split(",");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `R$ ${parts.join(",")}`;
};

// Função para extrair valor numérico da moeda formatada
const parseCurrency = (value: string): number => {
  const cleanValue = value.replace(/\D/g, "");
  return cleanValue === "" ? 0 : parseInt(cleanValue, 10) / 100;
};

export default function EstoqueScreen() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProdutos, setSelectedProdutos] = useState<Set<number>>(
    new Set()
  );

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    valor_produto: "",
    quantidade_estoque: "",
  });

  // Carregar produtos ao montar o componente
  useEffect(() => {
    loadProdutos();
  }, []);

  // Recarregar produtos quando a página ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadProdutos();
    }, [])
  );

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProdutos();

      if (response.status === 200 && response.data) {
        let produtosArray: any[] = [];

        // Se a resposta retorna um array diretamente
        if (Array.isArray(response.data)) {
          produtosArray = response.data;
        }
        // Se a resposta retorna um objeto com propriedade 'data'
        else if (response.data.data && Array.isArray(response.data.data)) {
          produtosArray = response.data.data;
        }
        // Se a resposta retorna um objeto com propriedade 'produtos'
        else if (
          response.data.produtos &&
          Array.isArray(response.data.produtos)
        ) {
          produtosArray = response.data.produtos;
        } else {
          produtosArray = [];
        }

        // Converter id_produto para número se for string
        const produtosConvertidos = produtosArray.map((produto) => ({
          ...produto,
          id_produto:
            typeof produto.id_produto === "string"
              ? parseInt(produto.id_produto, 10)
              : produto.id_produto,
          valor_produto: Number(produto.valor_produto) || 0,
          quantidade_estoque: Number(produto.quantidade_estoque) || 0,
        }));

        setProdutos(produtosConvertidos);
      } else {
        Alert.alert("Erro", response.error || "Erro ao carregar produtos");
        setProdutos([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar produtos:", error);
      Alert.alert("Erro", "Erro ao carregar produtos");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduto = async () => {
    if (!formData.nome.trim()) {
      Alert.alert("Erro", "Nome do produto é obrigatório");
      return;
    }

    if (!formData.valor_produto.trim()) {
      Alert.alert("Erro", "Valor do produto é obrigatório");
      return;
    }

    if (!formData.quantidade_estoque.trim()) {
      Alert.alert("Erro", "Quantidade em estoque é obrigatória");
      return;
    }

    const valor = parseCurrency(formData.valor_produto);
    const quantidade = parseFloat(formData.quantidade_estoque) || 0;

    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Erro", "Valor deve ser um número maior que 0");
      return;
    }

    if (isNaN(quantidade) || quantidade <= 0) {
      Alert.alert("Erro", "Quantidade deve ser um número maior que 0");
      return;
    }

    try {
      const response = await apiService.createProduto({
        nome: formData.nome,
        valor_produto: valor,
        quantidade_estoque: quantidade,
      });

      if (response.status === 201) {
        Alert.alert("Sucesso", "Produto criado com sucesso");
        setFormData({ nome: "", valor_produto: "", quantidade_estoque: "" });
        setShowModal(false);

        // Se a resposta incluir o produto criado, adicionar diretamente
        if (response.data && response.data.id_produto) {
          setProdutos([...produtos, response.data as Produto]);
        } else {
          // Caso contrário, recarregar a lista
          await loadProdutos();
        }
      } else {
        Alert.alert("Erro", response.error || "Erro ao criar produto");
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      Alert.alert("Erro", "Erro ao criar produto");
    }
  };

  const toggleProdutoSelection = (id: number) => {
    const newSelected = new Set(selectedProdutos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProdutos(newSelected);
  };

  const handleDeleteProdutos = async () => {
    if (selectedProdutos.size === 0) {
      Alert.alert("Aviso", "Selecione ao menos um produto para deletar");
      return;
    }

    Alert.alert("Confirmar", `Deletar ${selectedProdutos.size} produto(s)?`, [
      { text: "Cancelar", onPress: () => {} },
      {
        text: "Deletar",
        onPress: async () => {
          try {
            const ids = Array.from(selectedProdutos);

            // Remover localmente primeiro (otimistic update)
            const produtosAtualizados = produtos.filter(
              (produto) => !ids.includes(produto.id_produto)
            );
            setProdutos(produtosAtualizados);
            setSelectedProdutos(new Set());
            setDeleteMode(false);

            // Depois enviar para o servidor
            const response = await apiService.deleteProdutos(ids);

            if (response.status !== 200) {
              // Se falhar, recarregar a lista
              Alert.alert("Erro", response.error || "Erro ao deletar produtos");
              await loadProdutos();
            } else {
              Alert.alert("Sucesso", "Produtos deletados com sucesso");
            }
          } catch (error) {
            console.error("❌ Erro ao deletar produtos:", error);
            Alert.alert("Erro", "Erro ao deletar produtos");
            // Recarregar em caso de erro
            await loadProdutos();
          }
        },
      },
    ]);
  };

  const renderProdutoItem = ({ item }: { item: Produto }) => {
    const isSelected = selectedProdutos.has(item.id_produto);
    const valor = Number(item.valor_produto) || 0;
    const quantidade = Number(item.quantidade_estoque) || 0;

    return (
      <TouchableOpacity
        style={[styles.produtoCard, isSelected && styles.produtoCardSelected]}
        onPress={() => {
          if (deleteMode) {
            toggleProdutoSelection(item.id_produto);
          }
        }}
        disabled={!deleteMode}
      >
        <View style={styles.produtoInfo}>
          <Text style={styles.produtoName}>{item.nome}</Text>

          <View style={styles.produtoDetailsRow}>
            <View style={styles.produtoDetailItem}>
              <Text style={styles.produtoDetailLabel}>Preço</Text>
              <Text style={styles.produtoDetailValue}>
                R$ {valor.toFixed(2)}
              </Text>
            </View>

            <View style={styles.produtoDetailItem}>
              <Text style={styles.produtoDetailLabel}>Quantidade</Text>
              <Text style={styles.produtoDetailValue}>
                {Math.floor(quantidade)} un
              </Text>
            </View>
          </View>
        </View>

        {deleteMode && (
          <View
            style={[
              styles.produtoCheckbox,
              isSelected && styles.produtoCheckboxSelected,
            ]}
          >
            {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Filtrar produtos baseado na busca
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Text style={styles.headerTitle}>📦 Estoque</Text>
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
          placeholder="Buscar produto..."
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

      {/* Lista de Produtos */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {produtosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              {searchQuery !== ""
                ? "Nenhum produto encontrado"
                : "Nenhum produto cadastrado ainda"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={produtosFiltrados}
            renderItem={renderProdutoItem}
            keyExtractor={(item) => item.id_produto.toString()}
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
            <Text style={styles.modalTitle}>Novo Produto</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome *"
              placeholderTextColor="#ccc"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Valor (R$) *"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              value={formData.valor_produto}
              onChangeText={(text) => {
                // Formata enquanto digita
                const formatted = formatCurrency(text);
                setFormData({ ...formData, valor_produto: formatted });
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Quantidade em estoque *"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              value={formData.quantidade_estoque}
              onChangeText={(text) => {
                // Aceita apenas números inteiros
                const integerOnly = text.replace(/[^0-9]/g, "");
                setFormData({ ...formData, quantidade_estoque: integerOnly });
              }}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateProduto}
            >
              <Text style={styles.submitButtonText}>Criar Produto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => {
                setShowModal(false);
                setFormData({
                  nome: "",
                  valor_produto: "",
                  quantidade_estoque: "",
                });
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
            onPress={handleDeleteProdutos}
          >
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setDeleteMode(false);
              setSelectedProdutos(new Set());
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

          {produtos.length > 0 && (
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
