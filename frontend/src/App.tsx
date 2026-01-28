import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BarangaySummary from './pages/BarangaySummary';
import ExportData from './pages/ExportData';
import ImportData from './pages/ImportData';
import EncodeRecord from './pages/EncodeRecord';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/barangay-summary" element={<BarangaySummary />} />
          <Route path="/export-data" element={<ExportData />} />
          <Route path="/import-data" element={<ImportData />} />
          <Route path="/encode-record" element={<EncodeRecord />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
