export const BNS_BY_BARANGAY: Record<string, string[]> = {
  'Baclaran': ['Levi Marcellana Garcia'],
  'Banay-Banay': ['Mauricia D. Basisao'],
  'Banlic': ['Hazel B. Bumanlag'],
  'Bigaa': ['Jenet D. Perez'],
  'Butong': ['Angelita R. Barrio'],
  'Casile': ['Belen D. Andes'],
  'Diezmo': ['Epifania C. Llanto'],
  'Pulo': ['Julieta M. Caparas'],
  'Sala': ['Marianne C. Villanueva'],
  'San Isidro': ['Jane F. Catadina'],
  'Pob. Uno': ['Marilyn O. Salandanan'],
  'Pob. Dos': ['Alice Arlene A. Alagon'],
  'Pob. Tres': ['Jona A. Velasquez'],
};

export const getBnsOptions = (barangay: string): string[] => BNS_BY_BARANGAY[barangay] || [];

export const resolveBnsForBarangay = (barangay: string, currentBns: string): string => {
  if (!barangay) return '';
  const options = getBnsOptions(barangay);
  if (options.length === 0) return currentBns;
  if (options.includes(currentBns)) return currentBns;
  return options[0];
};
