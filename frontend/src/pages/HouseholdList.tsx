import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './HouseholdList.css';

const BARANGAYS = [
  'All Barangays',
  'Baclaran',
  'Banay-Banay',
  'Banlic',
  'Bigaa',
  'Butong',
  'Casile',
  'Diezmo',
  'Pulo',
  'Sala',
  'San Isidro',
  'Poblacion Uno',
  'Poblacion Dos',
  'Poblacion Tres',
];

interface FilterValues {
  bns: string;
  barangay: string;
  purok: string;
  surveyYear: string;
  periodFrom: string;
  periodTo: string;
}

const initialFilter: FilterValues = {
  bns: '',
  barangay: 'All Barangays',
  purok: '',
  surveyYear: '',
  periodFrom: '',
  periodTo: '',
};

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
  const [filter, setFilter] = useState<FilterValues>(initialFilter);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const buildParams = (pageNum: number, searchTerm: string, filterValues: FilterValues) => {
    const params: Record<string, string | number> = { page: pageNum, per_page: 15 };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterValues.bns.trim()) params.bns = filterValues.bns.trim();
    if (filterValues.barangay && filterValues.barangay !== 'All Barangays') params.barangay = filterValues.barangay;
    if (filterValues.purok.trim()) params.purok_sito = filterValues.purok.trim();
    if (filterValues.surveyYear.trim()) params.survey_year = filterValues.surveyYear.trim();
    if (filterValues.periodFrom.trim()) params.period_from = filterValues.periodFrom.trim();
    if (filterValues.periodTo.trim()) params.period_to = filterValues.periodTo.trim();
    return params;
  };

  const fetchList = async (pageNum: number = 1, searchTerm: string = search, filterValues: FilterValues = filter) => {
    setLoading(true);
    try {
      const params = buildParams(pageNum, searchTerm, filterValues);
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
    fetchList(page, search, filter);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchList(1, search, filter);
  };

  const handleApplyFilter = () => {
    setFilterModalOpen(false);
    setPage(1);
    fetchList(1, search, filter);
  };

  const handleClearFilter = () => {
    setFilter(initialFilter);
    setFilterModalOpen(false);
    setPage(1);
    fetchList(1, search, initialFilter);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/households/${id}`);
      setMessage({ type: 'success', text: 'Household record deleted successfully.' });
      setDeleteConfirm(null);
      fetchList(page, search, filter);
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
        <button type="button" className="btn-filter" onClick={() => setFilterModalOpen(true)}>Filter</button>
        <Link to="/encode-record" className="btn-new">+ New Record</Link>
      </div>

      {filterModalOpen && (
        <div className="filter-modal-overlay" onClick={() => setFilterModalOpen(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h2>Filter Household Records</h2>
              <button type="button" className="filter-modal-close" onClick={() => setFilterModalOpen(false)} aria-label="Close">&times;</button>
            </div>
            <div className="filter-modal-body">
              <div className="filter-row">
                <div className="filter-field">
                  <label htmlFor="filter-bns">BNS</label>
                  <input
                    id="filter-bns"
                    type="text"
                    placeholder="Barangay Nutrition Sch"
                    value={filter.bns}
                    onChange={(e) => setFilter((f) => ({ ...f, bns: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-barangay">Barangay</label>
                  <select
                    id="filter-barangay"
                    value={filter.barangay}
                    onChange={(e) => setFilter((f) => ({ ...f, barangay: e.target.value }))}
                  >
                    {BARANGAYS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-purok">Purok / Block / Street</label>
                  <input
                    id="filter-purok"
                    type="text"
                    placeholder="Optional"
                    value={filter.purok}
                    onChange={(e) => setFilter((f) => ({ ...f, purok: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-survey-year">Survey Year</label>
                  <input
                    id="filter-survey-year"
                    type="text"
                    placeholder="e.g. 2026"
                    value={filter.surveyYear}
                    onChange={(e) => setFilter((f) => ({ ...f, surveyYear: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-period-from">Period From</label>
                  <input
                    id="filter-period-from"
                    type="date"
                    value={filter.periodFrom || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, periodFrom: e.target.value }))}
                  />
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-period-to">Period To</label>
                  <input
                    id="filter-period-to"
                    type="date"
                    value={filter.periodTo || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, periodTo: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="filter-modal-footer">
              <button type="button" className="btn-clear-filter" onClick={handleClearFilter}>Clear</button>
              <button type="button" className="btn-apply-filter" onClick={handleApplyFilter}>Apply Filter</button>
            </div>
          </div>
        </div>
      )}

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
