import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/singup";
import Login from "./pages/login";
import Resell from "./pages/Resell";
import ProductDetail from "./pages/ProductDetail";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Resell />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:otherUserId/:productId" element={<Chat />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;