// grouped error handling
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

// inline error handling
export function setFormApiErrors(error, setError) {
  if (error?.name === 'ApiError' && error.status === 400) {
    const fieldErrors = error.unwrapFieldErrors();
    const fieldKeys = Object.keys(fieldErrors);

    if (fieldKeys.length > 0) {
      fieldKeys.forEach((field) => {
        const message = fieldErrors[field];
        setError(field, {
          type: "server",
          message: Array.isArray(message) ? message[0] : message,
        });
      });
      return;
    }
  }

  setError("root.serverError", {
    type: "server",
    message: "An unexpected error occurred. Please try again.",
  });
}