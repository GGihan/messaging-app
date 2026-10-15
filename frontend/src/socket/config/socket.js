import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const socket = io(BACKEND_URL, {
  // If you use cookie-based auth (httpOnly cookies), this allows cookies to travel with the socket handshake:
  withCredentials: true,
  // By default, autoConnect: true will connect as soon as the app loads.
  // If you only want to connect AFTER the user logs in, set autoConnect: false:
  autoConnect: false,
});