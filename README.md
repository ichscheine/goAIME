# goAIME - Math Competition Practice

goAIME is a web application for practicing math competition problems from various sources like AMC and AIME. It features a realistic competition mode, practice mode, and progress tracking.

## Features

- Practice with real math competition problems
- Competition mode to simulate real test conditions
- Track progress over time with detailed analytics
- Personalized problem recommendations
- Responsive UI for all devices

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 14+
- MongoDB
- Conda (recommended for environment management)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/goAIME.git
   cd goAIME
   ```

2. Set up the backend environment:
   ```bash
   conda env create -f environment.yaml
   conda activate goAIME
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Create a `.env` file in the project root with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=goaime
   SECRET_KEY=your_secret_key
   JWT_SECRET_KEY=your_jwt_secret_key
   ```

### Running the Application

1. Start the backend server:
   ```bash
   ./start_backend.sh
   ```

2. Start the frontend development server:
   ```bash
   ./start_frontend.sh
   ```

3. Access the application at http://localhost:3000

## Management Commands

goAIME includes a set of management commands for maintenance and administration tasks:

```bash
# View available commands
./manage.sh help

# Session management commands
./manage.sh session standardize      # Standardize session modes
./manage.sh session check <username> # Check user sessions
./manage.sh session fix_stats        # Fix user stats

# Diagnostic commands
./manage.sh diagnostic db_state      # Check database state
./manage.sh diagnostic user_stats <username> # Check user stats
```

For more information, see the [Management Commands Documentation](backend/management/README.md).

## Maintenance

For system maintenance, use the maintenance script:

```bash
# View available maintenance tasks
./maintenance.sh

# Run specific maintenance tasks
./maintenance.sh standardize-modes
./maintenance.sh fix-stats
./maintenance.sh check-db

# Run all maintenance tasks
./maintenance.sh run-all
```

## Development

### Project Structure

- `backend/` - Flask backend API
  - `routes/` - API endpoints
  - `services/` - Business logic
  - `models/` - Data models
  - `utils/` - Utility functions
  - `management/` - Admin commands
- `frontend/` - React frontend
  - `src/` - Source code
  - `public/` - Static assets
