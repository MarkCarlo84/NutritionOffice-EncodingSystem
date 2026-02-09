import { useEffect, useState } from 'react';
import api from '../lib/api';
import './BarangaySummary.css';

const BARANGAYS = [
  'Baclaran', 'Banay-Banay', 'Banlic', 'Bigaa', 'Butong', 'Casile', 'Diezmo',
  'Pulo', 'Sala', 'San Isidro', 'Poblacion Uno', 'Poblacion Dos', 'Poblacion Tres',
];

const BARANGAY_DISPLAY: Record<string, string> = {
  'Poblacion Uno': 'Pob. Uno',
  'Poblacion Dos': 'Pob. Dos',
  'Poblacion Tres': 'Pob. Tres',
};

// Occupation codes from BNS form: 1–11
const OCC_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, '11': 10,
};
// Education: N, EU, EG, HU, HG, CU, CG, V, PG
const ED_KEYS = ['none', 'elem_undergrad', 'elem_grad', 'hs_undergrad', 'hs_grad', 'college_undergrad', 'college_grad', 'vocational', 'post_grad'];
const ED_MAP: Record<string, number> = {
  'N': 0, 'EU': 1, 'EG': 2, 'HU': 3, 'HG': 4, 'CU': 5, 'CG': 6, 'V': 7, 'PG': 8,
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

function aggregateSummary(households: any[]): SurveySummary {
  const s = emptySummary();
  const puroks = new Set<string>();

  for (const h of households) {
    const n = Number(h.number_of_members) || 0;
    const fam = Number(h.family_living_in_house) || 1;
    s.totals.households += 1;
    s.totals.families += fam;
    if (h.purok_sito) puroks.add(String(h.purok_sito).trim());
    s.totals.population += n;

    if (n > 10) s.familySize.moreThan10 += 1;
    else if (n >= 8) s.familySize.n8to10 += 1;
    else if (n >= 6) s.familySize.n6to7 += 1;
    else if (n >= 2) s.familySize.n2to5 += 1;
    else s.familySize.n1 += 1;

    s.ageHealth.newborn += (Number(h.newborn_male) || 0) + (Number(h.newborn_female) || 0);
    s.ageHealth.infants += (Number(h.infant_male) || 0) + (Number(h.infant_female) || 0);
    s.ageHealth.underFive += (Number(h.under_five_male) || 0) + (Number(h.under_five_female) || 0);
    s.ageHealth.children5_9 += (Number(h.children_male) || 0) + (Number(h.children_female) || 0);
    s.ageHealth.adolescence += (Number(h.adolescence_male) || 0) + (Number(h.adolescence_female) || 0);
    s.ageHealth.adult += (Number(h.adult_male) || 0) + (Number(h.adult_female) || 0);
    s.ageHealth.pregnant += Number(h.pregnant) || 0;
    s.ageHealth.adolescentPregnant += Number(h.adolescent_pregnant) || 0;
    s.ageHealth.postPartum += Number(h.post_partum) || 0;
    s.ageHealth.women15_49 += Number(h.women_15_49_not_pregnant) || 0;
    s.ageHealth.seniorCitizens += (Number(h.senior_citizen_male) || 0) + (Number(h.senior_citizen_female) || 0);
    s.ageHealth.pwd += (Number(h.pwd_male) || 0) + (Number(h.pwd_female) || 0);

    if (h.couple_practicing_family_planning) s.practices.coupleFP += 1;
    const tt = Number(h.toilet_type);
    if (tt === 1) s.practices.toiletImproved += 1;
    else if (tt === 2) s.practices.toiletShared += 1;
    else if (tt === 3) s.practices.toiletUnimproved += 1;
    else if (tt === 4) s.practices.toiletOpen += 1;
    const ws = Number(h.water_source);
    if (ws === 1) s.practices.waterImproved += 1;
    else if (ws === 2) s.practices.waterUnimproved += 1;
    const fp = String(h.food_production_activity || '').toUpperCase();
    if (fp === 'VG') s.practices.foodVG += 1;
    else if (fp === 'FT') s.practices.foodFruit += 1;
    else if (fp === 'PL') s.practices.foodPL += 1;
    else if (fp === 'FP') s.practices.foodFP += 1;
    else if (fp === 'NA' || !fp) s.practices.foodNone += 1;
    if (h.using_iodized_salt) s.practices.iodizedSalt += 1;
    if (h.using_iron_fortified_rice) s.practices.ironFortifiedRice += 1;

    const members = h.members || [];
    for (const m of members) {
      const occIdx = OCC_MAP[String(m.occupation)] ?? 10;
      const edIdx = ED_MAP[String(m.educational_attainment || '').toUpperCase()] ?? 0;
      if (m.role === 'father') {
        s.fatherOcc[occIdx] = (s.fatherOcc[occIdx] || 0) + 1;
        s.fatherEd[edIdx] = (s.fatherEd[edIdx] || 0) + 1;
      } else if (m.role === 'mother') {
        s.motherOcc[occIdx] = (s.motherOcc[occIdx] || 0) + 1;
        s.motherEd[edIdx] = (s.motherEd[edIdx] || 0) + 1;
      } else if (m.role === 'caregiver') {
        s.caregiverOcc[occIdx] = (s.caregiverOcc[occIdx] || 0) + 1;
        s.caregiverEd[edIdx] = (s.caregiverEd[edIdx] || 0) + 1;
      }
    }
  }

  s.totals.purokBlockStreet = puroks.size;
  return s;
}

function applyFilters(
  households: any[],
  filters: { barangay: string; purokBlockStreet: string; surveyYear: string; surveyPeriodFrom: string; surveyPeriodTo: string }
): any[] {
  let list = households;
  if (filters.barangay) {
    list = list.filter((h: any) => (h.barangay || '') === filters.barangay);
  }
  if (filters.purokBlockStreet) {
    list = list.filter((h: any) => String(h.purok_sito || '').trim() === filters.purokBlockStreet);
  }
  if (filters.surveyYear) {
    list = list.filter((h: any) => {
      const d = h.updated_at || h.created_at;
      if (!d) return true;
      const y = new Date(d).getFullYear().toString();
      return y === filters.surveyYear;
    });
  }
  if (filters.surveyPeriodFrom || filters.surveyPeriodTo) {
    list = list.filter((h: any) => {
      const d = h.updated_at || h.created_at;
      if (!d) return true;
      const t = new Date(d).getTime();
      if (filters.surveyPeriodFrom) {
        const from = new Date(filters.surveyPeriodFrom + 'T00:00:00').getTime();
        if (t < from) return false;
      }
      if (filters.surveyPeriodTo) {
        const to = new Date(filters.surveyPeriodTo + 'T23:59:59').getTime();
        if (t > to) return false;
      }
      return true;
    });
  }
  return list;
}

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
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/households', { params: { per_page: 10000 } });
        const list = res.data?.data ?? res.data ?? [];
        const all = Array.isArray(list) ? list : [];
        setHouseholds(all);
      } catch (e) {
        console.error(e);
        setHouseholds([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const filtered = applyFilters(households, {
      barangay: filters.barangay,
      purokBlockStreet: filters.purokBlockStreet,
      surveyYear: filters.surveyYear,
      surveyPeriodFrom: filters.surveyPeriodFrom,
      surveyPeriodTo: filters.surveyPeriodTo,
    });
    const s = aggregateSummary(filtered);
    s.basic.bns = filters.barangayNutritionScholar || '—';
    s.basic.barangay = filters.barangay ? (BARANGAY_DISPLAY[filters.barangay] || filters.barangay) : 'All Barangays';
    s.basic.purokBlockStreet = filters.purokBlockStreet || '—';
    if (filters.surveyPeriodFrom && filters.surveyPeriodTo) {
      s.basic.surveyPeriod = `${filters.surveyPeriodFrom} - ${filters.surveyPeriodTo}`;
    } else if (filters.surveyPeriodFrom) {
      s.basic.surveyPeriod = `From ${filters.surveyPeriodFrom}`;
    } else if (filters.surveyPeriodTo) {
      s.basic.surveyPeriod = `To ${filters.surveyPeriodTo}`;
    } else {
      s.basic.surveyPeriod = filters.surveyYear ? filters.surveyYear : '—';
    }
    s.basic.surveyYear = filters.surveyYear || new Date().getFullYear().toString();
    setSummary(s);
  }, [loading, households, filters]);

  if (loading) return <div className="barangay-summary loading">Loading Family Profile Survey Summary...</div>;

  const s = summary || emptySummary();
  const occLabels = ['Manager', 'Professional', 'Technician & Associate Professional', 'Clerical Support Workers', 'Service & Sales Workers', 'Skilled Agri, Forestry & Fishery', 'Craft & Related Workers', 'Plant & Machine Operators', 'Elementary Occupations', 'Armed Forces', 'None'];
  const edLabels = ['None', 'Elementary Undergraduate', 'Elementary Graduate', 'HighSchool Undergraduate', 'HighSchool Graduate', 'College Undergraduate', 'College Graduate', 'Vocational', 'Post Graduate'];

  const purokOptions = Array.from(
    new Set(households.map((h: any) => String(h.purok_sito || '').trim()).filter(Boolean))
  ).sort();
  const yearOptions = Array.from(
    new Set(
      households.flatMap((h: any) => {
        const d = h.updated_at || h.created_at;
        return d ? [new Date(d).getFullYear().toString()] : [];
      })
    )
  ).sort((a, b) => Number(b) - Number(a));
  const currentYear = new Date().getFullYear().toString();
  if (yearOptions.length === 0) yearOptions.push(currentYear);

  return (
    <div className="barangay-summary">
      <div className="summary-header">
        <h1>FAMILY PROFILE Survey Summary {new Date().getFullYear()}</h1>
        <p>Republika ng Pilipinas | Lalawigan ng Laguna | Pamahalaang Lungsod ng CABUYAO | TANGGAPANG PANGLUNSOD NG NUTRISYON</p>
        <p className="summary-data-source">
          All summary records are based on data encoded or imported in the system. Totals, family size distribution, age/health counts, occupation and education summaries, and household practices are generated from household records saved via Encode Record or Import Data.
        </p>

        <div className="summary-filters">
          <h3>Filters</h3>
          <div className="filters-grid">
            <div className="filter-field">
              <label>Barangay Nutrition Scholar</label>
              <input
                type="text"
                value={filters.barangayNutritionScholar}
                onChange={(e) => setFilters((f) => ({ ...f, barangayNutritionScholar: e.target.value }))}
                placeholder="Enter BNS name"
              />
            </div>
            <div className="filter-field">
              <label>Barangay</label>
              <select
                value={filters.barangay}
                onChange={(e) => setFilters((f) => ({ ...f, barangay: e.target.value }))}
              >
                <option value="">All Barangays</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{BARANGAY_DISPLAY[b] || b}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Purok / Block / Street</label>
              <select
                value={filters.purokBlockStreet}
                onChange={(e) => setFilters((f) => ({ ...f, purokBlockStreet: e.target.value }))}
              >
                <option value="">All</option>
                {purokOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Survey Year</label>
              <select
                value={filters.surveyYear}
                onChange={(e) => setFilters((f) => ({ ...f, surveyYear: e.target.value }))}
              >
                <option value="">All years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label>Survey Period (From)</label>
              <input
                type="date"
                value={filters.surveyPeriodFrom}
                onChange={(e) => setFilters((f) => ({ ...f, surveyPeriodFrom: e.target.value }))}
              />
            </div>
            <div className="filter-field">
              <label>Survey Period (To)</label>
              <input
                type="date"
                value={filters.surveyPeriodTo}
                onChange={(e) => setFilters((f) => ({ ...f, surveyPeriodTo: e.target.value }))}
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
    </div>
  );
};

export default BarangaySummary;
