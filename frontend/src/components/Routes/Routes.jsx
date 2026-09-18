import App from "@/App";
import ErrorPage from "../ErrorPage/Errorpage";
import Home from "../Home/Home";
import Register from "../Register/Register";
import Login from "../Login/Login";

const routes = [
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
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
  {
    path: '/register',
    element: <Register />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorPage />,
  },
];

export default routes;