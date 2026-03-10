import ExcelJS from 'exceljs';

const thinBorder = {
  top: { style: 'thin' as const },
  left: { style: 'thin' as const },
  bottom: { style: 'thin' as const },
  right: { style: 'thin' as const },
};

export const BNS_COL_WIDTHS = [
  10, 14, 14, 18, 16, 
  9, 9, 10, 10, 10, 10, 10, 10, 12, 12, 
  12, 12, 10, 14, 
  10, 10, 10, 10, 10, 10, 
  30, 24, 20, 18, 14, 14, 20, 16, 18
];

/**
 * Build BNS Form header rows 1-10 (same as Import page Download Template).
 * Data rows start at row 11. Columns A-AH (1-34) only.
 */
export function buildBnsFormHeader(
  worksheet: ExcelJS.Worksheet,
  prefills?: { barangay?: string; municipalityCity?: string; province?: string }
): void {
  // Row 1-3: Titles
  const titleRow1 = worksheet.addRow(['BNS Form No. 1A']);
  titleRow1.getCell(1).font = { bold: true, size: 14 };
  titleRow1.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(1, 1, 1, 34);

  const titleRow2 = worksheet.addRow(['Philippine Plan of Action for Nutrition']);
  titleRow2.getCell(1).font = { bold: true, size: 12 };
  titleRow2.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(2, 1, 2, 34);

  const titleRow3 = worksheet.addRow(['HOUSEHOLD PROFILE']);
  titleRow3.getCell(1).font = { bold: true, size: 12 };
  titleRow3.getCell(1).alignment = { horizontal: 'center' };
  worksheet.mergeCells(3, 1, 3, 34);

  worksheet.addRow([]); // Row 4
  const row5 = worksheet.addRow([]);
  row5.getCell(1).value = 'Purok/Sitio:';
  worksheet.mergeCells(5, 1, 5, 2); // Row 5: merge A and B
  worksheet.mergeCells(5, 3, 5, 19); // Row 5: merge C through S
  row5.getCell(3).border = { bottom: { style: 'thin' as const } }; // underline on C–S merged cell
  row5.getCell(20).value = 'Municipality/City:'; // Row 5 column T
  worksheet.mergeCells(5, 20, 5, 21); // Row 5: merge T and U
  worksheet.mergeCells(5, 22, 5, 34); // Row 5: merge V through AH
  row5.getCell(22).border = { bottom: { style: 'thin' as const } }; // underline on V–AH merged cell
  row5.getCell(22).value = prefills?.municipalityCity ?? '';
  row5.font = { bold: true, size: 14 };

  const row6 = worksheet.addRow([]);
  row6.getCell(1).value = 'Barangay:';
  worksheet.mergeCells(6, 1, 6, 2); // Row 6: merge A and B
  worksheet.mergeCells(6, 3, 6, 19); // Row 6: merge C through S
  row6.getCell(3).border = { bottom: { style: 'thin' as const } }; // underline on C–S merged cell
  row6.getCell(3).value = prefills?.barangay ?? '';
  row6.getCell(20).value = 'Province:'; // Row 6 column T
  worksheet.mergeCells(6, 20, 6, 21); // Row 6: merge T and U
  worksheet.mergeCells(6, 22, 6, 34); // Row 6: merge V through AH
  row6.getCell(22).border = { bottom: { style: 'thin' as const } }; // underline on V–AH merged cell
  row6.getCell(22).value = prefills?.province ?? '';
  row6.font = { bold: true, size: 14 };

  const row7 = worksheet.addRow([]);
  row7.getCell(1).value = 'HH\nNo.';
  row7.getCell(2).value = 'No. of\nfamily\nliving in\nthe house';
  row7.getCell(3).value = 'Number\nof HH\nmembers';
  row7.getCell(4).value = 'NHTS Household';
  row7.getCell(5).value = 'Indigenous Group';
  row7.getCell(26).value = 'Name of Father (Fa)\nand Mother (Mo);\nCaregiver (Ca)';
  row7.getCell(27).value = 'Occupation';
  row7.getCell(28).value = 'Educational\nAttainment';
  row7.getCell(29).value = 'Couple Practicing\nFamily Planning';
  worksheet.mergeCells(7, 6, 7, 25);
  row7.getCell(6).value = 'Number of Family Members by Age Classification / Health Risk Group';
  worksheet.mergeCells(7, 30, 7, 32);
  row7.getCell(30).value = 'Fill In:';
  worksheet.mergeCells(7, 33, 7, 34);
  row7.getCell(33).value = 'Check If:';
  row7.font = { bold: true };
  row7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
  row7.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  for (let c = 1; c <= 34; c++) row7.getCell(c).border = thinBorder;

  const mainHeaderRow = worksheet.addRow([]);
  mainHeaderRow.getCell(1).value = 'HH\nNo.';
  mainHeaderRow.getCell(2).value = 'No. of\nfamily\nliving in\nthe house';
  mainHeaderRow.getCell(3).value = 'Number\nof HH\nmembers';
  mainHeaderRow.getCell(4).value = '1 - NHTS 4Ps\n2 - NHTS Non-4Ps\n3 - Non-NHTS';
  mainHeaderRow.getCell(5).value = '1 - IP\n2 - Non-IP';
  worksheet.mergeCells(8, 6, 8, 7);
  mainHeaderRow.getCell(6).value = 'Newborn\n(0-28 days)';
  worksheet.mergeCells(8, 8, 8, 9);
  mainHeaderRow.getCell(8).value = 'Infant\n(29 days-\n11 months)';
  worksheet.mergeCells(8, 10, 8, 11);
  mainHeaderRow.getCell(10).value = 'Under-five\n(1-4 years\nold)';
  worksheet.mergeCells(8, 12, 8, 13);
  mainHeaderRow.getCell(12).value = 'Children\n5-9 y.o.';
  worksheet.mergeCells(8, 14, 8, 15);
  mainHeaderRow.getCell(14).value = 'Adolescence\n(10-19 y.o.)';
  mainHeaderRow.getCell(16).value = 'Pregnant';
  mainHeaderRow.getCell(17).value = 'Adolescent\nPregnant';
  mainHeaderRow.getCell(18).value = 'Post-\nPartum\n(PP)';
  mainHeaderRow.getCell(19).value = '15-49 y.o.\nnot pregnant\n& non PP';
  worksheet.mergeCells(8, 20, 8, 21);
  mainHeaderRow.getCell(20).value = 'Adult\n20-59 y.o.';
  worksheet.mergeCells(8, 22, 8, 23);
  mainHeaderRow.getCell(22).value = 'Senior\nCitizens';
  worksheet.mergeCells(8, 24, 8, 25);
  mainHeaderRow.getCell(24).value = 'Person\nWith\nDisability';
  mainHeaderRow.getCell(26).value = 'Name of Father (Fa)\nand Mother (Mo);\nCaregiver (Ca)';
  mainHeaderRow.getCell(27).value = 'Occupation';
  mainHeaderRow.getCell(28).value = 'Educational\nAttainment';
  mainHeaderRow.getCell(29).value = 'Couple Practicing\nFamily Planning';
  mainHeaderRow.getCell(30).value = 'Toilet Type\n(1. 2. 3. 4)';
  mainHeaderRow.getCell(31).value = 'Water Source\n(1. 2)';
  mainHeaderRow.getCell(32).value = 'Food Production\nActivity';
  mainHeaderRow.getCell(33).value = 'HH using\nIodized Salt';
  mainHeaderRow.getCell(34).value = 'HH using\nIron-Fortified Rice';
  mainHeaderRow.font = { bold: true, size: 9 };
  mainHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  mainHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
  mainHeaderRow.height = 60;
  for (let c = 1; c <= 34; c++) mainHeaderRow.getCell(c).border = thinBorder;

  const subHeaderRow = worksheet.addRow([]);
  subHeaderRow.getCell(6).value = 'M';
  subHeaderRow.getCell(7).value = 'F';
  subHeaderRow.getCell(8).value = 'M';
  subHeaderRow.getCell(9).value = 'F';
  subHeaderRow.getCell(10).value = 'M';
  subHeaderRow.getCell(11).value = 'F';
  subHeaderRow.getCell(12).value = 'M';
  subHeaderRow.getCell(13).value = 'F';
  subHeaderRow.getCell(14).value = 'M';
  subHeaderRow.getCell(15).value = 'F';
  subHeaderRow.getCell(16).value = 'F';
  subHeaderRow.getCell(17).value = 'F';
  subHeaderRow.getCell(18).value = 'F';
  subHeaderRow.getCell(19).value = 'F';
  subHeaderRow.getCell(20).value = 'M';
  subHeaderRow.getCell(21).value = 'F';
  subHeaderRow.getCell(22).value = 'M';
  subHeaderRow.getCell(23).value = 'F';
  subHeaderRow.getCell(24).value = 'M';
  subHeaderRow.getCell(25).value = 'F';
  subHeaderRow.font = { bold: true, size: 9 };
  subHeaderRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  subHeaderRow.height = 25;
  for (let c = 1; c <= 34; c++) subHeaderRow.getCell(c).border = thinBorder;

  worksheet.mergeCells(7, 1, 9, 1);
  worksheet.mergeCells(7, 2, 9, 2);
  worksheet.mergeCells(7, 3, 9, 3);
  worksheet.mergeCells(7, 26, 9, 26);
  worksheet.mergeCells(8, 4, 9, 4);
  worksheet.mergeCells(8, 5, 9, 5);
  worksheet.mergeCells(8, 30, 9, 30);
  worksheet.mergeCells(8, 31, 9, 31);
  worksheet.mergeCells(8, 32, 9, 32);
  worksheet.mergeCells(8, 33, 9, 33);
  worksheet.mergeCells(8, 34, 9, 34);
  worksheet.mergeCells(7, 27, 9, 27);
  worksheet.mergeCells(7, 28, 9, 28);
  worksheet.mergeCells(7, 29, 9, 29);

  const cLabelRow = worksheet.addRow([]);
  cLabelRow.getCell(1).value = 'C1';
  cLabelRow.getCell(2).value = 'C2';
  cLabelRow.getCell(3).value = 'C3';
  cLabelRow.getCell(4).value = 'C4';
  cLabelRow.getCell(5).value = 'C5';
  for (let c = 6; c <= 25; c++) cLabelRow.getCell(c).value = `C${c}`;
  for (let c = 26; c <= 34; c++) cLabelRow.getCell(c).value = `C${c}`;
  cLabelRow.font = { bold: true, size: 9 };
  cLabelRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  cLabelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
  cLabelRow.height = 25;
  for (let c = 1; c <= 34; c++) cLabelRow.getCell(c).border = thinBorder;
}

/** Apply column widths A-AH */
export function applyBnsColumnWidths(worksheet: ExcelJS.Worksheet): void {
  for (let c = 1; c <= 34; c++) {
    worksheet.getColumn(c).width = BNS_COL_WIDTHS[c - 1] ?? 12;
  }
}
