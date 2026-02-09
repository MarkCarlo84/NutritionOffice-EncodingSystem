import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './ViewHousehold.css';

interface HouseholdMember {
  id?: number;
  name: string;
  role: string;
  occupation: number | null;
  educational_attainment: string | null;
}

interface Household {
  id: number;
  household_number: string;
  barangay: string;
  purok_sito: string;
  municipality_city: string;
  province: string;
  family_living_in_house: number;
  number_of_members: number;
  nhts_household_group: string | number | null;
  indigenous_group: string | number | null;
  members: HouseholdMember[];
  [key: string]: any;
}

const ViewHousehold = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.get(`/households/${id}`)
      .then(({ data }) => setHousehold(data))
      .catch(() => setError('Household not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="view-household loading">Loading...</div>;
  if (error || !household) return <div className="view-household error">{error || 'Not found.'}</div>;

  const h = household;
  const members = h.members || [];

  return (
    <div className="view-household">
      <div className="view-header">
        <h1>Household Profile — {h.household_number}</h1>
        <p>{h.barangay || '—'} {h.purok_sito ? ` · ${h.purok_sito}` : ''}</p>
        <div className="view-actions">
          <button type="button" className="btn-edit" onClick={() => navigate(`/encode-record/${h.id}`)}>Edit</button>
          <button type="button" className="btn-back" onClick={() => navigate('/household-records')}>Back to list</button>
        </div>
      </div>

      <section className="view-section">
        <h2>Location</h2>
        <div className="view-grid">
          <div className="view-field"><span className="label">Barangay</span><span>{h.barangay || '—'}</span></div>
          <div className="view-field"><span className="label">Purok/Sitio</span><span>{h.purok_sito || '—'}</span></div>
          <div className="view-field"><span className="label">Municipality/City</span><span>{h.municipality_city || '—'}</span></div>
          <div className="view-field"><span className="label">Province</span><span>{h.province || '—'}</span></div>
        </div>
      </section>

      <section className="view-section">
        <h2>Household Info</h2>
        <div className="view-grid">
          <div className="view-field"><span className="label">HH No.</span><span>{h.household_number}</span></div>
          <div className="view-field"><span className="label">No. of family in house</span><span>{h.family_living_in_house ?? '—'}</span></div>
          <div className="view-field"><span className="label">No. of HH members</span><span>{h.number_of_members ?? '—'}</span></div>
          <div className="view-field"><span className="label">NHTS</span><span>{h.nhts_household_group ?? '—'}</span></div>
          <div className="view-field"><span className="label">Indigenous group</span><span>{h.indigenous_group ?? '—'}</span></div>
        </div>
      </section>

      {members.length > 0 && (
        <section className="view-section">
          <h2>Family Members</h2>
          <div className="view-members">
            {members.map((m, i) => (
              <div key={m.id ?? i} className="view-member-card">
                <strong>{String(m.role).charAt(0).toUpperCase() + String(m.role).slice(1)}</strong>
                <p>{m.name || '—'}</p>
                <p className="muted">Occupation: {m.occupation ?? '—'} · Education: {m.educational_attainment ?? '—'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="view-actions bottom">
        <button type="button" className="btn-edit" onClick={() => navigate(`/encode-record/${h.id}`)}>Edit</button>
        <button type="button" className="btn-back" onClick={() => navigate('/household-records')}>Back to list</button>
      </div>
    </div>
  );
};

export default ViewHousehold;
