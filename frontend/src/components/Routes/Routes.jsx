import App from "@/App";
import ErrorPage from "../ErrorPage/Errorpage";
import Register from "../Register/Register";
import Login from "../Login/Login";
import ProtectedLayout from "../layout/ProtectedLayout/ProtectedLayout";
import PublicLayout from "../layout/PublicLayout/PublicLayout";
import ChatsList from "../ChatsList/ChatsList";
import ChatsLayout from "../layout/ChatsLayout/ChatsLayout";
import NewChat from "../NewChat/NewChat";

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
            element: <ChatsLayout />,
            children: [
              { index: true, element: <ChatsList /> },
              {
                path: "new",
                element: <NewChat />,
                handle: { hideMobileNav: true },
              },
            ],
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