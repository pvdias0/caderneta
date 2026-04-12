import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiService } from "../services/api";
import { IRelatorioVendaItem, IRelatorioVendas } from "../types/dashboard";
import { useThemeColors } from "../context/ThemeContext";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  Spacing,
  ThemeColors,
} from "../theme";

const toNumberParam = (value: string | string[] | undefined): number | null => {
  if (Array.isArray(value)) return Number(value[0]);
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toStringParam = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) return value[0] || null;
  return value ?? null;
};

const formatLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const RelatorioVendasScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const mode = params.mode === "day" ? "day" : "month";
  const selectedYear = toNumberParam(params.year);
  const selectedMonth = toNumberParam(params.month);
  const selectedDate = toStringParam(params.date);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDayKey = formatLocalDateKey(now);
  const currentMonthKey = `${currentYear}-${currentMonth}`;

  const [report, setReport] = useState<IRelatorioVendas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [periodYear, setPeriodYear] = useState(selectedYear ?? currentYear);
  const [periodMonth, setPeriodMonth] = useState(selectedMonth ?? currentMonth);
  const [periodDate, setPeriodDate] = useState(selectedDate ?? currentDayKey);
  const latestRequestRef = useRef(0);

  useEffect(() => {
    if (mode === "month") {
      setPeriodYear(selectedYear ?? currentYear);
      setPeriodMonth(selectedMonth ?? currentMonth);
      return;
    }

    setPeriodDate(selectedDate ?? currentDayKey);
  }, [
    currentDayKey,
    currentMonth,
    currentYear,
    mode,
    selectedDate,
    selectedMonth,
    selectedYear,
  ]);

  const loadReport = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    try {
      setLoading(true);
      const data =
        mode === "month"
          ? await apiService.getDashboardSalesReport({
              mode,
              year: periodYear,
              month: periodMonth,
            })
          : await apiService.getDashboardSalesReport({
              mode,
              date: periodDate,
            });

      if (latestRequestRef.current !== requestId) {
        return;
      }

      setReport(data);
    } catch (error) {
      console.error("Erro ao carregar relatorio de vendas:", error);
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [mode, periodDate, periodMonth, periodYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReport();
      setRefreshing(false);
  };

  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);

  const formatDateTime = (value: string): string =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const getCurrentPeriodDate = (): Date =>
    mode === "month"
      ? new Date(periodYear, periodMonth - 1, 1)
      : parseLocalDate(periodDate);

  const periodLabel = useMemo(() => {
    if (mode === "month") {
      return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date(periodYear, periodMonth - 1, 1));
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parseLocalDate(periodDate));
  }, [mode, periodDate, periodMonth, periodYear]);

  const applyPickedPeriod = (date: Date) => {
    if (mode === "month") {
      setPeriodYear(date.getFullYear());
      setPeriodMonth(date.getMonth() + 1);
      return;
    }

    setPeriodDate(formatLocalDateKey(date));
  };

  const openPeriodPicker = () => {
    setPickerValue(getCurrentPeriodDate());
    setShowPeriodPicker(true);
  };

  const closePeriodPicker = () => {
    setShowPeriodPicker(false);
    setPickerValue(getCurrentPeriodDate());
  };

  const handlePeriodChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowPeriodPicker(false);

      if (event.type === "set" && selectedValue) {
        applyPickedPeriod(selectedValue);
      }
      return;
    }

    if (selectedValue) {
      setPickerValue(selectedValue);
    }
  };

  const confirmPeriodPicker = () => {
    applyPickedPeriod(pickerValue);
    setShowPeriodPicker(false);
  };

  const navigatePeriod = (direction: -1 | 1) => {
    if (mode === "month") {
      const next = new Date(Date.UTC(periodYear, periodMonth - 1 + direction, 1));
      setPeriodYear(next.getUTCFullYear());
      setPeriodMonth(next.getUTCMonth() + 1);
      return;
    }

    const base = parseLocalDate(periodDate);
    base.setDate(base.getDate() + direction);
    setPeriodDate(formatLocalDateKey(base));
  };

  const disableNext =
    mode === "month"
      ? `${periodYear}-${periodMonth}` === currentMonthKey
      : periodDate === currentDayKey;

  const showInitialLoader = loading && !report;

  const renderVendaCard = (item: IRelatorioVendaItem) => (
    <View key={item.id_compra} style={styles.saleCard}>
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderText}>
          <Text style={styles.saleClient}>{item.cliente_nome}</Text>
          <Text style={styles.saleDate}>{formatDateTime(item.data_compra)}</Text>
        </View>
        <View style={styles.saleBadge}>
          <Text style={styles.saleBadgeText}>#{item.id_compra}</Text>
        </View>
      </View>

      <View style={styles.saleMetrics}>
        <View style={styles.saleMetric}>
          <Text style={styles.saleMetricLabel}>Valor</Text>
          <Text style={styles.saleMetricValue}>
            {formatCurrency(item.valor_liquido)}
          </Text>
        </View>
        <View style={styles.saleMetric}>
          <Text style={styles.saleMetricLabel}>Desconto</Text>
          <Text style={styles.saleDiscount}>{formatCurrency(item.desconto)}</Text>
        </View>
      </View>

      <Text style={styles.saleGross}>Bruto: {formatCurrency(item.valor_bruto)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primaryDark}
      />

      <LinearGradient
        colors={[...colors.gradientPrimary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconButton}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === "month" ? "Vendas do Mes" : "Vendas do Dia"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.periodSwitcher}>
          <TouchableOpacity
            onPress={() => navigatePeriod(-1)}
            style={styles.switchButton}
          >
            <Ionicons name="chevron-back" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.periodLabelButton}
            onPress={openPeriodPicker}
            activeOpacity={0.85}
          >
            <Text style={styles.periodLabel}>
              {periodLabel}
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="calendar-outline" size={16} color="#fff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigatePeriod(1)}
            style={[
              styles.switchButton,
              disableNext && styles.switchButtonDisabled,
            ]}
            disabled={disableNext}
          >
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {showPeriodPicker && (
          <View style={styles.periodPickerCard}>
            <Text style={styles.periodPickerTitle}>
              {mode === "month" ? "Escolher mes" : "Escolher dia"}
            </Text>
            <Text style={styles.periodPickerHint}>
              {mode === "month"
                ? "Selecione qualquer dia dentro do mes desejado."
                : "Selecione a data desejada para ver as vendas do dia."}
            </Text>
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handlePeriodChange}
              textColor={colors.textInverse}
              maximumDate={new Date()}
            />
            {Platform.OS === "ios" && (
              <View style={styles.periodPickerActions}>
                <TouchableOpacity
                  style={styles.periodPickerSecondaryButton}
                  onPress={closePeriodPicker}
                >
                  <Text style={styles.periodPickerSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.periodPickerPrimaryButton}
                  onPress={confirmPeriodPicker}
                >
                  <Text style={styles.periodPickerPrimaryText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {showInitialLoader ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {report && (
            <>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Vendido</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(report.resumo.totalVendas)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Descontos</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(report.resumo.totalDescontos)}
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Quantidade</Text>
                  <Text style={styles.summaryValue}>
                    {report.resumo.quantidadeVendas}
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Vendas</Text>
              {report.vendas.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons
                    name="receipt-outline"
                    size={42}
                    color={colors.textTertiary}
                  />
                  <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
                  <Text style={styles.emptyText}>
                    Nao ha vendas registradas neste periodo.
                  </Text>
                </View>
              ) : (
                <View style={styles.salesList}>
                  {report.vendas.map(renderVendaCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 60 : 48,
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      borderBottomLeftRadius: BorderRadius.xxl,
      borderBottomRightRadius: BorderRadius.xxl,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.lg,
    },
    headerTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
    },
    headerSpacer: {
      width: 40,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    periodSwitcher: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    switchButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    switchButtonDisabled: {
      opacity: 0.35,
    },
    periodLabelButton: {
      flex: 1,
      minHeight: 44,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.18)",
    },
    periodLabel: {
      flexShrink: 1,
      textAlign: "center",
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: colors.textInverse,
      textTransform: "capitalize",
    },
    periodPickerCard: {
      marginTop: Spacing.lg,
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    periodPickerTitle: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
      marginBottom: Spacing.xs,
    },
    periodPickerHint: {
      fontSize: FontSize.sm,
      color: "rgba(255,255,255,0.82)",
      marginBottom: Spacing.sm,
    },
    periodPickerActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    periodPickerSecondaryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: "rgba(255,255,255,0.14)",
    },
    periodPickerSecondaryText: {
      color: colors.textInverse,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
    },
    periodPickerPrimaryButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.textInverse,
    },
    periodPickerPrimaryText: {
      color: colors.primaryDark,
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
    },
    centerBox: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      padding: Spacing.xl,
      paddingBottom: 40,
      gap: Spacing.lg,
    },
    summaryGrid: {
      gap: Spacing.md,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    summaryLabel: {
      fontSize: FontSize.xs,
      textTransform: "uppercase",
      color: colors.textTertiary,
      marginBottom: Spacing.xs,
      fontWeight: FontWeight.medium,
    },
    summaryValue: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    salesList: {
      gap: Spacing.md,
    },
    saleCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    saleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    saleHeaderText: {
      flex: 1,
    },
    saleClient: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.text,
      marginBottom: 4,
    },
    saleDate: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
    },
    saleBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    saleBadgeText: {
      fontSize: FontSize.xs,
      color: colors.primary,
      fontWeight: FontWeight.semibold,
    },
    saleMetrics: {
      flexDirection: "row",
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    saleMetric: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    saleMetricLabel: {
      fontSize: FontSize.xs,
      color: colors.textTertiary,
      marginBottom: 4,
    },
    saleMetricValue: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.success,
    },
    saleDiscount: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.warning,
    },
    saleGross: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    emptyBox: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: "center",
      ...Shadows.sm,
    },
    emptyTitle: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.xs,
    },
    emptyText: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
      textAlign: "center",
    },
  });

export default RelatorioVendasScreen;
