export const toastConfig = {
  position: 'top-center',
  toastOptions: {
    style: {
      background: '#333',
      color: '#fff',
      fontSize: '14px',
      borderRadius: '8px',
      fontFamily: 'var(--font-ui)',
    },
    error: {
      duration: 4000,
      style: {
        background: '#2d1515',
        color: '#ff6b6b',
        border: '1px solid #5c2424',
      },
    },
    success: {
      duration: 3000,
      style: {
        background: '#142a1e',
        color: '#4ade80',
        border: '1px solid #1e4a30',
      },
    },
  },
};