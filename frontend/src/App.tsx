import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Browse from "./pages/Browse"
import AuthCallback from "./pages/AuthCallback"
import ListingDetail from "./pages/ListingDetail"
import Mentorship from "./pages/Mentorship"
import Chat from "./pages/Chat"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen font-sans" style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/mentorship" element={<Mentorship />} />

              {/* Protected routes — require login */}
              <Route path="/browse" element={<Browse />} />

              <Route
                path="/listings/:id"
                element={
                  <ProtectedRoute>
                    <ListingDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/chat/:listingId"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
