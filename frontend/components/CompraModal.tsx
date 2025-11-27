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
import { Ionicons } from "@expo/vector-icons";
import { IMovimento } from "../types/movimento";
import { IProduto } from "../types/produto";
import { apiService } from "../services/api";

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
  const [quantidade, setQuantidade] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      loadProdutos();
      if (compra) {
        setData(new Date(compra.data_movimento));
        if (compra.itens) {
          setCart(compra.itens);
        }
      } else {
        setData(new Date());
        setCart([]);
      }
      setErrors({});
    }
  }, [visible, compra]);

  const loadProdutos = async () => {
    try {
      setLoadingProdutos(true);
      const data = await apiService.getProdutos();
      setProdutos(data.data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
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

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const addToCart = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedProdutoId) {
      newErrors.produto = "Selecione um produto";
    }

    if (!quantidade.trim()) {
      newErrors.quantidade = "Quantidade é obrigatória";
    } else {
      const qtd = parseFloat(quantidade.replace(",", "."));
      if (qtd <= 0) {
        newErrors.quantidade = "Quantidade deve ser maior que zero";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const produto = produtos.find((p) => p.id_produto === selectedProdutoId);
    if (!produto || selectedProdutoId === null) {
      Alert.alert("Erro", "Produto não encontrado");
      return;
    }

    const qtd = parseFloat(quantidade.replace(",", "."));

    // Verificar se produto já está no carrinho
    const existingIndex = cart.findIndex(
      (i) => i.id_produto === selectedProdutoId
    );
    if (existingIndex >= 0) {
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
    setQuantidade("");
    setShowProdutoSelector(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartQuantity = (index: number, newQtd: string) => {
    const qtd = parseFloat(newQtd.replace(",", "."));
    if (qtd > 0) {
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
              <Text style={styles.dateButtonText}>
                {formatDisplayDate(data)}
              </Text>
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
                        Selecione o Produto
                      </Text>
                      <FlatList
                        data={produtos}
                        scrollEnabled={false}
                        keyExtractor={(item) => item.id_produto.toString()}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            onPress={() =>
                              setSelectedProdutoId(item.id_produto)
                            }
                            style={[
                              styles.produtoOption,
                              selectedProdutoId === item.id_produto &&
                                styles.produtoOptionSelected,
                            ]}
                          >
                            <View style={styles.produtoOptionContent}>
                              <Text
                                style={styles.produtoOptionName}
                                numberOfLines={1}
                              >
                                {item.nome}
                              </Text>
                              <Text style={styles.produtoOptionPrice}>
                                {formatCurrency(item.valor_produto)}
                              </Text>
                            </View>
                            {selectedProdutoId === item.id_produto && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#e91e63"
                              />
                            )}
                          </TouchableOpacity>
                        )}
                      />

                      {/* Quantidade */}
                      <View style={styles.quantityContainer}>
                        <TextInput
                          style={[
                            styles.quantityInput,
                            errors.quantidade && styles.inputError,
                          ]}
                          placeholder="Quantidade"
                          placeholderTextColor="#ccc"
                          value={quantidade}
                          onChangeText={setQuantidade}
                          keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                          onPress={addToCart}
                          disabled={!selectedProdutoId || !quantidade}
                          style={styles.confirmButton}
                        >
                          <Text style={styles.confirmButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                      {errors.quantidade && (
                        <Text style={styles.errorText}>
                          {errors.quantidade}
                        </Text>
                      )}
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
                        <Text style={styles.cartItemName} numberOfLines={1}>
                          {item.produto?.nome || `Produto ${item.id_produto}`}
                        </Text>
                        <View style={styles.cartItemDetails}>
                          <Text style={styles.cartItemPrice}>
                            {formatCurrency(item.valor_unitario)}
                          </Text>
                          <TextInput
                            style={styles.cartItemQuantity}
                            value={item.quantidade.toString()}
                            onChangeText={(text) =>
                              updateCartQuantity(index, text)
                            }
                            keyboardType="decimal-pad"
                            maxLength={6}
                          />
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
              style={[
                styles.button,
                styles.saveButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={loading || cart.length === 0}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : "Salvar"}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: "95%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  addProductButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e91e63",
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  addProductButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  produtoSelector: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  produtoOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  produtoOptionSelected: {
    backgroundColor: "#fff3f7",
    borderColor: "#e91e63",
  },
  produtoOptionContent: {
    flex: 1,
  },
  produtoOptionName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  produtoOptionPrice: {
    fontSize: 12,
    color: "#999",
  },
  quantityContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#f44336",
  },
  confirmButton: {
    backgroundColor: "#e91e63",
    borderRadius: 6,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  cartContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cartTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#ff9800",
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  cartItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cartItemPrice: {
    fontSize: 12,
    color: "#999",
    minWidth: 50,
  },
  cartItemQuantity: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    paddingHorizontal: 6,
    height: 28,
    fontSize: 12,
    color: "#333",
    width: 50,
    textAlign: "center",
  },
  cartItemSubtotal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e91e63",
    minWidth: 60,
    textAlign: "right",
  },
  removeButton: {
    padding: 8,
  },
  cartTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 8,
  },
  cartTotalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  cartTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e91e63",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#e91e63",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
