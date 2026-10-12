import useSWR from 'swr';
import { AuthContext } from "@/hooks/useAuth";
import { apiClient } from "@/config/api";
import { useEffect } from 'react';
import { socket } from '@/config/socket';

export default function AuthProvider({ children }) {
  const {
    data: user,
    error: authError,
    isLoading: isLoadingAuth,
    mutate: mutateUser,
  } = useSWR(
    '/auth/me',
    async (url) => {
      const response = await apiClient(url);
      return response.data.user;
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  const login = async (newUser) => {
    await mutateUser(
      newUser,
      { revalidate: false }
    );
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { 
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error on backend:", error.message);
    } finally {
      await mutateUser(
        null,
        { revalidate: false }
      );
    }
  };

  // Remove if not using sockets
  // Only connect socket once user has authenticated
  useEffect(() => {
    if (user) {
      // Connect socket once user is confirmed authenticated
      socket.connect();

      socket.on('connect', () => {
        // console.log('Socket connected with ID:', socket.id);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });
    } else {
      // Disconnect if user logs out or session is null
      if (socket.connected) {
        socket.disconnect();
      }
    }
    
    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [user]);

  return (
    <AuthContext.Provider 
      value={{
        user: authError ? null : user,
        isLoadingAuth,
        mutateUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};