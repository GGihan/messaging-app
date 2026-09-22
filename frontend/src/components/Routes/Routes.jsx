import App from "@/App";
import ErrorPage from "../ErrorPage/Errorpage";
import Home from "../Home/Home";
import Register from "../Register/Register";
import Login from "../Login/Login";
import ProtectedLayout from "../layout/ProtectedLayout/ProtectedLayout";
import PublicLayout from "../layout/PublicLayout/PublicLayout";
import ChatsList from "../Chats/ChatsList";

const routes = [
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <App />,
        children: [
          {
            path: 'chats',
            element: <ChatsList />,
          },
          // {
          //   path: 'friends',
          //   element: <Friends />,
          // },
          // {
          //   path: 'profile',
          //   element: <Profile />,
          // },
        ],
      },
    ]
  },
];

export default routes;