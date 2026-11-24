import { createBrowserRouter, RouterProvider, useParams } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import DesignsPage from "./pages/DesignsPage.jsx";
import EditorPage from "./pages/EditorPage.jsx";

function EditorRoute() {
  const { id } = useParams();
  return <EditorPage key={id || "new"} id={id} />;
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DesignsPage /> },
      { path: "/designs/new", element: <EditorRoute /> },
      { path: "/designs/:id", element: <EditorRoute /> },
      { path: "*", element: <DesignsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
