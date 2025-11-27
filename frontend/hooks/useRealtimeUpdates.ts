import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

type UpdateCallback =
  | ((clienteId: number, novoSaldo: number) => void)
  | (() => void);

/**
 * Hook para escutar atualizações em tempo real via WebSocket (Socket.io)
 */
export const useRealtimeUpdates = (
  usuarioId: number | null,
  onUpdate?: UpdateCallback
) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected || !usuarioId) return;

    // Entrar na sala do usuário
    socket.emit("entrar-sala-usuario", usuarioId);
    console.log(`👤 Entrando na sala: usuario-${usuarioId}`);

    // Escutar atualizações de saldo de cliente específico
    const handleSaldoAtualizado = (data: {
      cliente_id: number;
      saldo_devedor: number;
      timestamp: string;
    }) => {
      console.log("💰 Saldo atualizado em tempo real:", data);
      if (onUpdate && onUpdate.length > 0) {
        (onUpdate as (clienteId: number, novoSaldo: number) => void)(
          data.cliente_id,
          data.saldo_devedor
        );
      } else if (onUpdate) {
        (onUpdate as () => void)();
      }
    };

    // Escutar atualizações de total a receber
    const handleTotalAtualizado = (novoTotal: number) => {
      console.log("📊 Total a receber atualizado em tempo real:", novoTotal);
      if (onUpdate) {
        (onUpdate as () => void)(); // Chamar sem parâmetros para forçar reload do dashboard
      }
    };

    socket.on("saldo-cliente-atualizado", handleSaldoAtualizado);
    socket.on("total-atualizado", handleTotalAtualizado);

    return () => {
      socket.off("saldo-cliente-atualizado", handleSaldoAtualizado);
      socket.off("total-atualizado", handleTotalAtualizado);
    };
  }, [socket, isConnected, usuarioId, onUpdate]);

  return {
    isConnected,
    socket,
  };
};
