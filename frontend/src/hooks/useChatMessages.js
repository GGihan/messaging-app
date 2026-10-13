import { apiClient } from '@/config/api';
import useSWRInfinite from 'swr/infinite';

const chatMessagesFetcher = (url) => apiClient(url).then((res) => res.data);

export function useChatMessages(chatId) {
  const getKey = (pageIndex, previousPageData) => {
    if (!chatId) return null;

    // Page 0: Fetch newest 30 messages
    if (pageIndex === 0) {
      return `/chats/${chatId}/messages`;
    }

    const pagination = previousPageData?.pagination;
    if (!pagination?.hasMore || !pagination?.nextCursor) {
      return null;
    }

    // Older pages: send cursor pointing to oldest ID of previous slice
    return `/chats/${chatId}/messages?cursor=${pagination.nextCursor}`;
  };

  const { data, size, setSize, mutate, isValidating, isLoading } = useSWRInfinite(
    getKey,
    chatMessagesFetcher,
    {
      revalidateFirstPage: true,
      revalidateIfStale: true,
      revalidateOnMount: true,
      revalidateOnFocus: false,
    }
  );

  // SWR data array contains: [Page0 (newer), Page1 (older), Page2 (even older)...]
  // Invert the page order so older batches sit in front of newer batches,
  // creating one seamless chronological timeline: [Oldest ... Newest]
  const messages = data
    ? data
        .slice()
        .reverse()
        .flatMap((page) => page?.messages || [])
    : [];

  const latestPage = data ? data[data.length - 1] : null;
  const hasMore = Boolean(latestPage?.pagination?.hasMore);
  const isLoadingMore = isValidating && size > 1;

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setSize((prev) => prev + 1);
    }
  };

  return {
    messages,
    isLoadingMessages: isLoading,
    refetchMessages: mutate,
    isLoadingMore,
    hasMore,
    loadMore,
  };
};