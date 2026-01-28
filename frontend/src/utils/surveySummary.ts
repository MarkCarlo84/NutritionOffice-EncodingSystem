/**
 * Shared types and logic for Family Profile Survey Summary (barangay-level aggregation).
 */

export const BARANGAYS = [
  'Baclaran', 'Banay-Banay', 'Banlic', 'Bigaa', 'Butong', 'Casile', 'Diezmo',
  'Pulo', 'Sala', 'San Isidro', 'Poblacion Uno', 'Poblacion Dos', 'Poblacion Tres',
];

export const BARANGAY_DISPLAY: Record<string, string> = {
  'Poblacion Uno': 'Pob. Uno',
  'Poblacion Dos': 'Pob. Dos',
  'Poblacion Tres': 'Pob. Tres',
};

export const OCC_MAP: Record<string, number> = {
  '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, '11': 10,
};

export const ED_MAP: Record<string, number> = {
  'N': 0, 'EU': 1, 'EG': 2, 'HU': 3, 'HG': 4, 'CU': 5, 'CG': 6, 'V': 7, 'PG': 8,
};

export interface SurveySummary {
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

export interface SummaryFilters {
  barangay: string;
  purokBlockStreet: string;
  surveyYear: string;
  surveyPeriodFrom: string;
  surveyPeriodTo: string;
}

export function emptySummary(): SurveySummary {
  return {
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
  };
}

export function aggregateSummary(households: any[]): SurveySummary {
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

export function applyFilters(
  households: any[],
  filters: SummaryFilters
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
