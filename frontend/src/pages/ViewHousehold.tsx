import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import './ViewHousehold.css';

interface HouseholdMember {
  id?: number;
  name: string;
  role: string;
  occupation: number | string | null;
  educational_attainment: string | null;
}

interface Household {
  id: number;
  household_number: string;
  barangay: string;
  purok_sito: string;
  municipality_city: string;
  province: string;
  family_living_in_house: number | null;
  number_of_members: number | null;
  nhts_household_group: string | number | null;
  indigenous_group: string | number | null;
  newborn_male: number | null;
  newborn_female: number | null;
  infant_male: number | null;
  infant_female: number | null;
  under_five_male: number | null;
  under_five_female: number | null;
  children_male: number | null;
  children_female: number | null;
  adolescence_male: number | null;
  adolescence_female: number | null;
  pregnant: number | null;
  adolescent_pregnant: number | null;
  post_partum: number | null;
  women_15_49_not_pregnant: number | null;
  adult_male: number | null;
  adult_female: number | null;
  senior_citizen_male: number | null;
  senior_citizen_female: number | null;
  pwd_male: number | null;
  pwd_female: number | null;
  couple_practicing_family_planning: boolean | null;
  toilet_type: string | number | null;
  water_source: string | number | null;
  food_production_activity: string | null;
  using_iodized_salt: boolean | null;
  using_iron_fortified_rice: boolean | null;
  members: HouseholdMember[];
  related_families?: Household[];
  [key: string]: any;
}

// ── Label maps ────────────────────────────────────────────────────────────
const NHTS_LABEL: Record<string, string> = {
  '1': 'NHTS 4Ps',
  '2': 'NHTS Non-4Ps',
  '3': 'Non-NHTS',
};
const NHTS_COLOR: Record<string, string> = {
  '1': 'badge-green',
  '2': 'badge-blue',
  '3': 'badge-gray',
};
const INDIGENOUS_LABEL: Record<string, string> = {
  '1': 'Indigenous People (IP)',
  '2': 'Non-Indigenous People',
};
const TOILET_LABEL: Record<string, string> = {
  '1': 'Improved sanitation',
  '2': 'Shared facility',
  '3': 'Unimproved',
  '4': 'Open defecation',
};
const WATER_LABEL: Record<string, string> = {
  '1': 'Improved source',
  '2': 'Unimproved source',
};
const FOOD_LABEL: Record<string, string> = {
  VG: 'Vegetable Garden',
  FT: 'Fruit',
  PL: 'Poultry / Livestock',
  FP: 'Fish pond',
  NA: 'None',
};
const OCCUPATION_LABEL: Record<string, string> = {
  '1': 'Manager',
  '2': 'Professional',
  '3': 'Technician & Associate Professionals',
  '4': 'Clerical Support Workers',
  '5': 'Service & Sales Workers',
  '6': 'Skilled Agricultural / Forestry / Fishery',
  '7': 'Craft & Related Trade Workers',
  '8': 'Plant & Machine Operators & Assemblers',
  '9': 'Elementary Occupations',
  '10': 'Armed Forces',
  '11': 'None',
};
const EDUCATION_LABEL: Record<string, string> = {
  N: 'None',
  EU: 'Elementary Undergraduate',
  EG: 'Elementary Graduate',
  HU: 'High School Undergraduate',
  HG: 'High School Graduate',
  CU: 'College Undergraduate',
  CG: 'College Graduate',
  V: 'Vocational',
  PG: 'Post Graduate',
};
const ROLE_COLOR: Record<string, string> = {
  father: 'role-father',
  mother: 'role-mother',
  caregiver: 'role-caregiver',
};

// ── Helpers ───────────────────────────────────────────────────────────────
const resolve = (map: Record<string, string>, val: any): string => {
  if (val === null || val === undefined || val === '') return '—';
  return map[String(val)] ?? String(val);
};
const num = (val: number | null | undefined): string =>
  val === null || val === undefined ? '—' : String(val);

