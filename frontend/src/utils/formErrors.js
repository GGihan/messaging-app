export function handleApiFormErrors(error, setServerErrors) {
  if (error?.name === 'ApiError' && error.status === 400) {
    const fieldErrors = error.unwrapFieldErrors();
    const messages = Object.values(fieldErrors).flat().filter(Boolean);
    
    if (messages.length > 0) {
      setServerErrors(messages);
      return;
    }
  }

  if (error?.name === 'ApiError' || error?.message) {
    const rootMessage = error.message || 'An unexpected error occurred. Please try again.';
    setServerErrors([rootMessage]);
  }
}