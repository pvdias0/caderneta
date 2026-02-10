/**
 * Modal para criar/editar compra com carrinho de itens
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IMovimento } from "../types/movimento";
import { IProduto } from "../types/produto";
import { apiService } from "../services/api";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export interface CompraModalProps {
  visible: boolean;
  compra?: IMovimento;
  onClose: () => void;
  onSave: (data: {
    data_compra: string;
    itens: {
      id_produto: number;
      quantidade: number;
      valor_unitario: number;
    }[];
  }) => void;
  loading?: boolean;
}

interface CartItem {
  id_produto: number;
  quantidade: number;
  valor_unitario: number;
  produto?: IProduto;
  originalQuantidade?: number; // Quantidade original ao editar compra
}

export const CompraModal: React.FC<CompraModalProps> = ({
  visible,
  compra,
  onClose,
  onSave,
  loading = false,
}) => {
  const [data, setData] = useState(new Date());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [produtos, setProdutos] = useState<IProduto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [showProdutoSelector, setShowProdutoSelector] = useState(false);
  const [selectedProdutoId, setSelectedProdutoId] = useState<number | null>(
    null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchProduto, setSearchProduto] = useState("");
  const DEFAULT_QUANTITY = 1;

  useEffect(() => {
    if (visible) {
      loadProdutos();
      if (compra) {
        console.log('📋 [CompraModal] Modal aberto para EDITAR compra:', {
          id_compra: compra.id_movimento,
          data_movimento: compra.data_movimento,
          itens_count: compra.itens?.length || 0,
        });
        setData(new Date(compra.data_movimento));
        if (compra.itens) {
          console.log('🛒 [CompraModal] Itens da compra a editar:', compra.itens);
          // Normalizar quantidades para inteiros e armazenar quantidade original
          const itensNormalizados = compra.itens.map((item: any) => ({
            ...item,
            id_produto: Number(item.id_produto), // Converter para number
            quantidade: Math.round(item.quantidade),
            valor_unitario: Number(item.valor_unitario), // Garantir que é número também
            originalQuantidade: Math.round(item.quantidade), // Guardar quantidade original para cálculo de estoque
          }));
          console.log('✅ [CompraModal] Itens normalizados:', itensNormalizados);
          setCart(itensNormalizados);
        }
      } else {
        console.log('➕ [CompraModal] Modal aberto para CRIAR nova compra');
        setData(new Date());
        setCart([]);
      }
      setErrors({});
    }
  }, [visible, compra]);

  // Effect para popular os dados dos produtos nos itens do carrinho
  // Executa quando produtos é carregado E há itens no carrinho
  useEffect(() => {
    console.log('🔄 [CompraModal] Verificando sincronização de produtos:', {
      cart_length: cart.length,
      produtos_length: produtos.length,
    });
    
    if (cart.length > 0 && produtos.length > 0) {
      console.log('🔍 [CompraModal] Verificando itens no carrinho...');
      // Verifica quais itens precisam ser populados
      const itensComDadosIncompletos = cart.some((item) => !item.produto);
      console.log('❓ [CompraModal] Itens com dados incompletos:', itensComDadosIncompletos);

      if (itensComDadosIncompletos) {
        console.log('📦 [CompraModal] Populando dados dos produtos...');
        const cartAtualizado = cart.map((item) => {
          if (!item.produto) {
            console.log(`🔎 [CompraModal] Procurando produto com ID ${item.id_produto} em ${produtos.length} produtos disponíveis`);
            console.log(`📋 [CompraModal] IDs disponíveis:`, produtos.map((p: IProduto) => p.id_produto));
            const produtoEncontrado = produtos.find(
              (p) => p.id_produto === item.id_produto
            );
            if (produtoEncontrado) {
              console.log(`✨ [CompraModal] Produto encontrado para ID ${item.id_produto}:`, {
                nome: produtoEncontrado.nome,
                estoque: produtoEncontrado.quantidade_estoque,
              });
              return { ...item, produto: produtoEncontrado };
            } else {
              console.warn(`⚠️ [CompraModal] Produto NÃO encontrado para ID ${item.id_produto}`);
              console.warn(`⚠️ [CompraModal] Detalhes do item:`, item);
              console.warn(`⚠️ [CompraModal] Tipo de id_produto: ${typeof item.id_produto}, valor: ${item.id_produto}`);
            }
          }
          return item;
        });

        // Só atualiza se realmente alterou algum item
        const cartStr = JSON.stringify(cart);
        const cartAtualizadoStr = JSON.stringify(cartAtualizado);
        if (cartStr !== cartAtualizadoStr) {
          console.log('🔄 [CompraModal] Atualizando carrinho com dados dos produtos');
          console.log('📊 [CompraModal] Carrinho atualizado:', cartAtualizado);
          setCart(cartAtualizado);
        } else {
          console.log('✓ [CompraModal] Carrinho já estava populado, nenhuma alteração necessária');
        }
      } else {
        console.log('✓ [CompraModal] Todos os itens já têm dados de produto');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos]);

  const loadProdutos = async () => {
    try {
      console.log('📥 [CompraModal] Iniciando carregamento de produtos...');
      setLoadingProdutos(true);
      const data = await apiService.getProdutos();
      const produtosCarregados = data.data || [];
      console.log(`✅ [CompraModal] ${produtosCarregados.length} produtos carregados (raw):`, produtosCarregados);
      console.log(`✅ [CompraModal] ${produtosCarregados.length} produtos carregados (mapeado):`, 
        produtosCarregados.map((p: IProduto) => ({ id: p.id_produto, nome: p.nome, estoque: p.quantidade_estoque }))
      );
      setProdutos(produtosCarregados);
    } catch (error) {
      console.error("❌ [CompraModal] Erro ao carregar produtos:", error);
      Alert.alert("Erro", "Não foi possível carregar os produtos");
    } finally {
      setLoadingProdutos(false);
    }
  };

  const formatDisplayDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setData(selectedDate);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  /**
   * Calcula o estoque disponível para um item do carrinho
   * Durante criação: estoque total do produto
   * Durante edição: estoque total + quantidade que está sendo "devolvida" ao reduzir
   */
  const getAvailableStock = (cartItem: CartItem): number => {
    if (!cartItem.produto) return 0;
    
    // Se tem quantidade original (está em modo edição), calcular estoque disponível
    if (cartItem.originalQuantidade !== undefined) {
      const quantidadeDevolvidaAoEstoque = cartItem.originalQuantidade - cartItem.quantidade;
      return cartItem.produto.quantidade_estoque + quantidadeDevolvidaAoEstoque;
    }
    
    // Caso contrário, retornar estoque total (modo criação)
    return cartItem.produto.quantidade_estoque;
  };

  const addToCart = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedProdutoId) {
      newErrors.produto = "Selecione um produto";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const produto = produtos.find((p) => p.id_produto === selectedProdutoId);
    if (!produto || selectedProdutoId === null) {
      Alert.alert("Erro", "Produto não encontrado");
      return;
    }

    // Validar estoque
    if (produto.quantidade_estoque === 0) {
      Alert.alert(
        "Sem Estoque",
        `O produto "${produto.nome}" não possui quantidade disponível em estoque.`
      );
      return;
    }

    // Usar quantidade padrão ao adicionar
    const qtd = DEFAULT_QUANTITY;

    // Verificar se há estoque suficiente
    if (produto.quantidade_estoque < qtd) {
      Alert.alert(
        "Estoque Insuficiente",
        `O produto "${produto.nome}" possui apenas ${produto.quantidade_estoque} unidade(s) em estoque.`
      );
      return;
    }

    // Verificar se produto já está no carrinho
    const existingIndex = cart.findIndex(
      (i) => i.id_produto === selectedProdutoId
    );
    if (existingIndex >= 0) {
      // Se já está no carrinho, validar se há estoque suficiente para aumentar
      const novaQuantidade = cart[existingIndex].quantidade + qtd;
      if (produto.quantidade_estoque < novaQuantidade) {
        Alert.alert(
          "Estoque Insuficiente",
          `O produto "${produto.nome}" possui apenas ${produto.quantidade_estoque} unidade(s) em estoque, mas você já tem ${cart[existingIndex].quantidade} no carrinho.`
        );
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex].quantidade += qtd;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id_produto: selectedProdutoId,
          quantidade: qtd,
          valor_unitario: produto.valor_produto,
          produto,
        },
      ]);
    }

    // Reset
    setSelectedProdutoId(null);
    setSearchProduto("");
    setShowProdutoSelector(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, newQtd: string) => {
    // Aceitar apenas números inteiros
    const qtd = parseInt(newQtd, 10);
    if (!isNaN(qtd) && qtd > 0) {
      // Validar estoque disponível
      const item = cart[index];
      
      // Se não tem produto carregado, tentar carregar agora
      if (!item.produto) {
        const produtoEncontrado = produtos.find(
          (p) => p.id_produto === item.id_produto
        );
        if (produtoEncontrado) {
          item.produto = produtoEncontrado;
        } else {
          Alert.alert("Erro", "Dados do produto não encontrado");
          return;
        }
      }
      
      const availableStock = getAvailableStock(item);
      
      if (qtd > availableStock) {
        Alert.alert(
          "Estoque Insuficiente",
          `O produto "${item.produto.nome}" possui apenas ${availableStock} unidade(s) disponível(is).`
        );
        return;
      }

      const updatedCart = [...cart];
      updatedCart[index].quantidade = qtd;
      setCart(updatedCart);
    }
  };

  const getTotalValue = (): number => {
    return cart.reduce(
      (sum, item) => sum + item.quantidade * item.valor_unitario,
      0
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (cart.length === 0) {
      newErrors.cart = "Adicione pelo menos um item ao carrinho";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const dataCompra = data.toISOString();
    const itens = cart.map((item) => ({
      id_produto: item.id_produto,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    }));

    onSave({
      data_compra: dataCompra,
      itens,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.backdrop} />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {compra ? "Editar Compra" : "Nova Compra"}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Data */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Data da Compra</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar" size={20} color="#e91e63" />
                <Text style={styles.dateButtonText}>
                  {formatDisplayDate(data)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={data}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    textColor="#333"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.datePickerClose}
                      onPress={closeDatePicker}
                    >
                      <Text style={styles.datePickerCloseText}>Confirmar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Seletor de produtos */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Produtos</Text>

              {/* Botão para adicionar produto */}
              <TouchableOpacity
                onPress={() => setShowProdutoSelector(!showProdutoSelector)}
                disabled={loading || loadingProdutos}
                style={styles.addProductButton}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addProductButtonText}>
                  Adicionar Produto
                </Text>
              </TouchableOpacity>

              {errors.produto && (
                <Text style={styles.errorText}>{errors.produto}</Text>
              )}
              {errors.cart && (
                <Text style={styles.errorText}>{errors.cart}</Text>
              )}

              {/* Seletor de produto expandido */}
              {showProdutoSelector && (
                <View style={styles.produtoSelector}>
                  {loadingProdutos ? (
                    <ActivityIndicator size="small" color="#e91e63" />
                  ) : (
                    <>
                      <Text style={styles.selectorLabel}>
                        Selecione o Produto ({
                          produtos.filter(p =>
                            p.nome
                              .toLowerCase()
                              .includes(searchProduto.toLowerCase())
                          ).length
                        })
                      </Text>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar produto..."
                        placeholderTextColor="#999"
                        value={searchProduto}
                        onChangeText={setSearchProduto}
                      />
                      <FlatList
                        data={produtos.filter(p =>
                          p.nome
                            .toLowerCase()
                            .includes(searchProduto.toLowerCase())
                        )}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.id_produto.toString()}
                        renderItem={({ item }) => {
                          const isOutOfStock = item.quantidade_estoque === 0;
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                if (!isOutOfStock) {
                                  setSelectedProdutoId(item.id_produto);
                                }
                              }}
                              disabled={isOutOfStock}
                              style={[
                                styles.produtoOption,
                                isOutOfStock && styles.produtoOptionDisabled,
                                selectedProdutoId === item.id_produto &&
                                  styles.produtoOptionSelected,
                              ]}
                            >
                              <View style={styles.produtoOptionContent}>
                                <Text
                                  style={[
                                    styles.produtoOptionName,
                                    isOutOfStock && styles.produtoOptionNameDisabled,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.nome}
                                </Text>
                                <View style={styles.produtoOptionSubInfo}>
                                  <Text style={styles.produtoOptionPrice}>
                                    {formatCurrency(item.valor_produto)}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.produtoOptionStock,
                                      isOutOfStock && styles.produtoOptionStockEmpty,
                                    ]}
                                  >
                                    {isOutOfStock
                                      ? "Sem estoque"
                                      : `Estoque: ${item.quantidade_estoque}`}
                                  </Text>
                                </View>
                              </View>
                              {selectedProdutoId === item.id_produto &&
                                !isOutOfStock && (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={20}
                                    color="#e91e63"
                                  />
                                )}
                              {isOutOfStock && (
                                <Ionicons
                                  name="lock-closed"
                                  size={20}
                                  color="#ccc"
                                />
                              )}
                            </TouchableOpacity>
                          );
                        }}
                      />

                      {/* Botão para adicionar ao carrinho */}
                      <TouchableOpacity
                        onPress={addToCart}
                        disabled={!selectedProdutoId}
                        style={[
                          styles.addToCartButton,
                          !selectedProdutoId && styles.addToCartButtonDisabled,
                        ]}
                      >
                        <Ionicons name="add-circle" size={18} color="#fff" />
                        <Text style={styles.addToCartButtonText}>
                          Adicionar ao Carrinho
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Carrinho */}
              {cart.length > 0 && (
                <View style={styles.cartContainer}>
                  <Text style={styles.cartTitle}>Itens ({cart.length})</Text>
                  {cart.map((item, index) => (
                    <View key={index} style={styles.cartItem}>
                      <View style={styles.cartItemInfo}>
                        <View style={styles.cartItemNameContainer}>
                          <Text style={styles.cartItemName} numberOfLines={1}>
                            {item.produto?.nome || `Produto ${item.id_produto}`}
                          </Text>
                          <View
                            style={[
                              styles.stockBadge,
                              item.produto &&
                              item.quantidade > getAvailableStock(item)
                                ? styles.stockBadgeWarning
                                : styles.stockBadgeOk,
                            ]}
                          >
                            <Text style={styles.stockBadgeText}>
                              Estoque: {getAvailableStock(item)}
                            </Text>
                          </View>
                        </View>
                      <View style={styles.cartItemDetails}>
                        <Text style={styles.cartItemPrice}>
                          {formatCurrency(item.valor_unitario)}
                        </Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            onPress={() => {
                              const newQtd = Math.round(item.quantidade) - 1;
                              if (newQtd > 0) {
                                updateCartQuantity(index, newQtd.toString());
                              }
                            }}
                            style={styles.quantityButton}
                          >
                            <Ionicons name="remove" size={16} color="#e91e63" />
                          </TouchableOpacity>
                          <Text style={styles.quantityDisplay}>
                            {Math.round(item.quantidade)}
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newQtd = Math.round(item.quantidade) + 1;
                              
                              // Garantir que o produto está carregado
                              let itemComProduto = { ...item };
                              if (!itemComProduto.produto) {
                                const produtoEncontrado = produtos.find(
                                  (p) => p.id_produto === item.id_produto
                                );
                                if (produtoEncontrado) {
                                  itemComProduto.produto = produtoEncontrado;
                                }
                              }
                              
                              const availableStock = getAvailableStock(itemComProduto);
                              
                              // Validar estoque antes de incrementar
                              if (newQtd > availableStock) {
                                Alert.alert(
                                  "Estoque Insuficiente",
                                  `O produto "${itemComProduto.produto?.nome || 'desconhecido'}" possui apenas ${availableStock} unidade(s) disponível(is).`
                                );
                                return;
                              }
                              
                              updateCartQuantity(index, newQtd.toString());
                            }}
                            style={styles.quantityButton}
                          >
                            <Ionicons name="add" size={16} color="#e91e63" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.cartItemSubtotal}>
                          {formatCurrency(
                            item.quantidade * item.valor_unitario
                          )}
                        </Text>
                      </View>
                    </View>
                      <TouchableOpacity
                        onPress={() => removeFromCart(index)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="trash" size={18} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Total */}
                  <View style={styles.cartTotal}>
                    <Text style={styles.cartTotalLabel}>Total</Text>
                    <Text style={styles.cartTotalValue}>
                      {formatCurrency(getTotalValue())}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer com botões */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={loading || cart.length === 0}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[...Colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveGradient, (loading || cart.length === 0) && { opacity: 0.6 }]}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? "Salvando..." : "Salvar"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    maxHeight: "95%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  dateButtonText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: FontWeight.medium,
  },
  datePickerContainer: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  datePickerClose: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  datePickerCloseText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  addProductButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  produtoSelector: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 40,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
  },
  produtoOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  produtoOptionSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primaryLight,
  },
  produtoOptionContent: {
    flex: 1,
  },
  produtoOptionName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  produtoOptionNameDisabled: {
    color: Colors.textTertiary,
  },
  produtoOptionSubInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  produtoOptionPrice: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  produtoOptionStock: {
    fontSize: FontSize.xs,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  produtoOptionStockEmpty: {
    color: Colors.danger,
  },
  produtoOptionDisabled: {
    backgroundColor: Colors.background,
    opacity: 0.6,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  addToCartButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  addToCartButtonText: {
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    fontSize: FontSize.md,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
  cartContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cartTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  cartItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  cartItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cartItemPrice: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    minWidth: 50,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  quantityButton: {
    padding: Spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityDisplay: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    minWidth: 30,
    textAlign: "center",
  },
  cartItemSubtotal: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    minWidth: 60,
    textAlign: "right",
  },
  cartItemNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  stockBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  stockBadgeOk: {
    backgroundColor: Colors.successSoft,
  },
  stockBadgeWarning: {
    backgroundColor: Colors.dangerSoft,
  },
  stockBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  cartTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  cartTotalLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  cartTotalValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  saveGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
});
