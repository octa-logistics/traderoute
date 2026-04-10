import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ItemsPage from "@/pages/ItemsPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import PurchasesPage from "@/pages/PurchasesPage";
import NewPurchasePage from "@/pages/NewPurchasePage";
import PurchaseDetailPage from "@/pages/PurchaseDetailPage";
import SalesPage from "@/pages/SalesPage";
import NewSalePage from "@/pages/NewSalePage";
import SaleDetailPage from "@/pages/SaleDetailPage";
import VendorsPage from "@/pages/VendorsPage";
import CustomersPage from "@/pages/CustomersPage";
import CategoriesPage from "@/pages/CategoriesPage";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="items" element={<ItemsPage />} />
            <Route path="items/:id" element={<ItemDetailPage />} />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="purchases/new" element={<NewPurchasePage />} />
            <Route path="purchases/:id" element={<PurchaseDetailPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales/new" element={<NewSalePage />} />
            <Route path="sales/:id" element={<SaleDetailPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
