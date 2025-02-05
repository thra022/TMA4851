import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import { LoginPage } from "./pages"

const root = document.getElementById('root')
if (!root) {
  throw new Error('No root element found')
}

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LoginPage />} />
    </Routes>
  </BrowserRouter>
);