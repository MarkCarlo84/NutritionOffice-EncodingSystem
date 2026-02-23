# TODO: Update BNS Form PDF Export Format

## Task
Make the BNS Form (PDF) export in Export Data page look like the Nutrition BNS Form.pdf format

## Steps
1. [x] Understand the current implementation in ExportData.tsx
2. [x] Review bnsFormTemplate.ts for proper header structure
3. [ ] Update handleExportBnsPdf function in ExportData.tsx with:
   - [ ] Add proper header titles (BNS Form No. 1A, Philippine Plan of Action for Nutrition, HOUSEHOLD PROFILE)
   - [ ] Add Purok/Sitio and Municipality/City fields (Row 5)
   - [ ] Add Barangay and Province fields (Row 6)
   - [ ] Add detailed column headers (Rows 7-10)
   - [ ] Add C1-C34 column labels
   - [ ] Format data rows properly
4. [ ] Test the BNS Form PDF export

## File to Edit
- frontend/src/pages/ExportData.tsx
