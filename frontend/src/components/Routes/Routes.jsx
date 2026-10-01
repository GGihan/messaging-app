import App from "@/App";
import ErrorPage from "../ErrorPage/Errorpage";
import Register from "../Register/Register";
import Login from "../Login/Login";
import ProtectedLayout from "../layout/ProtectedLayout/ProtectedLayout";
import PublicLayout from "../layout/PublicLayout/PublicLayout";
import ChatsList from "../ChatsList/ChatsList";
import NewChat from "../NewChat/NewChat";
import FriendsList from "../FriendsList/FriendsList";

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
          {
            path: "chats/new",
            element: <NewChat />,
            handle: { hideMobileNav: true },
          },
          {
            path: 'friends',
            element: <FriendsList />,
          },
          // {
          //   path: 'friends/new',
          //   element: <AddFriend />,
          //   handle: { hideMobileNav: true },
          // },
          // {
          //   path: 'friends/requests',
          //   element: <FriendRequests />,
          //   handle: { hideMobileNav: true },
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