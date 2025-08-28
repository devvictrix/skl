// frontend/src/components/Navbar.tsx

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, user, logout, isAdminOrLibrarian } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Book Library
          </Link>
        </Typography>

        <Box>
          {isAuthenticated ? (
            <>
              {isAdminOrLibrarian && (
                <Button color="inherit" component={Link} to="/add-book">
                  Add Book
                </Button>
              )}
              <Button color="inherit" onClick={handleLogout}>
                Logout ({user?.username})
              </Button>
            </>
          ) : (
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
