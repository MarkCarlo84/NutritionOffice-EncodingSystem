import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { getBnsOptions, resolveBnsForBarangay } from '../utils/bnsByBarangay';
import { MONTH_OPTIONS } from '../utils/surveySummary';
import DownwardSelect from '../components/DownwardSelect';
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
  'Gulod',
  'Mamatid',
  'Marinig',
  'Niugan',
  'Pittland',
  'Poblacion Dos',
  'Poblacion Tres',
  'Poblacion Uno',
  'Pulo',
  'Sala',
  'San Isidro',
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
  newborn_male?: number;
  newborn_female?: number;
  infant_male?: number;
  infant_female?: number;
  under_five_male?: number;
  under_five_female?: number;
  children_male?: number;
  children_female?: number;
  adolescence_male?: number;
  adolescence_female?: number;
  pregnant?: number;
  adolescent_pregnant?: number;
  post_partum?: number;
  women_15_49_not_pregnant?: number;
  adult_male?: number;
  adult_female?: number;
  senior_citizen_male?: number;
  senior_citizen_female?: number;
  pwd_male?: number;
  pwd_female?: number;
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
  const bnsOptions = getBnsOptions(filter.barangay);
  const hasMultipleBns = bnsOptions.length > 1;

  const handleBarangayFilterChange = (barangay: string) => {
    setFilter((f) => ({
      ...f,
      barangay,
      bns: barangay === 'All Barangays' ? '' : resolveBnsForBarangay(barangay, f.bns),
    }));
  };

  const buildParams = (pageNum: number, searchTerm: string, filterValues: FilterValues) => {
    // Show 10 household records per page
    const params: Record<string, string | number> = { page: pageNum, per_page: 10 };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterValues.bns.trim()) params.bns = filterValues.bns.trim();
    if (filterValues.barangay && filterValues.barangay !== 'All Barangays') params.barangay = filterValues.barangay;
    if (filterValues.purok.trim()) params.purok_sito = filterValues.purok.trim();
    if (filterValues.surveyYear.trim()) params.survey_year = filterValues.surveyYear.trim();
    const year = filterValues.surveyYear.trim() ? parseInt(filterValues.surveyYear, 10) : new Date().getFullYear();
    if (filterValues.periodFrom.trim()) {
      const m = filterValues.periodFrom.trim();
      if (/^(0?[1-9]|1[0-2])$/.test(m)) {
        const mm = m.length === 1 ? '0' + m : m;
        params.period_from = `${year}-${mm}-01`;
      }
    }
    if (filterValues.periodTo.trim()) {
      const m = filterValues.periodTo.trim();
      if (/^(0?[1-9]|1[0-2])$/.test(m)) {
        const mm = m.length === 1 ? '0' + m : m;
        const lastDay = new Date(year, parseInt(mm, 10), 0).getDate();
        params.period_to = `${year}-${mm}-${String(lastDay).padStart(2, '0')}`;
      }
    }
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

  const getComputedMembers = (h: Household): number => {
    const totalFromAgeRisk =
      (Number(h.newborn_male) || 0) +
      (Number(h.newborn_female) || 0) +
      (Number(h.infant_male) || 0) +
      (Number(h.infant_female) || 0) +
      (Number(h.under_five_male) || 0) +
      (Number(h.under_five_female) || 0) +
      (Number(h.children_male) || 0) +
      (Number(h.children_female) || 0) +
      (Number(h.adolescence_male) || 0) +
      (Number(h.adolescence_female) || 0) +
      (Number(h.pregnant) || 0) +
      (Number(h.adolescent_pregnant) || 0) +
      (Number(h.post_partum) || 0) +
      (Number(h.women_15_49_not_pregnant) || 0) +
      (Number(h.adult_male) || 0) +
      (Number(h.adult_female) || 0) +
      (Number(h.senior_citizen_male) || 0) +
      (Number(h.senior_citizen_female) || 0) +
      (Number(h.pwd_male) || 0) +
      (Number(h.pwd_female) || 0);

    return totalFromAgeRisk > 0 ? totalFromAgeRisk : (h.number_of_members ?? 0);
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
                  {hasMultipleBns ? (
                    <select
                      id="filter-bns"
                      value={filter.bns}
                      onChange={(e) => setFilter((f) => ({ ...f, bns: e.target.value }))}
                    >
                      {bnsOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="filter-bns"
                      type="text"
                      placeholder="Barangay Nutrition Sch"
                      value={filter.bns}
                      onChange={(e) => setFilter((f) => ({ ...f, bns: e.target.value }))}
                    />
                  )}
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-barangay">Barangay</label>
                  <DownwardSelect
                    id="filter-barangay"
                    value={filter.barangay}
                    onChange={handleBarangayFilterChange}
                    options={BARANGAYS.map((b) => ({ value: b, label: b }))}
                  />
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
                  <label htmlFor="filter-period-from">Survey Period (From)</label>
                  <select
                    id="filter-period-from"
                    value={filter.periodFrom || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, periodFrom: e.target.value }))}
                  >
                    <option value="">—</option>
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="filter-period-to">Survey Period (To)</label>
                  <select
                    id="filter-period-to"
                    value={filter.periodTo || ''}
                    onChange={(e) => setFilter((f) => ({ ...f, periodTo: e.target.value }))}
                  >
                    <option value="">—</option>
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
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
                    <td>{getComputedMembers(h)}</td>
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
