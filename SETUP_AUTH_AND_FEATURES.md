# Setup: Auth, Search, View/Edit/Delete, Data Validation

## Backend

1. **Install Sanctum** (if not already installed):
   ```bash
   cd backend
   composer require laravel/sanctum
   ```

2. **Run migrations** (adds composite unique on household_number + barangay, and Sanctum tables if any):
   ```bash
   php artisan migrate
   ```

3. **Seed default user** (for login):
   ```bash
   php artisan db:seed
   ```
   - **Email:** `admin@nutrition.cabuyao.gov.ph`
   - **Password:** `password`

4. **CORS**: If the frontend runs on a different port (e.g. `localhost:5173`), ensure `config/cors.php` or middleware allows your frontend origin. Laravel 11+ often allows all origins by default for API.

## Frontend

1. **Environment**: Set `VITE_API_BASE_URL` to your backend URL (e.g. `http://localhost:8000`) if different from default.

2. **Login**: Open the app, you will be redirected to `/login`. Sign in with the seeded user above.

3. **Features added**:
   - **Login / Logout**: Sidebar shows user name and "Log out". All API routes require authentication.
   - **Household Records**: New nav item "Household Records" – search by HH No., barangay, name, or purok; view, edit, or delete a record.
   - **Search**: Uses backend `search` query on list; also searches member names.
   - **View**: Click "View" on a row to see read-only household detail.
   - **Edit**: Click "Edit" or go to Encode Record with an id (e.g. `/encode-record/1`) to load and update.
   - **Delete**: Click "Delete", then confirm "Yes, delete".
   - **Duplicate check**: When encoding or editing, if the same HH No. already exists in the same barangay, a warning is shown and save is blocked until fixed. Backend also validates duplicate on create/update (per barangay).

## Duplicate rule

- **Duplicate** = same **Household Number** and same **Barangay**.
- Same HH No. in a *different* barangay is allowed.
- Backend migration changes the unique constraint from `household_number` only to `(household_number, barangay)`.
