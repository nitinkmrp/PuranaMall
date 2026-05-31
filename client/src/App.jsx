import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/singup";
import Login from "./pages/login";
import Resell from "./pages/Resell";
import ProductDetail from "./pages/ProductDetail";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Resell />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:otherUserId/:productId" element={<Chat />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;