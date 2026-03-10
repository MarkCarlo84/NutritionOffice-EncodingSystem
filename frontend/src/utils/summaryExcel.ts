import ExcelJS from 'exceljs';
import type { SurveySummary } from './surveySummary';
import { OCC_LABELS, ED_LABELS } from './surveySummary';

export function buildSummaryWorksheet(
    ws: ExcelJS.Worksheet,
    s: SurveySummary,
    useFormulas = false
): void {
    ws.pageSetup.orientation = 'landscape';
    ws.pageSetup.fitToPage = true;
    ws.properties.defaultRowHeight = 18;

    const headerFont = { bold: true, size: 11 };
    const titleFont = { bold: true, size: 14 };

    const r1 = ws.addRow(['Republika ng Pilipinas']);
    ws.mergeCells(1, 1, 1, 8);
    r1.getCell(1).font = { size: 11 };
    r1.getCell(1).alignment = { horizontal: 'center' };

    const r2 = ws.addRow(['Lalawigan ng Laguna']);
    ws.mergeCells(2, 1, 2, 8);
    r2.getCell(1).font = { size: 11 };
    r2.getCell(1).alignment = { horizontal: 'center' };

    const r3 = ws.addRow(['Pamahalaang Lungsod ng CABUYAO']);
    ws.mergeCells(3, 1, 3, 8);
    r3.getCell(1).font = headerFont;
    r3.getCell(1).alignment = { horizontal: 'center' };

    const r4 = ws.addRow(['TANGGAPANG PANLUNGSOD NG NUTRISYON']);
    ws.mergeCells(4, 1, 4, 8);
    r4.getCell(1).font = headerFont;
    r4.getCell(1).alignment = { horizontal: 'center' };

    const r5 = ws.addRow([`FAMILY PROFILE Survey Summary ${s.basic.surveyYear || new Date().getFullYear()}`]);
    ws.mergeCells(5, 1, 5, 8);
    r5.getCell(1).font = titleFont;
    r5.getCell(1).alignment = { horizontal: 'center' };

    ws.addRow([]);
    // Reference range for Household Data (rows 11-1000 to cover plenty of entries)
    const householdRef = "'Household Data'";
    const rStart = 11;
    const rEnd = 1000;

    // Row 7 Headers
    const r7 = ws.getRow(7);
    r7.getCell(1).value = `BARANGAY NUTRITION SCHOLAR:  ${s.basic.bns || '—'}`;
    r7.getCell(4).value = useFormulas
        ? { formula: `="BARANGAY:  ${s.basic.barangay || '—'}        PUROK / BLOCK / STREET:  " & ${householdRef}!C5` }
        : `BARANGAY:  ${s.basic.barangay || '—'}        PUROK / BLOCK / STREET:  ${s.basic.purokBlockStreet || '—'}`;
    r7.getCell(7).value = `SURVEY PERIOD & YEAR:  ${s.basic.surveyPeriod || s.basic.surveyYear || '—'}`;
    [1, 4, 7].forEach((col) => {
        r7.getCell(col).font = { size: 10, bold: true };
    });
    ws.addRow([]); // Blank row 8

    const leftCol: [string, any][] = [
        ['Total No. of Households', useFormulas ? { formula: `SUMPRODUCT((${householdRef}!A${rStart}:A${rEnd}<>"")/COUNTIF(${householdRef}!A${rStart}:A${rEnd}, ${householdRef}!A${rStart}:A${rEnd}&""))` } : s.totals.households],
        ['Total No. of Families', useFormulas ? { formula: `COUNTIF(${householdRef}!A${rStart}:A${rEnd}, "<>")` } : s.totals.families],
        ['Family Size:', ''],
        ['     more than 10', useFormulas ? { formula: `COUNTIF(${householdRef}!C${rStart}:C${rEnd}, ">10")` } : s.familySize.moreThan10],
        ['     8 - 10', useFormulas ? { formula: `COUNTIFS(${householdRef}!C${rStart}:C${rEnd}, ">=8", ${householdRef}!C${rStart}:C${rEnd}, "<=10")` } : s.familySize.n8to10],
        ['     6 - 7', useFormulas ? { formula: `COUNTIFS(${householdRef}!C${rStart}:C${rEnd}, ">=6", ${householdRef}!C${rStart}:C${rEnd}, "<=7")` } : s.familySize.n6to7],
        ['     2 - 5', useFormulas ? { formula: `COUNTIFS(${householdRef}!C${rStart}:C${rEnd}, ">=2", ${householdRef}!C${rStart}:C${rEnd}, "<=5")` } : s.familySize.n2to5],
        ['     1', useFormulas ? { formula: `COUNTIF(${householdRef}!C${rStart}:C${rEnd}, 1)` } : s.familySize.n1],
        ['Total No. of Purok/Block/Street', useFormulas ? '—' : s.totals.purokBlockStreet],
        ['Total Population', useFormulas ? { formula: `SUM(${householdRef}!C${rStart}:C${rEnd})` } : s.totals.population],
        ['No. of Family Members by Age Classification & Health Risk Group:', ''],
        ['     Newborn 0 - 28 days', useFormulas ? { formula: `SUM(${householdRef}!F${rStart}:G${rEnd})` } : s.ageHealth.newborn],
        ['     Infants 29 days - 11 mos', useFormulas ? { formula: `SUM(${householdRef}!H${rStart}:I${rEnd})` } : s.ageHealth.infants],
        ['     Under-five 1 - 4 years old', useFormulas ? { formula: `SUM(${householdRef}!J${rStart}:K${rEnd})` } : s.ageHealth.underFive],
        ['     Children 5 - 9 years old', useFormulas ? { formula: `SUM(${householdRef}!L${rStart}:M${rEnd})` } : s.ageHealth.children5_9],
        ['     Adolescents 10-19 y.o.', useFormulas ? { formula: `SUM(${householdRef}!N${rStart}:O${rEnd})` } : s.ageHealth.adolescence],
        ['     Pregnant', useFormulas ? { formula: `SUM(${householdRef}!P${rStart}:P${rEnd})` } : s.ageHealth.pregnant],
        ['     Adolescent Pregnant', useFormulas ? { formula: `SUM(${householdRef}!Q${rStart}:Q${rEnd})` } : s.ageHealth.adolescentPregnant],
        ['     Post-Partum', useFormulas ? { formula: `SUM(${householdRef}!R${rStart}:R${rEnd})` } : s.ageHealth.postPartum],
        ['     15-49 y.o. (non pregnant & non-PP)', useFormulas ? { formula: `SUM(${householdRef}!S${rStart}:S${rEnd})` } : s.ageHealth.women15_49],
        ['     Adult 20-59 y.o.', useFormulas ? { formula: `SUM(${householdRef}!T${rStart}:U${rEnd})` } : s.ageHealth.adult],
        ['     Senior Citizens', useFormulas ? { formula: `SUM(${householdRef}!V${rStart}:W${rEnd})` } : s.ageHealth.seniorCitizens],
        ['     Persons with Disability', useFormulas ? { formula: `SUM(${householdRef}!X${rStart}:Y${rEnd})` } : s.ageHealth.pwd],
        ['Father:', ''],
        ['Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AA${rStart}:AA${rEnd}, "${i + 1}")` } : s.fatherOcc[i] ?? 0] as [string, any]),
        ['Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AB${rStart}:AB${rEnd}, "${lbl.split('_')[0]}")` } : s.fatherEd[i] ?? 0] as [string, any]),
    ];

    const midCol: [string, any][] = [
        ['Mother:', ''],
        ['Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AA${rStart + 1}:AA${rEnd + 1}, "${i + 1}")` } : s.motherOcc[i] ?? 0] as [string, any]),
        ['Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AB${rStart + 1}:AB${rEnd + 1}, "${lbl.split('_')[0]}")` } : s.motherEd[i] ?? 0] as [string, any]),
        ['Caregiver:', ''],
        ['Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AA${rStart + 2}:AA${rEnd + 2}, "${i + 1}")` } : s.caregiverOcc[i] ?? 0] as [string, any]),
        ['Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [`     ${lbl}`, useFormulas ? { formula: `COUNTIF(${householdRef}!AB${rStart + 2}:AB${rEnd + 2}, "${lbl.split('_')[0]}")` } : s.caregiverEd[i] ?? 0] as [string, any]),
    ];

    const rightCol: [string, any][] = [
        ['Total No. of Couple Practicing Family Planning', useFormulas ? { formula: `COUNTIF(${householdRef}!AC${rStart}:AC${rEnd}, "Yes")` } : s.practices.coupleFP],
        ['', ''],
        ['Households with:', ''],
        ['     Toilet Type:', ''],
        ['          Improved Sanitation', useFormulas ? { formula: `COUNTIF(${householdRef}!AD${rStart}:AD${rEnd}, 1)` } : s.practices.toiletImproved],
        ['          Shared Facility', useFormulas ? { formula: `COUNTIF(${householdRef}!AD${rStart}:AD${rEnd}, 2)` } : s.practices.toiletShared],
        ['          Unimproved', useFormulas ? { formula: `COUNTIF(${householdRef}!AD${rStart}:AD${rEnd}, 3)` } : s.practices.toiletUnimproved],
        ['          Open defecation', useFormulas ? { formula: `COUNTIF(${householdRef}!AD${rStart}:AD${rEnd}, 4)` } : s.practices.toiletOpen],
        ['     Water Source:', ''],
        ['          Improved water source', useFormulas ? { formula: `COUNTIF(${householdRef}!AE${rStart}:AE${rEnd}, 1)` } : s.practices.waterImproved],
        ['          Unimproved water source', useFormulas ? { formula: `COUNTIF(${householdRef}!AE${rStart}:AE${rEnd}, 2)` } : s.practices.waterUnimproved],
        ['     Food Production:', ''],
        ['          VG_Vegetable garden', useFormulas ? { formula: `COUNTIF(${householdRef}!AF${rStart}:AF${rEnd}, "VG")` } : s.practices.foodVG],
        ['          FT_Fruit', useFormulas ? { formula: `COUNTIF(${householdRef}!AF${rStart}:AF${rEnd}, "FT")` } : s.practices.foodFruit],
        ['          PL_Poultry/livestock', useFormulas ? { formula: `COUNTIF(${householdRef}!AF${rStart}:AF${rEnd}, "PL")` } : s.practices.foodPL],
        ['          FP_Fishpond', useFormulas ? { formula: `COUNTIF(${householdRef}!AF${rStart}:AF${rEnd}, "FP")` } : s.practices.foodFP],
        ['          NA_None', useFormulas ? { formula: `COUNTIF(${householdRef}!AF${rStart}:AF${rEnd}, "NA")` } : s.practices.foodNone],
        ['', ''],
        ['Households using:', ''],
        ['     Iodized salt', useFormulas ? { formula: `COUNTIF(${householdRef}!AG${rStart}:AG${rEnd}, "Yes")` } : s.practices.iodizedSalt],
        ['     Iron-Fortified Rice', useFormulas ? { formula: `COUNTIF(${householdRef}!AH${rStart}:AH${rEnd}, "Yes")` } : s.practices.ironFortifiedRice],
    ];

    const maxRows = Math.max(leftCol.length, midCol.length, rightCol.length);
    const startRow = 9;

    for (let i = 0; i < maxRows; i++) {
        const row = ws.getRow(startRow + i);
        row.height = 16;

        if (i < leftCol.length) {
            row.getCell(1).value = leftCol[i][0];
            row.getCell(2).value = leftCol[i][1];
        }

        if (i < midCol.length) {
            row.getCell(4).value = midCol[i][0];
            row.getCell(5).value = midCol[i][1];
        }

        if (i < rightCol.length) {
            row.getCell(7).value = rightCol[i][0];
            row.getCell(8).value = rightCol[i][1];
        }

        [2, 5, 8].forEach((col) => {
            const c = row.getCell(col);
            if (c.value !== '') {
                c.alignment = { horizontal: 'center' };
                c.border = { bottom: { style: 'thin' } };
            }
        });
    }

    const applyBox = (startCol: number, endCol: number, topRow: number, bottomRow: number) => {
        for (let r = topRow; r <= bottomRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = ws.getRow(r).getCell(c);
                let border: any = cell.border ? { ...cell.border } : {};
                if (r === topRow) border.top = { style: 'thin' };
                if (r === bottomRow) border.bottom = { style: 'thin' };
                if (c === startCol) border.left = { style: 'thin' };
                if (c === endCol) border.right = { style: 'thin' };
                cell.border = border;
            }
        }
    };

    const endRow = startRow + maxRows - 1;
    applyBox(1, 2, startRow, endRow);
    applyBox(4, 5, startRow, endRow);
    applyBox(7, 8, startRow, endRow);

    // Add footer text inside right box at bottom
    const footerRow = endRow - 1;
    const fCell = ws.getRow(footerRow).getCell(7);
    fCell.value = '1 copy BNS / 1 copy BNC / 1 copy CNO';
    fCell.font = { size: 8, italic: true };
    fCell.alignment = { horizontal: 'right' };
    ws.mergeCells(footerRow, 7, footerRow, 8);

    ws.getColumn(1).width = 38;
    ws.getColumn(2).width = 12;
    ws.getColumn(3).width = 2;
    ws.getColumn(4).width = 38;
    ws.getColumn(5).width = 12;
    ws.getColumn(6).width = 2;
    ws.getColumn(7).width = 38;
    ws.getColumn(8).width = 12;
}