// ── Sub-components ────────────────────────────────────────────────────────
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="vh-field">
    <span className="vh-field-label">{label}</span>
    <span className="vh-field-value">{value ?? '—'}</span>
  </div>
);

const YesNoBadge = ({ value }: { value: boolean | null | undefined }) => {
  if (value === null || value === undefined) return <span className="vh-field-value">—</span>;
  return (
    <span className={`vh-bool-badge ${value ? 'bool-yes' : 'bool-no'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────
const ViewHousehold = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allFamilies, setAllFamilies] = useState<Household[]>([]);
  const [activeFamilyIndex, setActiveFamilyIndex] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.get(`/households/${id}`)
      .then(({ data }) => {
        const related = data.related_families || [];
        const combined = [data, ...related];
        combined.sort((a, b) => {
          const aVal = String(a.family_living_in_house || '');
          const bVal = String(b.family_living_in_house || '');
          return aVal.localeCompare(bVal);
        });
        
        setAllFamilies(combined);
        const idx = combined.findIndex(h => String(h.id) === id);
        setActiveFamilyIndex(idx >= 0 ? idx : 0);
        setHousehold(combined[idx >= 0 ? idx : 0]);
      })
      .catch(() => setError('Household not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="vh-loading">
      <div className="vh-spinner" />
      <p>Loading household profile…</p>
    </div>
  );
  if (error || !household) return (
    <div className="vh-error">
      <p>{error || 'Household not found.'}</p>
      <button className="vh-btn-back" onClick={() => navigate('/household-records')}>Back to list</button>
    </div>
  );

  const h = household;
  const members = h.members || [];

  const ageGroups = [
    { label: 'Newborn', male: h.newborn_male, female: h.newborn_female },
    { label: 'Infant', male: h.infant_male, female: h.infant_female },
    { label: 'Under 5', male: h.under_five_male, female: h.under_five_female },
    { label: 'Children', male: h.children_male, female: h.children_female },
    { label: 'Adolescence', male: h.adolescence_male, female: h.adolescence_female },
    { label: 'Adult', male: h.adult_male, female: h.adult_female },
    { label: 'Senior Citizen', male: h.senior_citizen_male, female: h.senior_citizen_female },
    { label: 'PWD', male: h.pwd_male, female: h.pwd_female },
  ];

  const riskGroups = [
    { label: 'Pregnant', value: h.pregnant },
    { label: 'Adolescent Pregnant', value: h.adolescent_pregnant },
    { label: 'Post Partum', value: h.post_partum },
    { label: 'Women 15–49 (Not Pregnant)', value: h.women_15_49_not_pregnant },
  ];

  const facilities = [
    { label: 'Couple Practicing Family Planning', node: <YesNoBadge value={h.couple_practicing_family_planning} /> },
    { label: 'Toilet Type', node: <span className="vh-facility-value">{resolve(TOILET_LABEL, h.toilet_type)}</span> },
    { label: 'Water Source', node: <span className="vh-facility-value">{resolve(WATER_LABEL, h.water_source)}</span> },
    { label: 'Food Production Activity', node: <span className="vh-facility-value">{resolve(FOOD_LABEL, h.food_production_activity)}</span> },
    { label: 'Using Iodized Salt', node: <YesNoBadge value={h.using_iodized_salt} /> },
    { label: 'Using Iron-Fortified Rice', node: <YesNoBadge value={h.using_iron_fortified_rice} /> },
  ];

  const nhtsKey = String(h.nhts_household_group ?? '');
  const nhtsColorClass = NHTS_COLOR[nhtsKey] ?? 'badge-gray';

  return (
    <div className="view-household">

      {/* ── Hero card ── */}
      <div className="vh-hero">
        <div className="vh-hero-left">
          <div className="vh-hh-number">HH No. {h.household_number}</div>
          <h1 className="vh-hero-title">{h.barangay || '—'}</h1>
          <p className="vh-hero-subtitle">
            {h.purok_sito || '—'}&nbsp;·&nbsp;{h.municipality_city || '—'}, {h.province || '—'}
          </p>
          <div className="vh-hero-badges">
            {nhtsKey && (
              <span className={`vh-badge ${nhtsColorClass}`}>{resolve(NHTS_LABEL, h.nhts_household_group)}</span>
            )}
            {h.indigenous_group && (
              <span className="vh-badge badge-orange">{resolve(INDIGENOUS_LABEL, h.indigenous_group)}</span>
            )}
          </div>
        </div>
        <div className="vh-hero-stats">
          <div className="vh-hero-stat">
            <span className="vh-hero-stat-num">{num(h.number_of_members)}</span>
            <span className="vh-hero-stat-label">Total Members</span>
          </div>
          <div className="vh-hero-stat-divider" />
          <div className="vh-hero-stat">
            <span className="vh-hero-stat-num">{num(h.family_living_in_house)}</span>
            <span className="vh-hero-stat-label">Families in House</span>
          </div>
        </div>
      </div>

      {allFamilies.length > 1 && (
        <div className="vh-family-tabs">
          {allFamilies.map((fam, idx) => (
            <button
              key={fam.id}
              className={`vh-family-tab ${idx === activeFamilyIndex ? 'active' : ''}`}
              onClick={() => {
                setActiveFamilyIndex(idx);
                setHousehold(allFamilies[idx]);
              }}
            >
              Family {fam.family_living_in_house || '—'}
            </button>
          ))}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="vh-actions">
        <button className="vh-btn-edit" onClick={() => navigate(`/encode-record/${h.id}`)}>Edit Household</button>
        <button className="vh-btn-back" onClick={() => navigate('/household-records')}>Back to list</button>
      </div>

      {/* ── Age / Risk Groups ── */}
      <div className="vh-section">
        <div className="vh-section-title">Age / Risk Groups</div>

        <div className="vh-age-table-wrapper">
          <table className="vh-age-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Male</th>
                <th>Female</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ageGroups.map((g) => {
                const total = (g.male ?? 0) + (g.female ?? 0);
                return (
                  <tr key={g.label}>
                    <td className="age-group-name">{g.label}</td>
                    <td className="num-cell male-cell">{num(g.male)}</td>
                    <td className="num-cell female-cell">{num(g.female)}</td>
                    <td className="num-cell total-cell">{total > 0 ? total : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="vh-risk-grid">
          {riskGroups.map((g) => (
            <div className="vh-risk-card" key={g.label}>
              <div className="vh-risk-num">{num(g.value)}</div>
              <div className="vh-risk-label">{g.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Household Facilities ── */}
      <div className="vh-section">
        <div className="vh-section-title">Household Facilities</div>
        <div className="vh-facilities-grid">
          {facilities.map((f) => (
            <div className="vh-facility-card" key={f.label}>
              <span className="vh-facility-label">{f.label}</span>
              {f.node}
            </div>
          ))}
        </div>
      </div>

      {/* ── Family Members ── */}
      {members.length > 0 && (
        <div className="vh-section">
          <div className="vh-section-title">
            Family Members
            <span className="vh-member-count">{members.length}</span>
          </div>
          <div className="vh-members-grid">
            {members.map((m, i) => (
              <div key={m.id ?? i} className={`vh-member-card ${ROLE_COLOR[m.role] ?? ''}`}>
                <div className="vh-member-header">
                  <span className="vh-member-role">
                    {String(m.role).charAt(0).toUpperCase() + String(m.role).slice(1)}
                  </span>
                  <span className="vh-member-name">{m.name || '—'}</span>
                </div>
                <div className="vh-member-body">
                  <Field label="Occupation" value={resolve(OCCUPATION_LABEL, m.occupation)} />
                  <Field label="Educational Attainment" value={resolve(EDUCATION_LABEL, m.educational_attainment)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className="vh-actions vh-actions-bottom">
        <button className="vh-btn-edit" onClick={() => navigate(`/encode-record/${h.id}`)}>Edit Household</button>
        <button className="vh-btn-back" onClick={() => navigate('/household-records')}>Back to list</button>
      </div>
    </div>
  );
};

export default ViewHousehold;
