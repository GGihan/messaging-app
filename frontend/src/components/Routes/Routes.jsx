import App from "@/App";
import ErrorPage from "../ErrorPage/Errorpage";
import Home from "../Home/Home";
import Register from "../Register/Register";
import Login from "../Login/Login";
import ProtectedLayout from "../layout/ProtectedLayout/ProtectedLayout";
import PublicLayout from "../layout/PublicLayout/PublicLayout";

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
            index: true,
            element: <Home />,
          },
          // {
          //   path: 'levels/:imageId/game',
          //   element: <GameArea />,
          // },
        ],
      },
    ]
  },
];

export default routes;