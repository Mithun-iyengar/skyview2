# Frontend Documentation

## Overview
The Skyline Airways frontend is a React 18/Vite single-page application that provides flight search, flight details, seat selection, booking, wallet payments, booking history, authentication, and basic admin flight management.

The UI is designed to work against the backend microservices through the API gateway at `/api` and uses local storage for cached flight and booking fallback data.

## Tech Stack
- React 18
- Vite
- React Router DOM
- JavaScript / JSX
- CSS modules and global styles
- Native `fetch` for most API calls
- Optional `axios` dependency present but not required for the active API flow

## Running Locally
From the workspace root:
```powershell
cd frontend
npm install
npm run dev
```

For production build:
```powershell
cd frontend
npm install
npm run build
```

To preview a production build:
```powershell
cd frontend
npm run preview
```

## Folder Structure
- `src/main.jsx`: React app bootstrap and Vite entry point
- `src/App.jsx`: application routes and shell layout
- `src/pages/`: route-level pages
- `src/pages/admin/`: admin login and flight creation pages
- `src/components/`: reusable UI components
- `src/components/admin/`: admin-specific components
- `src/components/flights/`: flight list, cards, seat map, and destination UI
- `src/utils/`: API wrappers, booking helpers, flight utilities, wallet helpers
- `src/styles/`: global styles and page-specific CSS

## Key Pages
- `Home`: landing page with featured flights and destinations
- `SearchFlights`: flight search and filter results
- `FlightDetails`: seat selection, passenger details, wallet payment approval, and booking confirmation flow
- `Reservations`: user-specific booking history and reservation status
- `Login`: user login page
- `Register`: user registration page
- `AdminLogin`: admin authentication page
- `AddFlight`: flight creation page for admin users

## API Integration
The frontend communicates with the backend mostly through the API gateway using the `/api` prefix.

Main API modules:
- `src/utils/apiService.js`: gateway-aware request wrapper with authentication headers and error handling
- `src/utils/bookingApi.js`: booking helpers, local booking persistence, and fallback logic
- `src/utils/flightData.js`: flight fetch, normalization, local cache, and admin flight sync
- `src/utils/walletApi.js`: wallet balance and payment endpoints

### Authentication
- JWT tokens are stored in `localStorage` or `sessionStorage`
- The app attaches `Authorization: Bearer <token>` to protected requests
- Unauthenticated or expired tokens trigger sign-in redirects
- User identity is derived from stored user id or decoded JWT payload

### Wallet and Booking Flow
- The active booking path is wallet payment from `FlightDetails.jsx`
- Selected seats and passenger details are validated before payment
- `walletApi.getBalance()` checks wallet funds
- `walletApi.deductMoney()` performs wallet deduction
- Successful wallet booking stores reservation data locally and updates the UI
- Booking history can fall back to local storage if backend fetch fails

## State Management
The frontend uses React built-in state and context rather than a global state library.
- `useState` for form values, loading flags, selection state, and booking state
- `useEffect` for data fetching, event listeners, and storage sync
- `useMemo` for filtering and derived values
- `useRef` for timer/cancellation guards
- `useCallback` for stable event handlers

## Error Handling
Frontend errors are surfaced through toast notifications and inline page messages.
- API errors are logged and converted to user-friendly text
- 401/unauthorized errors prompt sign-in redirection
- Wallet insufficient funds and payment failures show clear messages
- Booking validation errors are caught before backend submission

## Admin Notes
The frontend includes a small admin experience for creating flights.
- Admin screens are protected by session storage flags
- Admin login is separate from regular user login
- Created flights are available to the flight search experience once backend sync occurs

## Build Recommendation
- Keep the frontend dependency set minimal
- Remove unused `axios` dependencies if the project remains native fetch-based
- Keep route and component reuse consistent to prevent duplicate UI logic
