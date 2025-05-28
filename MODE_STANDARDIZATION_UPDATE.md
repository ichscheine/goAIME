## Mode Standardization Update

On May 28, 2025, we standardized the session mode terminology in goAIME to consistently use "competition" instead of "contest" throughout the application.

### Changes Made

1. Created `fix_db_contest_mode.py` script to update all existing sessions in the database with `mode='contest'` to use `mode='competition'`
2. Modified `enhance_session_data()` in `db_service.py` to automatically convert any new "contest" mode to "competition" mode
3. Created `update_localstorage_mode.js` to update localStorage values in the browser

### Implementation Details

The standardization ensures:
- Consistent terminology throughout the application
- All new sessions will use "competition" mode even if "contest" is passed
- Existing sessions in the database have been updated

### How to Verify

1. Run `python fix_db_contest_mode.py` to update all existing sessions
2. In the browser console, run the script in `frontend/src/update_localstorage_mode.js` to update localStorage

### Note

No changes were made to "practice" mode sessions.
