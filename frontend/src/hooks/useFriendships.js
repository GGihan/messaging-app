import { apiClient } from "@/config/api";
import useSWR from "swr";

const friendshipsFetcher = ([endpoint, params]) => {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
  }

  const queryString = searchParams.toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;

  return apiClient(url).then((res) => res.data.friendships);
};

export function useFriendships(
  { status, type } = {},
  options = {}
) {

  // Structured key object
  const queryParams = {
    ...(status && { status }),
    ...(type && { type }),
  };

  // Revalidate a specific filter:
  // mutate(["/friendships", { status: "ACCEPTED", type: "incoming" }]);

  // Revalidate EVERY query starting with '/friendships', regardless of status/type
  // mutate((key) => Array.isArray(key) && key[0] === '/friendships');

  const key = ["/friendships", queryParams];

  const {
    data: friendships,
    error: friendshipsError,
    isLoading: isLoadingFriendships,
    isValidating: isValidatingFriendships,
    mutate: refetchFriendships,
  } = useSWR(
    key,
    friendshipsFetcher,
    {
      revalidateOnFocus: false,
      ...options,
    }
  );

  return {
    friendships,
    friendshipsError,
    isLoadingFriendships,
    isValidatingFriendships,
    refetchFriendships,
  };
};