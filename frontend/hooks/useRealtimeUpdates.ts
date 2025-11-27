import { useEffect } from "react";
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
  onUpdate?: UpdateCallback
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !usuarioId) return;

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
      
      // Se callback aceita parâmetros, chamar com clienteId
      if (onUpdate && typeof onUpdate === 'function') {
        const fnLength = onUpdate.length;
        if (fnLength > 0) {
          (onUpdate as (clienteId: number, novoSaldo: number) => void)(
            data.cliente_id,
            data.saldo_devedor
          );
        } else {
          // Sem parâmetros, forçar reload geral
          (onUpdate as () => void)();
        }
      }
    };

    // Escutar atualizações de total a receber (afeta dashboard)
    const handleTotalAtualizado = (novoTotal: number) => {
      console.log("📊 [Socket.io] Total a receber atualizado em tempo real:", novoTotal);
      
      // Sempre forçar atualização do dashboard quando total muda
      if (onUpdate) {
        (onUpdate as () => void)();
      }
    };

    // Registrar listeners
    socket.on("saldo-cliente-atualizado", handleSaldoAtualizado);
    socket.on("total-atualizado", handleTotalAtualizado);

    // Cleanup: remover listeners ao desmontar
    return () => {
      console.log("🧹 Removendo listeners Socket.io");
      socket.off("saldo-cliente-atualizado", handleSaldoAtualizado);
      socket.off("total-atualizado", handleTotalAtualizado);
    };
  }, [socket, isConnected, usuarioId, onUpdate]);

  return {
    isConnected,
    socket,
  };
};
