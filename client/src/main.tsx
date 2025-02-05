import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) {
  throw new Error('No root element found')
}

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route index element={<App />} />
    </Routes>
  </BrowserRouter>
);