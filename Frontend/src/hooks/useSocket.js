import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const useSocket = (options = { withCredentials: false }, serverUrl = "ws://localhost:4000/") => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Evitamos que 'options' rompa las dependencias convirtiéndolo a string de forma segura
  const optionsString = JSON.stringify(options);

  useEffect(() => {
    // 1. Convertimos el string de vuelta a objeto para usarlo en la conexión
    const parsedOptions = JSON.parse(optionsString);
    const socketIo = io(serverUrl, parsedOptions);

    socketIo.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket conectado.');
    });

    socketIo.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket desconectado');
    });

    // 2. Guardamos el socket en el estado
    setSocket(socketIo);

    // 3. Limpieza de eventos y conexión
    return () => {
      socketIo.off('connect');
      socketIo.off('disconnect');
      socketIo.disconnect();
    };
    // Pasamos optionsString en lugar del objeto directo para que no use referencias infinitas
  }, [serverUrl, optionsString]); 

  return { socket, isConnected };
};

export { useSocket };
