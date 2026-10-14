import useSWR from 'swr';
import { AuthContext } from "@/hooks/useAuth";
import { apiClient } from "@/config/api";
import LoadingSpinner from '../ui/LoadingSpinner/LoadingSpinner';

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
      {isLoadingAuth ? (
        <div className="loading-container">
          <LoadingSpinner size={40} />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};