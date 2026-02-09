import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './HouseholdList.css';

interface Household {
  id: number;
  household_number: string;
  barangay: string;
  purok_sito: string;
  municipality_city: string;
  province: string;
  number_of_members: number;
  members?: { name: string; role: string }[];
}

const HouseholdList = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchList = async (pageNum: number = 1, searchTerm: string = '') => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, per_page: 15 };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const { data } = await api.get('/households', { params });
      setHouseholds(data.data ?? []);
      setLastPage(data.last_page ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      setHouseholds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList(1, search);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/households/${id}`);
      setMessage({ type: 'success', text: 'Household record deleted successfully.' });
      setDeleteConfirm(null);
      fetchList(page, search);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete.' });
    }
  };

  return (
    <div className="household-list-page">
      <div className="list-header">
        <h1>Household Records</h1>
        <p>Search, view, edit, or delete encoded household profiles.</p>
      </div>

      {message && (
        <div className={`message ${message.type}`} onAnimationEnd={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="list-toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by HH No., barangay, name, purok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>
        <Link to="/encode-record" className="btn-new">+ New Record</Link>
      </div>

      <div className="list-table-wrap">
        {loading ? (
          <p className="list-loading">Loading...</p>
        ) : households.length === 0 ? (
          <p className="list-empty">No household records found.</p>
        ) : (
          <>
            <table className="list-table">
              <thead>
                <tr>
                  <th>HH No.</th>
                  <th>Barangay</th>
                  <th>Purok/Sitio</th>
                  <th>Members</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {households.map((h) => (
                  <tr key={h.id}>
                    <td>{h.household_number}</td>
                    <td>{h.barangay || '—'}</td>
                    <td>{h.purok_sito || '—'}</td>
                    <td>{h.number_of_members ?? '—'}</td>
                    <td className="actions-cell">
                      <button type="button" className="btn-view" onClick={() => navigate(`/household-records/${h.id}`)}>View</button>
                      <button type="button" className="btn-edit" onClick={() => navigate(`/encode-record/${h.id}`)}>Edit</button>
                      {deleteConfirm === h.id ? (
                        <span className="delete-confirm">
                          <button type="button" className="btn-delete-confirm" onClick={() => handleDelete(h.id)}>Yes, delete</button>
                          <button type="button" className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                        </span>
                      ) : (
                        <button type="button" className="btn-delete" onClick={() => setDeleteConfirm(h.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {lastPage > 1 && (
              <div className="list-pagination">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span>Page {page} of {lastPage} ({total} total)</span>
                <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HouseholdList;
