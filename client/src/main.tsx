import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from 'react-router'
import { AuthProvider } from "./context/auth/AuthContext"
import './index.css'
import './App.css'
import { LoginPage, MainPage } from "./pages"
import ProtectedRoute from "./components/ProtectedRoute"

const root = document.getElementById('root')
if (!root) {
  throw new Error('No root element found')
}

ReactDOM.createRoot(root).render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<MainPage />} />
        </Route>

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);
