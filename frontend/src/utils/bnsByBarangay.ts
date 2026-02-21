export const BNS_BY_BARANGAY: Record<string, string[]> = {
  'Poblacion Uno': ['Marilyn O. Salandanan'],
  'Poblacion Dos': ['Alice Arlene A. Alagon'],
  'Poblacion Tres': ['Jona A. Velasquez'],
  Sala: ['Marianne C. Villanueva'],
  Niugan: ['Gina G. Balmes'],
  'Banay-Banay': ['Mauricia D. Basisao'],
  Pulo: ['Julieta M. Caparas'],
  'San Isidro': ['Jane F. Catadina'],
  Banlic: ['Hazel B. Bumanlag'],
  Mamatid: ['Lhineth T. Catindig', 'Jane Ashley Cristobal'],
  Baclaran: ['Levi Marcellana Garcia'],
  Gulod: ['Belen Almoro'],
  Marinig: ['Armalyn J. Sabino'],
  Butong: ['Angelita R. Barrio'],
  Bigaa: ['Jenet D. Perez'],
  Diezmo: ['Epifania C. Llanto'],
  Pittland: ['Evelyn De Castro'],
  Casile: ['Belen Andres'],
};

export const getBnsOptions = (barangay: string): string[] => BNS_BY_BARANGAY[barangay] || [];

export const resolveBnsForBarangay = (barangay: string, currentBns: string): string => {
  if (!barangay) return '';
  const options = getBnsOptions(barangay);
  if (options.length === 0) return currentBns;
  if (options.includes(currentBns)) return currentBns;
  return options[0];
};
