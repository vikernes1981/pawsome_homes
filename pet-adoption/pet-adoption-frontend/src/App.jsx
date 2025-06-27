import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PetList from './components/PetList';
import AboutUs from './pages/AboutUs';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PetDetails from './components/PetDetails';
import QuizPage from './pages/QuizPage';
// import ForgotPassword from './pages/ForgotPassword';
import ContactUs from './pages/ContactUs';
import FoodRecommendation from './pages/FoodRecommendation';
import AdoptionRequestForm from './components/AdoptionRequestForm';
import AuthProvider from './context/AuthProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminDashboard from './components/AdminDashboard';
import TierheimDetails from './pages/TierheimDetails';
import ChatbotComponent from "./Chatbot/Chatbot";
import SuggestedItems from './components/SuggestedItems';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <Router>
        <Navbar />

        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          hideProgressBar={false} 
          newestOnTop={false} 
          closeOnClick 
          rtl={false} 
          pauseOnFocusLoss 
          draggable 
          pauseOnHover
        />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* <Route path="/ForgotPassword" element={<ForgotPassword />} /> */}
          <Route path="/pets/:id" element={<PetDetails />} />

          {/* Protected Route: Logged-in users only */}
          <Route
            path="/adopt/:id"
            element={
              <ProtectedRoute>
                <AdoptionRequestForm />
              </ProtectedRoute>
            }
          />

          {/* Admin-only Route */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="/tierheim/:placeId" element={<TierheimDetails />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/pet-list" element={<PetList />} />
          <Route path="/food-recommendation" element={<FoodRecommendation />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/suggested-items" element={<SuggestedItems />} />
        </Routes>

        <ChatbotComponent />
      </Router>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
