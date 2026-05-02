export const BNS_BY_BARANGAY: Record<string, string[]> = {
  'Baclaran': [],
  'Banay-Banay': ['Mauricia D. Basisao'],
  'Banlic': ['Hazel B. Bumanlag'],
  'Bigaa': ['Jenet D. Perez'],
  'Butong': ['Angelita R. Barrio'],
  'Casile': ['Belen D. Andes'],
  'Diezmo': ['Epifania C. Llanto'],
  'Gulod': ['Belen Almoro'],
  'Mamatid': ['Lhineth T. Catindig', 'Jane Ashley Cristobal'],
  'Marinig': ['Armalyn J. Sabino'],
  'Niugan': ['Gina G. Balmes'],
  'Pittland': ['Evelyn De Castro'],
  'Poblacion Dos': ['Alice Arlene A. Alagon'],
  'Poblacion Tres': ['Jona A. Velasquez'],
  'Poblacion Uno': ['Marilyn O. Salandanan'],
  'Pulo': ['Julieta M. Caparas'],
  'Sala': ['Marianne C. Villanueva'],
  'San Isidro': ['Jane F. Catadina'],
};

export const getBnsOptions = (barangay: string): string[] => BNS_BY_BARANGAY[barangay] || [];

export const resolveBnsForBarangay = (barangay: string, currentBns: string): string => {
  if (!barangay) return '';
  const options = getBnsOptions(barangay);
  if (options.length === 0) return '';
  if (options.includes(currentBns)) return currentBns;
  return options[0];
};
