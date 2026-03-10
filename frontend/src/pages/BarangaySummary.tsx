import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { getBnsOptions, resolveBnsForBarangay } from '../utils/bnsByBarangay';
import { MONTH_OPTIONS, monthLabel } from '../utils/surveySummary';
import DownwardSelect from '../components/DownwardSelect';
import AbbreviationGuideModal from '../components/AbbreviationGuideModal';
import './BarangaySummary.css';

const BARANGAYS = [
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

const BARANGAY_DISPLAY: Record<string, string> = {
  'Poblacion Uno': 'Pob. Uno',
  'Poblacion Dos': 'Pob. Dos',
  'Poblacion Tres': 'Pob. Tres',
};



interface SurveySummary {
  basic: { bns: string; barangay: string; purokBlockStreet: string; surveyPeriod: string; surveyYear: string };
  totals: { households: number; families: number; purokBlockStreet: number; population: number };
  familySize: { moreThan10: number; n8to10: number; n6to7: number; n2to5: number; n1: number };
  ageHealth: Record<string, number>;
  fatherOcc: number[];
  fatherEd: number[];
  motherOcc: number[];
  motherEd: number[];
  caregiverOcc: number[];
  caregiverEd: number[];
  practices: Record<string, number>;
}

const emptySummary = (): SurveySummary => ({
  basic: { bns: '', barangay: '', purokBlockStreet: '', surveyPeriod: '', surveyYear: new Date().getFullYear().toString() },
  totals: { households: 0, families: 0, purokBlockStreet: 0, population: 0 },
  familySize: { moreThan10: 0, n8to10: 0, n6to7: 0, n2to5: 0, n1: 0 },
  ageHealth: {
    newborn: 0, infants: 0, underFive: 0, children5_9: 0, adolescence: 0, adult: 0,
    pregnant: 0, adolescentPregnant: 0, postPartum: 0, women15_49: 0, seniorCitizens: 0, pwd: 0,
  },
  fatherOcc: Array(11).fill(0),
  fatherEd: Array(9).fill(0),
  motherOcc: Array(11).fill(0),
  motherEd: Array(9).fill(0),
  caregiverOcc: Array(11).fill(0),
  caregiverEd: Array(9).fill(0),
  practices: {
    coupleFP: 0, toiletImproved: 0, toiletShared: 0, toiletUnimproved: 0, toiletOpen: 0,
    waterImproved: 0, waterUnimproved: 0, foodVG: 0, foodFruit: 0, foodPL: 0, foodFP: 0, foodNone: 0,
    iodizedSalt: 0, ironFortifiedRice: 0,
  },
});

// Aggregation and filtering is now handled natively by the backend via /api/households/barangay-summary

const BarangaySummary = () => {
  const [filters, setFilters] = useState({
    barangayNutritionScholar: '',
    barangay: '',
    purokBlockStreet: '',
    surveyYear: '',
    surveyPeriodFrom: '',
    surveyPeriodTo: '',
  });
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAbbreviations, setShowAbbreviations] = useState(false);
  
  const [purokOptionsRaw, setPurokOptionsRaw] = useState<Record<string, string[]>>({});
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  
  const bnsOptions = getBnsOptions(filters.barangay);
  const hasMultipleBns = bnsOptions.length > 1;

  const handleBarangayFilterChange = (barangay: string) => {
    setFilters((f) => ({
      ...f,
      barangay,
      barangayNutritionScholar: resolveBnsForBarangay(barangay, f.barangayNutritionScholar),
      purokBlockStreet: '',
    }));
  };

  const purokOptionsByBarangay = useMemo(() => {
    const empty = { value: '', label: 'All' };
    if (!filters.barangay) return [empty];
    const puroks = purokOptionsRaw[filters.barangay] || [];
    return [empty, ...puroks.map((p) => ({ value: p, label: p }))];
  }, [purokOptionsRaw, filters.barangay]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await api.get('/households/options');
        setYearOptions(res.data.years || [new Date().getFullYear().toString()]);
        setPurokOptionsRaw(res.data.puroks || {});
      } catch (e) {
        console.error(e);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await api.post('/households/barangay-summary', filters);
        const s = res.data as SurveySummary;
        
        // Assemble basic local info dynamically
        s.basic = {
          bns: filters.barangayNutritionScholar || '—',
          barangay: filters.barangay ? (BARANGAY_DISPLAY[filters.barangay] || filters.barangay) : 'All Barangays',
          purokBlockStreet: filters.purokBlockStreet || '—',
          surveyPeriod: '—',
          surveyYear: filters.surveyYear || new Date().getFullYear().toString(),
        };
        
        if (filters.surveyPeriodFrom && filters.surveyPeriodTo) {
          s.basic.surveyPeriod = `${monthLabel(filters.surveyPeriodFrom)} - ${monthLabel(filters.surveyPeriodTo)}`;
        } else if (filters.surveyPeriodFrom) {
          s.basic.surveyPeriod = `From ${monthLabel(filters.surveyPeriodFrom)}`;
        } else if (filters.surveyPeriodTo) {
          s.basic.surveyPeriod = `To ${monthLabel(filters.surveyPeriodTo)}`;
        } else {
          s.basic.surveyPeriod = filters.surveyYear ? filters.surveyYear : '—';
        }
        
        setSummary(s);
      } catch (e) {
        console.error(e);
        setSummary(emptySummary());
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [filters]);

  if (loading) return <div className="barangay-summary loading">Loading Family Profile Survey Summary...</div>;

  const s = summary || emptySummary();
  const occLabels = ['Manager', 'Professional', 'Technician & Associate Professional', 'Clerical Support Workers', 'Service & Sales Workers', 'Skilled Agri, Forestry & Fishery', 'Craft & Related Workers', 'Plant & Machine Operators', 'Elementary Occupations', 'Armed Forces', 'None'];
  const edLabels = ['None', 'Elementary Undergraduate', 'Elementary Graduate', 'HighSchool Undergraduate', 'HighSchool Graduate', 'College Undergraduate', 'College Graduate', 'Vocational', 'Post Graduate'];

  const currentYear = new Date().getFullYear().toString();
  const safeYearOptions = yearOptions.length > 0 ? yearOptions : [currentYear];

  return (
    <div className="barangay-summary">
      <div className="summary-header">
        <div className="summary-title-row">
          <h1>FAMILY PROFILE Survey Summary {new Date().getFullYear()}</h1>
          <button
            type="button"
            className="abbr-info-btn"
            onClick={() => setShowAbbreviations(true)}
            aria-label="Show abbreviation guide"
            title="Show abbreviation guide"
          >
            i
          </button>
        </div>
        <p>Republika ng Pilipinas | Lalawigan ng Laguna | Pamahalaang Lungsod ng CABUYAO | TANGGAPANG PANGLUNSOD NG NUTRISYON</p>
        <p className="summary-data-source">
          All summary records are based on data encoded or imported in the system. Totals, family size distribution, age/health counts, occupation and education summaries, and household practices are generated from household records saved via Encode Record or Import Data.
        </p>

        <div className="summary-filters">
          <h3>Filters</h3>
          <div className="filters-grid">
            <div className="filter-field">
              <label>Barangay Nutrition Scholar</label>
              {hasMultipleBns ? (
                <select
                  value={filters.barangayNutritionScholar}
                  onChange={(e) => setFilters((f) => ({ ...f, barangayNutritionScholar: e.target.value }))}
                >
                  {bnsOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters.barangayNutritionScholar}
                  onChange={(e) => setFilters((f) => ({ ...f, barangayNutritionScholar: e.target.value }))}
                  placeholder="Enter BNS name"
                />
              )}
            </div>
            <div className="filter-field">
              <label>Barangay</label>
              <DownwardSelect
                value={filters.barangay}
                onChange={handleBarangayFilterChange}
                options={[
                  { value: '', label: 'All Barangays' },
                  ...BARANGAYS.map((b) => ({ value: b, label: BARANGAY_DISPLAY[b] || b })),
                ]}
              />
            </div>
            <div className="filter-field">
              <label>Purok / Block / Street</label>
              <DownwardSelect
                value={filters.purokBlockStreet}
                options={purokOptionsByBarangay}
                placeholder="All"
                onChange={(v) => setFilters((f) => ({ ...f, purokBlockStreet: v }))}
              />
            </div>
            <div className="filter-field">
              <label>Survey Year</label>
              <select
                value={filters.surveyYear}
                onChange={(e) => setFilters((f) => ({ ...f, surveyYear: e.target.value }))}
              >
                <option value="">All years</option>
                {safeYearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Survey Period (From)</label>
              <DownwardSelect
                value={filters.surveyPeriodFrom}
                options={[{ value: '', label: '—' }, ...MONTH_OPTIONS]}
                placeholder="—"
                onChange={(v) => setFilters((f) => ({ ...f, surveyPeriodFrom: v }))}
              />
            </div>
            <div className="filter-field">
              <label>Survey Period (To)</label>
              <DownwardSelect
                value={filters.surveyPeriodTo}
                options={[{ value: '', label: '—' }, ...MONTH_OPTIONS]}
                placeholder="—"
                onChange={(v) => setFilters((f) => ({ ...f, surveyPeriodTo: v }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="survey-summary-form">
        <section className="summary-section">
          <h2>Basic Information</h2>
          <div className="summary-grid basic-grid">
            <div className="summary-field"><label>Barangay Nutrition Scholar</label><div className="summary-value">{s.basic.bns || '—'}</div></div>
            <div className="summary-field"><label>Barangay</label><div className="summary-value">{s.basic.barangay || '—'}</div></div>
            <div className="summary-field"><label>Purok / Block / Street</label><div className="summary-value">{s.basic.purokBlockStreet || '—'}</div></div>
            <div className="summary-field"><label>Survey Period</label><div className="summary-value">{s.basic.surveyPeriod || '—'}</div></div>
            <div className="summary-field"><label>Survey Year</label><div className="summary-value">{s.basic.surveyYear || '—'}</div></div>
          </div>
        </section>

        <section className="summary-section">
          <h2>Totals</h2>
          <div className="summary-grid totals-grid">
            <div className="summary-field"><label>Total No. of Household</label><div className="summary-value">{s.totals.households}</div></div>
            <div className="summary-field"><label>Total No. of Families</label><div className="summary-value">{s.totals.families}</div></div>
            <div className="summary-field"><label>Total No. of Purok/Block/Street</label><div className="summary-value">{s.totals.purokBlockStreet}</div></div>
            <div className="summary-field"><label>Total Population</label><div className="summary-value">{s.totals.population}</div></div>
          </div>
        </section>

        <section className="summary-section">
          <h2>Family Size Distribution</h2>
          <div className="summary-grid family-size-grid">
            <div className="summary-field"><label>More than 10</label><div className="summary-value">{s.familySize.moreThan10}</div></div>
            <div className="summary-field"><label>8-10</label><div className="summary-value">{s.familySize.n8to10}</div></div>
            <div className="summary-field"><label>6-7</label><div className="summary-value">{s.familySize.n6to7}</div></div>
            <div className="summary-field"><label>2-5</label><div className="summary-value">{s.familySize.n2to5}</div></div>
            <div className="summary-field"><label>1</label><div className="summary-value">{s.familySize.n1}</div></div>
          </div>
        </section>

        <section className="summary-section">
          <h2>No. of Family Members by Age Classification & Health Risk Group</h2>
          <div className="summary-grid age-health-grid">
            <div className="summary-field"><label>Newborn (0-28 days)</label><div className="summary-value">{s.ageHealth.newborn}</div></div>
            <div className="summary-field"><label>Infants (29 days - 11 months)</label><div className="summary-value">{s.ageHealth.infants}</div></div>
            <div className="summary-field"><label>Under Five (1-4 years old)</label><div className="summary-value">{s.ageHealth.underFive}</div></div>
            <div className="summary-field"><label>Children (5-9 years old)</label><div className="summary-value">{s.ageHealth.children5_9}</div></div>
            <div className="summary-field"><label>Adolescence (10-19 years old)</label><div className="summary-value">{s.ageHealth.adolescence}</div></div>
            <div className="summary-field"><label>Adult (20-59 years old)</label><div className="summary-value">{s.ageHealth.adult}</div></div>
            <div className="summary-field"><label>Pregnant</label><div className="summary-value">{s.ageHealth.pregnant}</div></div>
            <div className="summary-field"><label>Adolescent Pregnant</label><div className="summary-value">{s.ageHealth.adolescentPregnant}</div></div>
            <div className="summary-field"><label>Post-partum</label><div className="summary-value">{s.ageHealth.postPartum}</div></div>
            <div className="summary-field"><label>15-49 y.o. not pregnant & non PP</label><div className="summary-value">{s.ageHealth.women15_49}</div></div>
            <div className="summary-field"><label>Senior Citizens</label><div className="summary-value">{s.ageHealth.seniorCitizens}</div></div>
            <div className="summary-field"><label>PWD</label><div className="summary-value">{s.ageHealth.pwd}</div></div>
          </div>
        </section>

        <section className="summary-section">
          <h2>Father: Occupation</h2>
          <div className="summary-grid occ-grid">
            {occLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.fatherOcc[i] ?? 0}</div></div>
            ))}
          </div>
        </section>
        <section className="summary-section">
          <h2>Father: Educational Attainment</h2>
          <div className="summary-grid ed-grid">
            {edLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.fatherEd[i] ?? 0}</div></div>
            ))}
          </div>
        </section>

        <section className="summary-section">
          <h2>Mother: Occupation</h2>
          <div className="summary-grid occ-grid">
            {occLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.motherOcc[i] ?? 0}</div></div>
            ))}
          </div>
        </section>
        <section className="summary-section">
          <h2>Mother: Educational Attainment</h2>
          <div className="summary-grid ed-grid">
            {edLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.motherEd[i] ?? 0}</div></div>
            ))}
          </div>
        </section>

        <section className="summary-section">
          <h2>Caregiver: Occupation</h2>
          <div className="summary-grid occ-grid">
            {occLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.caregiverOcc[i] ?? 0}</div></div>
            ))}
          </div>
        </section>
        <section className="summary-section">
          <h2>Caregiver: Educational Attainment</h2>
          <div className="summary-grid ed-grid">
            {edLabels.map((lbl, i) => (
              <div key={i} className="summary-field"><label>{lbl}</label><div className="summary-value">{s.caregiverEd[i] ?? 0}</div></div>
            ))}
          </div>
        </section>

        <section className="summary-section">
          <h2>Household Practices Summary</h2>
          <div className="summary-grid practices-grid">
            <div className="summary-field full"><label>Total No. of Couple Practicing Family Planning</label><div className="summary-value">{s.practices.coupleFP}</div></div>
            <div className="summary-field"><label>Toilet: Improved Sanitation</label><div className="summary-value">{s.practices.toiletImproved}</div></div>
            <div className="summary-field"><label>Toilet: Shared Facility</label><div className="summary-value">{s.practices.toiletShared}</div></div>
            <div className="summary-field"><label>Toilet: Unimproved</label><div className="summary-value">{s.practices.toiletUnimproved}</div></div>
            <div className="summary-field"><label>Toilet: Open defecation</label><div className="summary-value">{s.practices.toiletOpen}</div></div>
            <div className="summary-field"><label>Water: Improved</label><div className="summary-value">{s.practices.waterImproved}</div></div>
            <div className="summary-field"><label>Water: Unimproved</label><div className="summary-value">{s.practices.waterUnimproved}</div></div>
            <div className="summary-field"><label>Food: Vegetable Garden</label><div className="summary-value">{s.practices.foodVG}</div></div>
            <div className="summary-field"><label>Food: Fruit</label><div className="summary-value">{s.practices.foodFruit}</div></div>
            <div className="summary-field"><label>Food: Poultry/Livestock</label><div className="summary-value">{s.practices.foodPL}</div></div>
            <div className="summary-field"><label>Food: Fishpond</label><div className="summary-value">{s.practices.foodFP}</div></div>
            <div className="summary-field"><label>Food: None</label><div className="summary-value">{s.practices.foodNone}</div></div>
            <div className="summary-field"><label>Household Using: Iodized Salt</label><div className="summary-value">{s.practices.iodizedSalt}</div></div>
            <div className="summary-field"><label>Household Using: Iron-Fortified Rice</label><div className="summary-value">{s.practices.ironFortifiedRice}</div></div>
          </div>
        </section>
      </div>
      <AbbreviationGuideModal open={showAbbreviations} onClose={() => setShowAbbreviations(false)} />
    </div>
  );
};

export default BarangaySummary;
