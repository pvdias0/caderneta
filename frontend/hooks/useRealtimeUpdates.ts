import { useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext";

type UpdateCallback =
  | ((clienteId: number, novoSaldo: number) => void)
  | (() => void);

/**
 * Hook para escutar atualizações em tempo real via WebSocket (Socket.io)
 * Dispara callback quando houver mudanças nos dados do usuário
 */
export const useRealtimeUpdates = (
  usuarioId: number | null,
  onUpdate?: UpdateCallback,
) => {
  const { socket, isConnected } = useSocket();

  // Memoizar o callback para evitar re-registrar listeners desnecessariamente
  const memoizedOnUpdate = useCallback(onUpdate || (() => {}), [onUpdate]);

  useEffect(() => {
    if (!socket || !isConnected || !usuarioId) {
      if (!socket) console.warn("⚠️ Socket não inicializado");
      if (!isConnected) console.warn("⚠️ Socket não conectado");
      if (!usuarioId) console.warn("⚠️ usuarioId não definido");
      return;
    }

    console.log(`🔌 Configurando Socket.io para usuário: ${usuarioId}`);

    // Entrar na sala específica do usuário
    socket.emit("entrar-sala-usuario", usuarioId);
    console.log(`👤 Entrando na sala: usuario-${usuarioId}`);

    // Escutar atualizações de saldo de cliente específico
    const handleSaldoAtualizado = (data: {
      cliente_id: number;
      saldo_devedor: number;
      timestamp: string;
    }) => {
      console.log("💰 [Socket.io] Saldo atualizado em tempo real:", data);
      console.log(
        `   Cliente: ${data.cliente_id}, Novo saldo: R$ ${data.saldo_devedor}`,
      );

      // Se callback aceita parâmetros, chamar com clienteId
      if (memoizedOnUpdate && typeof memoizedOnUpdate === "function") {
        const fnLength = memoizedOnUpdate.length;
        if (fnLength > 0) {
          (memoizedOnUpdate as (clienteId: number, novoSaldo: number) => void)(
            data.cliente_id,
            data.saldo_devedor,
          );
        } else {
          // Sem parâmetros, forçar reload geral
          (memoizedOnUpdate as () => void)();
        }
      }
    };

    // Escutar atualizações de total a receber (afeta dashboard)
    const handleTotalAtualizado = (novoTotal: number) => {
      console.log(
        "📊 [Socket.io] Total a receber atualizado em tempo real:",
        novoTotal,
      );
      console.log(`   Novo total: R$ ${novoTotal}`);

      // Sempre forçar atualização do dashboard quando total muda
      if (memoizedOnUpdate) {
        console.log("📡 Acionando callback de atualização...");
        (memoizedOnUpdate as () => void)();
      }
    };

    // Registrar listeners
    socket.on("saldo-cliente-atualizado", handleSaldoAtualizado);
    socket.on("total-atualizado", handleTotalAtualizado);

    console.log("✅ Listeners registrados com sucesso");

    // Cleanup: remover listeners ao desmontar
    return () => {
      console.log(`🧹 Removendo listeners Socket.io para usuário ${usuarioId}`);
      socket.off("saldo-cliente-atualizado", handleSaldoAtualizado);
      socket.off("total-atualizado", handleTotalAtualizado);
    };
  }, [socket, isConnected, usuarioId, memoizedOnUpdate]);

  return {
    isConnected,
    socket,
  };
};
