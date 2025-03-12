import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from 'react-router'
import { AuthProvider } from "./context/auth/AuthContext"
import './index.css'
import './App.css'
import { LoginPage, MainPage, ValidateSignaturePage } from "./pages"
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
        <Route path="/validate-signature" element={<ValidateSignaturePage />} />

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
