import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import NavigationLoader from './components/NavigationLoader';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BarangaySummary from './pages/BarangaySummary';
import ExportData from './pages/ExportData';
import ImportData from './pages/ImportData';
import EncodeRecord from './pages/EncodeRecord';
import HouseholdList from './pages/HouseholdList';
import ViewHousehold from './pages/ViewHousehold';
import './App.css';

function App() {
  return (
    <Router>
      <NavigationLoader />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="barangay-summary" element={<BarangaySummary />} />
            <Route path="export-data" element={<ExportData />} />
            <Route path="import-data" element={<ImportData />} />
            <Route path="encode-record" element={<EncodeRecord />} />
            <Route path="encode-record/:id" element={<EncodeRecord />} />
            <Route path="household-records" element={<HouseholdList />} />
            <Route path="household-records/:id" element={<ViewHousehold />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
