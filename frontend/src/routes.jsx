import { Route, Routes } from "react-router";
import App from "./App";
import RegistrationPage from "./pages/RegistrationPage/RegistrationPage";
import MakDakPage from "./pages/MakDakPage/MakDakPage";
import OrdersPage from "./pages/OrdersPage/OrdersPage";
import { Layout } from "./components/Layout/Layout";
import DataBase from "./pages/DataBase/DataBase";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/makdak" element={<MakDakPage />} />
      <Route path="registration" element={<RegistrationPage />} />

      <Route
        index
        element={
          <Layout>
            <OrdersPage />
          </Layout>
        }
      />
      <Route
        path="/database"
        element={
          <Layout>
            <DataBase />
          </Layout>
        }
      />
      <Route path="*" element={<div>Страница не найдена</div>} />
    </Routes>
  );
};

export default AppRoutes;
