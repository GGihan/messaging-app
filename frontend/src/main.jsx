import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router';
import routes from './components/Routes/Routes';
import AuthProvider from './components/AuthProvider/AuthProivder';
import { Toaster } from 'react-hot-toast';
import { toastConfig } from './config/toastConfig';
import { SocketSubscriptionProvider } from './socket/SocketSubscriptionProvider';

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <SocketSubscriptionProvider>
        <RouterProvider router={router} />
        <Toaster {...toastConfig} />
      </SocketSubscriptionProvider>
    </AuthProvider>
  </StrictMode>
);