// frontend/src/App.tsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddBook from "./pages/AddBook";
import { CssBaseline, Container } from "@mui/material";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <CssBaseline />
          <Navbar />
          <Container component="main" sx={{ mt: 4 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<PrivateRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/add-book" element={<AddBook />} />
              </Route>
            </Routes>
          </Container>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
