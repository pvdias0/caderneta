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
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
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

// Função para formatar data em DD/MM/YYYY
const formatDate = (value: string): string => {
  let numericValue = value.replace(/\D/g, "");

  if (numericValue.length === 0) return "";
  if (numericValue.length <= 2) return numericValue;
  if (numericValue.length <= 4)
    return `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
  return `${numericValue.slice(0, 2)}/${numericValue.slice(
    2,
    4
  )}/${numericValue.slice(4, 8)}`;
};

// Função para converter data DD/MM/YYYY para YYYY-MM-DD (formato do backend)
const convertDateToBackend = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");
  if (numericValue.length !== 8) return "";

  const day = numericValue.slice(0, 2);
  const month = numericValue.slice(2, 4);
  const year = numericValue.slice(4, 8);

  return `${year}-${month}-${day}`;
};

// Função para obter data atual em formato DD/MM/YYYY
const getDataAtual = (): string => {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

export default function ClienteDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const clienteId = typeof id === "string" ? parseInt(id, 10) : 0;

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMovimentoModal, setShowMovimentoModal] = useState(false);
  const [showEditMovimentoModal, setShowEditMovimentoModal] = useState(false);
  const [movimentoType, setMovimentoType] = useState<"compra" | "pagamento">(
    "compra"
  );
  const [expandedMovimentoId, setExpandedMovimentoId] = useState<number | null>(
    null
  );
  const [editingMovimento, setEditingMovimento] = useState<Movimento | null>(
    null
  );
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
  });
  const [movimentoData, setMovimentoData] = useState({
    valor: "",
    dataPagamento: "",
  });
  const [editMovimentoData, setEditMovimentoData] = useState({
    valor: "",
    dataMovimento: "",
  });
  const [carrinhoEdicao, setCarrinhoEdicao] = useState<any[]>([]);

  // Carrinho de compras
  const [carrinho, setCarrinho] = useState<any[]>([]);
  const [dataCompra, setDataCompra] = useState("");
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | null>(
    null
  );
  const [showProdutoList, setShowProdutoList] = useState(false);
  const [searchProduto, setSearchProduto] = useState("");

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

  // Recarregar dados quando a página ganhar foco
  useFocusEffect(
    useCallback(() => {
      if (clienteId > 0) {
        loadClienteDetails();
        loadMovimentos();
        // Carregar produtos assim que a página é carregada
        const loadProducts = async () => {
          try {
            const response = await apiService.getProdutos();
            if (response.status === 200) {
              let prodArray: any[] = [];
              if (Array.isArray(response.data)) {
                prodArray = response.data;
              } else if (
                response.data?.data &&
                Array.isArray(response.data.data)
              ) {
                prodArray = response.data.data;
              }
              setProdutos(prodArray);
            }
          } catch (error) {
            console.error("Erro ao carregar produtos:", error);
          }
        };
        loadProducts();
      }
    }, [clienteId, loadClienteDetails, loadMovimentos])
  );

  // Carregar produtos quando abrir modal de compra ou edição
  // (redundante agora, mas mantém cache atualizado)
  useEffect(() => {
    // Produtos já estão carregados no useFocusEffect
    // Este efeito não precisa fazer nada
  }, [showMovimentoModal, movimentoType, showEditMovimentoModal]);

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

  // Adicionar produto ao carrinho (com quantidade 1)
  const handleAddToCarrinho = () => {
    if (!selectedProdutoId) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }

    const produto = produtos.find((p) => p.id_produto === selectedProdutoId);
    if (!produto) {
      Alert.alert("Erro", "Produto não encontrado");
      return;
    }

    const quantidade = 1;

    // Verificar se o produto já existe no carrinho
    const existingItemIndex = carrinho.findIndex(
      (item) => item.id_produto === selectedProdutoId
    );

    let novoCarrinho: any[];

    if (existingItemIndex >= 0) {
      // Produto já existe - aumentar quantidade em 1
      novoCarrinho = [...carrinho];
      novoCarrinho[existingItemIndex].quantidade += quantidade;
      novoCarrinho[existingItemIndex].subtotal =
        novoCarrinho[existingItemIndex].quantidade *
        novoCarrinho[existingItemIndex].valor_unitario;
    } else {
      // Novo produto - adicionar ao carrinho com quantidade 1
      const item = {
        id_produto: produto.id_produto,
        nome_produto: produto.nome,
        quantidade: quantidade,
        valor_unitario: produto.valor_produto,
        subtotal: quantidade * produto.valor_produto,
      };
      novoCarrinho = [...carrinho, item];
    }

    setCarrinho(novoCarrinho);
    setSelectedProdutoId(null);
    setSearchProduto("");
    setShowProdutoList(false);
  };

  // Remover item do carrinho
  const handleRemoveFromCarrinho = (index: number) => {
    const novoCarrinho = carrinho.filter((_, i) => i !== index);
    setCarrinho(novoCarrinho);
  };

  // Aumentar quantidade de um item no carrinho
  const handleIncreaseQuantidade = (index: number) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho[index].quantidade += 1;
    novoCarrinho[index].subtotal =
      novoCarrinho[index].quantidade * novoCarrinho[index].valor_unitario;
    setCarrinho(novoCarrinho);
  };

  // Diminuir quantidade de um item no carrinho
  const handleDecreaseQuantidade = (index: number) => {
    const novoCarrinho = [...carrinho];
    if (novoCarrinho[index].quantidade > 1) {
      novoCarrinho[index].quantidade -= 1;
      novoCarrinho[index].subtotal =
        novoCarrinho[index].quantidade * novoCarrinho[index].valor_unitario;
      setCarrinho(novoCarrinho);
    } else {
      handleRemoveFromCarrinho(index);
    }
  };

  const handleEditMovimento = (movimento: Movimento) => {
    setEditingMovimento(movimento);
    // Converter data YYYY-MM-DD para DD/MM/YYYY
    const parts = movimento.data_movimento.split("T")[0].split("-");
    const dataFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;

    setEditMovimentoData({
      valor: formatCurrency((movimento.valor * 100).toString()),
      dataMovimento: dataFormatada,
    });

    // Se for compra, popular o carrinho com os itens existentes
    if (
      movimento.tipo === "COMPRA" &&
      movimento.itens &&
      movimento.itens.length > 0
    ) {
      const itensFormatados = movimento.itens.map((item: any) => ({
        id_produto: Number(item.id_produto),
        nome_produto: getNomeProduto(Number(item.id_produto)),
        quantidade: Number(item.quantidade),
        valor_unitario: Number(item.valor_unitario),
        subtotal: Number(item.quantidade) * Number(item.valor_unitario),
      }));
      setCarrinhoEdicao(itensFormatados);
    } else {
      setCarrinhoEdicao([]);
    }

    setShowEditMovimentoModal(true);
  };

  const handleUpdateMovimento = async () => {
    if (!editingMovimento) return;

    if (
      !editMovimentoData.dataMovimento.trim() ||
      editMovimentoData.dataMovimento.length !== 10
    ) {
      Alert.alert("Erro", "Data deve estar no formato DD/MM/YYYY");
      return;
    }

    try {
      const dataFormatada = convertDateToBackend(
        editMovimentoData.dataMovimento
      );

      let response;
      if (editingMovimento.tipo === "COMPRA") {
        // Se houver itens no carrinho de edição, usar a rota com itens
        if (carrinhoEdicao.length > 0) {
          const itens = carrinhoEdicao.map((item) => ({
            id_produto: item.id_produto,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
          }));

          response = await apiService.updateCompraComItens(
            clienteId,
            editingMovimento.id_compra || 0,
            dataFormatada,
            itens
          );
        } else {
          // Se não houver itens no carrinho, manter a compra original
          response = await apiService.updateCompra(
            clienteId,
            editingMovimento.id_compra || 0,
            editingMovimento.valor,
            dataFormatada
          );
        }
      } else {
        const valor = parseCurrency(editMovimentoData.valor);

        if (isNaN(valor) || valor <= 0) {
          Alert.alert("Erro", "Valor deve ser um número maior que 0");
          return;
        }

        response = await apiService.updatePagamento(
          clienteId,
          editingMovimento.id_pagamento || 0,
          valor,
          dataFormatada
        );
      }

      if (response.status === 200) {
        Alert.alert("Sucesso", "Movimento atualizado com sucesso");
        setShowEditMovimentoModal(false);
        setEditingMovimento(null);
        setCarrinhoEdicao([]);
        await loadClienteDetails();
        await loadMovimentos();
      } else {
        Alert.alert("Erro", response.error || "Erro ao atualizar movimento");
      }
    } catch (error) {
      console.error("Erro ao atualizar movimento:", error);
      Alert.alert("Erro", "Erro ao atualizar movimento");
    }
  };

  // Adicionar produto ao carrinho de edição
  const handleAddToCarrinhoEdicao = () => {
    if (!selectedProdutoId) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }

    const produto = produtos.find((p) => p.id_produto === selectedProdutoId);
    if (!produto) {
      Alert.alert("Erro", "Produto não encontrado");
      return;
    }

    const quantidade = 1;

    // Verificar se o produto já existe no carrinho
    const existingItemIndex = carrinhoEdicao.findIndex(
      (item) => item.id_produto === selectedProdutoId
    );

    let novoCarrinho: any[];

    if (existingItemIndex >= 0) {
      novoCarrinho = [...carrinhoEdicao];
      novoCarrinho[existingItemIndex].quantidade += quantidade;
      novoCarrinho[existingItemIndex].subtotal =
        novoCarrinho[existingItemIndex].quantidade *
        novoCarrinho[existingItemIndex].valor_unitario;
    } else {
      const item = {
        id_produto: produto.id_produto,
        nome_produto: produto.nome,
        quantidade: quantidade,
        valor_unitario: produto.valor_produto,
        subtotal: quantidade * produto.valor_produto,
      };
      novoCarrinho = [...carrinhoEdicao, item];
    }

    setCarrinhoEdicao(novoCarrinho);
    setSelectedProdutoId(null);
    setSearchProduto("");
    setShowProdutoList(false);
  };

  // Remover item do carrinho de edição
  const handleRemoveFromCarrinhoEdicao = (index: number) => {
    const novoCarrinho = carrinhoEdicao.filter((_, i) => i !== index);
    setCarrinhoEdicao(novoCarrinho);
  };

  // Aumentar quantidade de um item no carrinho de edição
  const handleIncreaseQuantidadeEdicao = (index: number) => {
    const novoCarrinho = [...carrinhoEdicao];
    novoCarrinho[index].quantidade += 1;
    novoCarrinho[index].subtotal =
      novoCarrinho[index].quantidade * novoCarrinho[index].valor_unitario;
    setCarrinhoEdicao(novoCarrinho);
  };

  // Diminuir quantidade de um item no carrinho de edição
  const handleDecreaseQuantidadeEdicao = (index: number) => {
    const novoCarrinho = [...carrinhoEdicao];
    if (novoCarrinho[index].quantidade > 1) {
      novoCarrinho[index].quantidade -= 1;
      novoCarrinho[index].subtotal =
        novoCarrinho[index].quantidade * novoCarrinho[index].valor_unitario;
      setCarrinhoEdicao(novoCarrinho);
    } else {
      handleRemoveFromCarrinhoEdicao(index);
    }
  };

  // Calcular total do carrinho de edição
  const calcularTotalEdicao = () => {
    return carrinhoEdicao.reduce((total, item) => total + item.subtotal, 0);
  };

  // Obter nome do produto por ID
  const getNomeProduto = (id_produto: number): string => {
    const produto = produtos.find((p) => p.id_produto === id_produto);
    return produto ? produto.nome : `Produto #${id_produto}`;
  };

  // Filtrar produtos pelo search
  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchProduto.toLowerCase())
  );

  // Calcular total do carrinho
  const calcularTotal = () => {
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleCreateMovimento = async () => {
    if (movimentoType === "compra") {
      // Nova lógica para compra com itens
      if (!dataCompra.trim() || dataCompra.length !== 10) {
        Alert.alert("Erro", "Data da compra deve estar no formato DD/MM/YYYY");
        return;
      }

      if (carrinho.length === 0) {
        Alert.alert("Erro", "Adicione pelo menos um item à compra");
        return;
      }

      try {
        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        const dataFormatada = convertDateToBackend(dataCompra);

        const itens = carrinho.map((item) => ({
          id_produto: item.id_produto,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        }));

        const response = await apiService.createCompraComItens(
          clienteId,
          dataFormatada,
          itens
        );

        if (response.status === 201) {
          Alert.alert("Sucesso", "Compra criada com sucesso");
          setCarrinho([]);
          setDataCompra("");
          setMovimentoData({ valor: "", dataPagamento: "" });
          setShowMovimentoModal(false);
          await loadClienteDetails();
          await loadMovimentos();
        } else {
          Alert.alert("Erro", response.error || "Erro ao criar compra");
        }
      } catch (error) {
        console.error("Erro ao criar compra:", error);
        Alert.alert("Erro", "Erro ao criar compra");
      }
    } else {
      // Pagamento
      const valor = parseCurrency(movimentoData.valor);

      if (!movimentoData.valor.trim()) {
        Alert.alert("Erro", "Valor do pagamento é obrigatório");
        return;
      }

      if (
        !movimentoData.dataPagamento.trim() ||
        movimentoData.dataPagamento.length !== 10
      ) {
        Alert.alert(
          "Erro",
          "Data do pagamento deve estar no formato DD/MM/YYYY"
        );
        return;
      }

      if (isNaN(valor) || valor <= 0) {
        Alert.alert("Erro", "Valor deve ser um número maior que 0");
        return;
      }

      try {
        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        const dataFormatada = convertDateToBackend(movimentoData.dataPagamento);

        const response = await apiService.createPagamento(
          clienteId,
          valor,
          dataFormatada
        );

        if (response.status === 201) {
          Alert.alert("Sucesso", "Pagamento criado com sucesso");
          setMovimentoData({ valor: "", dataPagamento: "" });
          setShowMovimentoModal(false);
          await loadClienteDetails();
          await loadMovimentos();
        } else {
          Alert.alert("Erro", response.error || "Erro ao criar pagamento");
        }
      } catch (error) {
        console.error("Erro ao criar pagamento:", error);
        Alert.alert("Erro", "Erro ao criar pagamento");
      }
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
                await loadClienteDetails();
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

  const renderMovimentoItem = ({ item }: { item: Movimento }) => {
    const isExpanded = expandedMovimentoId === item.id_movimento;
    const temItens =
      item.tipo === "COMPRA" && item.itens && item.itens.length > 0;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (temItens) {
            setExpandedMovimentoId(isExpanded ? null : item.id_movimento);
          }
        }}
      >
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
              {temItens && (
                <Text
                  style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}
                >
                  {isExpanded ? "▼" : "▶"} {item.itens?.length} item(ns)
                </Text>
              )}
            </View>
            <Text style={styles.movimentoValue}>
              R$ {item.valor.toFixed(2)}
            </Text>
            <Text style={styles.movimentoDate}>
              {new Date(item.data_movimento).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity
              onPress={() => handleEditMovimento(item)}
              style={{ padding: 8 }}
            >
              <Ionicons name="create" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteMovimento(item)}
              style={{ padding: 8 }}
            >
              <Ionicons name="trash" size={20} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Itens da Compra */}
        {isExpanded && temItens && (
          <View style={styles.movimentoItensContainer}>
            {item.itens?.map((itemCompra, index) => {
              const quantidade = Number(itemCompra.quantidade) || 0;
              const valorUnitario = Number(itemCompra.valor_unitario) || 0;
              return (
                <View key={index} style={styles.movimentoItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.movimentoItemNome}>
                      {getNomeProduto(Number(itemCompra.id_produto))}
                    </Text>
                    <Text style={styles.movimentoItemDetalhes}>
                      {quantidade}x R$ {valorUnitario.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.movimentoItemSubtotal}>
                    R$ {(quantidade * valorUnitario).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
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
                color:
                  parseFloat(String(cliente.saldo_devedor ?? 0)) > 0
                    ? "#ff3b30"
                    : "#34C759",
              },
            ]}
          >
            R$ {parseFloat(String(cliente.saldo_devedor ?? 0)).toFixed(2)}
          </Text>
          {parseFloat(String(cliente.saldo_devedor ?? 0)) > 0 && (
            <Text style={{ fontSize: 12, color: "#ff3b30", marginTop: 4 }}>
              Débito pendente
            </Text>
          )}
          {parseFloat(String(cliente.saldo_devedor ?? 0)) === 0 && (
            <Text style={{ fontSize: 12, color: "#34C759", marginTop: 4 }}>
              Tudo em dia ✓
            </Text>
          )}
        </View>

        {/* Seção de Movimentos */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>📊 Movimentos</Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              marginBottom: 12,
              marginTop: 12,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setMovimentoType("compra");
                setDataCompra(getDataAtual());
                setMovimentoData({ valor: "", dataPagamento: "" });
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
                setMovimentoData({ valor: "", dataPagamento: getDataAtual() });
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
            <TouchableOpacity
              onPress={async () => {
                try {
                  const response = await apiService.gerarExtratoCliente(
                    clienteId
                  );
                  if (response.status === 200) {
                    // Abrir o PDF no navegador padrão
                    await Linking.openURL(response.url);
                  } else {
                    Alert.alert(
                      "Erro",
                      response.error || "Erro ao gerar extrato"
                    );
                  }
                } catch (error) {
                  console.error("Erro ao gerar extrato:", error);
                  Alert.alert("Erro", "Erro ao gerar extrato");
                }
              }}
              style={{
                backgroundColor: "#007AFF",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="document" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                Extrato
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

            <Text style={styles.inputLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome..."
              placeholderTextColor="#ccc"
              value={formData.nome}
              onChangeText={(text) => setFormData({ ...formData, nome: text })}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#ccc"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />

            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
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

            {movimentoType === "compra" ? (
              <>
                {/* Data da Compra */}
                <Text style={styles.inputLabel}>Data da Compra *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={dataCompra}
                  onChangeText={(text) => setDataCompra(formatDate(text))}
                />

                {/* Search de Produto */}
                <Text style={styles.inputLabel}>Buscar Produto *</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o nome do produto..."
                  placeholderTextColor="#ccc"
                  value={searchProduto}
                  onChangeText={(text) => {
                    setSearchProduto(text);
                    setShowProdutoList(text.length > 0);
                  }}
                  onFocus={() => setShowProdutoList(true)}
                />

                {/* Lista de Produtos com Filtro */}
                {showProdutoList && searchProduto.length > 0 && (
                  <ScrollView style={styles.produtoList}>
                    {filteredProdutos.length > 0 ? (
                      filteredProdutos.map((produto) => (
                        <TouchableOpacity
                          key={produto.id_produto}
                          style={[
                            styles.produtoItem,
                            selectedProdutoId === produto.id_produto &&
                              styles.produtoItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedProdutoId(produto.id_produto);
                            setSearchProduto("");
                            setShowProdutoList(false);
                          }}
                        >
                          <View style={styles.produtoItemContent}>
                            <Text style={styles.produtoItemText}>
                              {produto.nome}
                            </Text>
                            <Text style={styles.produtoItemPrice}>
                              R$ {produto.valor_produto.toFixed(2)}
                            </Text>
                          </View>
                          {selectedProdutoId === produto.id_produto && (
                            <Text style={styles.produtoItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.produtoEmpty}>
                        <Text style={styles.produtoEmptyText}>
                          Nenhum produto encontrado
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}

                {/* Produto Selecionado */}
                {selectedProdutoId && (
                  <View style={styles.produtoSelecionado}>
                    <Text style={styles.produtoSelecionadoLabel}>
                      Produto Selecionado:
                    </Text>
                    <Text style={styles.produtoSelecionadoNome}>
                      {
                        produtos.find((p) => p.id_produto === selectedProdutoId)
                          ?.nome
                      }
                    </Text>
                    <Text style={styles.produtoSelecionadoPreco}>
                      R${" "}
                      {produtos
                        .find((p) => p.id_produto === selectedProdutoId)
                        ?.valor_produto.toFixed(2)}
                    </Text>
                  </View>
                )}

                {/* Botão Adicionar ao Carrinho */}
                <TouchableOpacity
                  style={[
                    styles.addButtonPlus,
                    !selectedProdutoId && styles.addButtonPlusDisabled,
                  ]}
                  onPress={handleAddToCarrinho}
                  disabled={!selectedProdutoId}
                >
                  <Text style={styles.addButtonPlusText}>+ Adicionar</Text>
                </TouchableOpacity>

                {/* Exibição do Carrinho */}
                <Text style={styles.carrinhoTitle}>
                  Itens na Compra ({carrinho.length})
                </Text>

                <ScrollView style={styles.carrinhoList}>
                  {carrinho.map((item, index) => (
                    <View key={index} style={styles.carrinhoItem}>
                      <View style={styles.carrinhoItemInfo}>
                        <Text style={styles.carrinhoItemNome}>
                          {item.nome_produto}
                        </Text>
                        <Text style={styles.carrinhoItemDetalhes}>
                          R$ {item.valor_unitario.toFixed(2)}
                        </Text>
                        <Text style={styles.carrinhoItemSubtotal}>
                          Subtotal: R$ {item.subtotal.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.carrinhoItemControls}>
                        <TouchableOpacity
                          onPress={() => handleDecreaseQuantidade(index)}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.quantityDisplay}>
                          {item.quantidade}
                        </Text>

                        <TouchableOpacity
                          onPress={() => handleIncreaseQuantidade(index)}
                          style={styles.quantityButton}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleRemoveFromCarrinho(index)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Total */}
                <View style={styles.totalSection}>
                  <Text style={styles.totalLabel}>TOTAL:</Text>
                  <Text style={styles.totalValue}>
                    R$ {calcularTotal().toFixed(2)}
                  </Text>
                </View>

                {/* Botões de Ação */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateMovimento}
                  disabled={carrinho.length === 0}
                >
                  <Text style={styles.submitButtonText}>Confirmar Compra</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Data do Pagamento */}
                <Text style={styles.inputLabel}>Data do Pagamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={movimentoData.dataPagamento}
                  onChangeText={(text) =>
                    setMovimentoData({
                      ...movimentoData,
                      dataPagamento: formatDate(text),
                    })
                  }
                />

                {/* Valor do Pagamento */}
                <Text style={styles.inputLabel}>Valor do Pagamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="R$ 0,00"
                  placeholderTextColor="#ccc"
                  keyboardType="decimal-pad"
                  value={movimentoData.valor}
                  onChangeText={(text) => {
                    const formatted = formatCurrency(text);
                    setMovimentoData({ ...movimentoData, valor: formatted });
                  }}
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCreateMovimento}
                >
                  <Text style={styles.submitButtonText}>Criar Pagamento</Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowMovimentoModal(false);
                setCarrinho([]);
                setDataCompra("");
                setSelectedProdutoId(null);
                setSearchProduto("");
                setShowProdutoList(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição de Movimento */}
      <Modal
        visible={showEditMovimentoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditMovimentoModal(false)}
      >
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>
              Editar{" "}
              {editingMovimento?.tipo === "COMPRA" ? "Compra" : "Pagamento"}
            </Text>

            {editingMovimento?.tipo === "COMPRA" ? (
              <>
                {/* Data da Compra */}
                <Text style={styles.inputLabel}>Data da Compra *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={editMovimentoData.dataMovimento}
                  onChangeText={(text) =>
                    setEditMovimentoData({
                      ...editMovimentoData,
                      dataMovimento: formatDate(text),
                    })
                  }
                />

                {/* Search de Produto */}
                <Text style={styles.inputLabel}>Buscar Produto</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Digite o nome do produto..."
                  placeholderTextColor="#ccc"
                  value={searchProduto}
                  onChangeText={(text) => {
                    setSearchProduto(text);
                    setShowProdutoList(text.length > 0);
                  }}
                  onFocus={() => setShowProdutoList(true)}
                />

                {/* Lista de Produtos com Filtro */}
                {showProdutoList && searchProduto.length > 0 && (
                  <ScrollView style={styles.produtoList}>
                    {filteredProdutos.length > 0 ? (
                      filteredProdutos.map((produto) => (
                        <TouchableOpacity
                          key={produto.id_produto}
                          style={[
                            styles.produtoItem,
                            selectedProdutoId === produto.id_produto &&
                              styles.produtoItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedProdutoId(produto.id_produto);
                            setSearchProduto("");
                            setShowProdutoList(false);
                          }}
                        >
                          <View style={styles.produtoItemContent}>
                            <Text style={styles.produtoItemText}>
                              {produto.nome}
                            </Text>
                            <Text style={styles.produtoItemPrice}>
                              R$ {produto.valor_produto.toFixed(2)}
                            </Text>
                          </View>
                          {selectedProdutoId === produto.id_produto && (
                            <Text style={styles.produtoItemCheck}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.produtoEmpty}>
                        <Text style={styles.produtoEmptyText}>
                          Nenhum produto encontrado
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}

                {/* Botão Adicionar */}
                {selectedProdutoId && (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddToCarrinhoEdicao}
                  >
                    <Text style={styles.submitButtonText}>
                      Adicionar Produto
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Carrinho de Edição */}
                {carrinhoEdicao.length > 0 && (
                  <>
                    <ScrollView style={{ maxHeight: 250, marginVertical: 12 }}>
                      {carrinhoEdicao.map((item, index) => (
                        <View key={index} style={styles.carrinhoItem}>
                          <View style={styles.carrinhoItemInfo}>
                            <Text style={styles.carrinhoItemNome}>
                              {item.nome_produto}
                            </Text>
                            <Text style={styles.carrinhoItemDetalhes}>
                              R$ {item.valor_unitario.toFixed(2)}
                            </Text>
                            <Text style={styles.carrinhoItemSubtotal}>
                              Subtotal: R$ {item.subtotal.toFixed(2)}
                            </Text>
                          </View>

                          <View style={styles.carrinhoItemControls}>
                            <TouchableOpacity
                              onPress={() =>
                                handleDecreaseQuantidadeEdicao(index)
                              }
                              style={styles.quantityButton}
                            >
                              <Text style={styles.quantityButtonText}>−</Text>
                            </TouchableOpacity>

                            <Text style={styles.quantityDisplay}>
                              {item.quantidade}
                            </Text>

                            <TouchableOpacity
                              onPress={() =>
                                handleIncreaseQuantidadeEdicao(index)
                              }
                              style={styles.quantityButton}
                            >
                              <Text style={styles.quantityButtonText}>+</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() =>
                                handleRemoveFromCarrinhoEdicao(index)
                              }
                              style={styles.removeButton}
                            >
                              <Text style={styles.removeButtonText}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>

                    {/* Total */}
                    <View style={styles.totalSection}>
                      <Text style={styles.totalLabel}>TOTAL:</Text>
                      <Text style={styles.totalValue}>
                        R$ {calcularTotalEdicao().toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUpdateMovimento}
                  disabled={carrinhoEdicao.length === 0}
                >
                  <Text style={styles.submitButtonText}>Atualizar Compra</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Valor */}
                <Text style={styles.inputLabel}>Valor do Pagamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="R$ 0,00"
                  placeholderTextColor="#ccc"
                  keyboardType="decimal-pad"
                  value={editMovimentoData.valor}
                  onChangeText={(text) => {
                    const formatted = formatCurrency(text);
                    setEditMovimentoData({
                      ...editMovimentoData,
                      valor: formatted,
                    });
                  }}
                />

                {/* Data */}
                <Text style={styles.inputLabel}>Data do Pagamento *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={editMovimentoData.dataMovimento}
                  onChangeText={(text) =>
                    setEditMovimentoData({
                      ...editMovimentoData,
                      dataMovimento: formatDate(text),
                    })
                  }
                />

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleUpdateMovimento}
                >
                  <Text style={styles.submitButtonText}>
                    Atualizar Pagamento
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowEditMovimentoModal(false);
                setEditingMovimento(null);
                setCarrinhoEdicao([]);
                setSelectedProdutoId(null);
                setSearchProduto("");
                setShowProdutoList(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
