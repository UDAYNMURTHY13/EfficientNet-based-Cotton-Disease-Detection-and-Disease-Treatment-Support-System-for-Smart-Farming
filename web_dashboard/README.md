# React Web Dashboard Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Git
- Modern web browser

## Installation Steps

### 1. Install Node.js
Download from https://nodejs.org/ (LTS version recommended)

### 2. Create React App
```bash
npx create-react-app web_dashboard
cd web_dashboard
```

### 3. Copy Project Files
```bash
# Copy src files to your project
# Copy package.json (merge dependencies)
# Install additional packages
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Configure Environment Variables
Create `.env` file in project root:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_JWT_EXPIRY=3600
```

### 6. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

## Project Structure

```
src/
├── App.jsx                  # Main app component
├── index.jsx               # Entry point
├── components/
│   ├── Layout.jsx          # Main layout
│   ├── Navbar.jsx          # Top navigation
│   └── Sidebar.jsx         # Side navigation
├── pages/
│   ├── LoginPage.jsx       # Login page
│   ├── DashboardPage.jsx   # Main dashboard
│   ├── CasesPage.jsx       # Cases list
│   ├── AnalyticsPage.jsx   # Analytics
│   ├── VerificationPage.jsx# Verification panel
│   ├── UsersPage.jsx       # User management
│   └── SettingsPage.jsx    # Settings
├── services/
│   └── api.js              # API integration
├── context/
│   ├── AuthContext.jsx     # Auth state
│   └── DataContext.jsx     # Data state
├── hooks/
│   └── (custom hooks)
├── styles/
│   ├── global.css          # Global styles
│   ├── layout.css          # Layout styles
│   ├── navbar.css          # Navbar styles
│   ├── sidebar.css         # Sidebar styles
│   ├── pages.css           # Pages styles
│   └── login.css           # Login styles
└── utils/
    └── (utility functions)
```

## Key Features

### 1. Authentication
- JWT-based login
- Token refresh mechanism
- Protected routes
- Auto logout on token expiry

### 2. Dashboard
- Real-time statistics
- Disease case overview
- Recent activity feed
- Quick action buttons

### 3. Case Management
- View all disease cases
- Filter and sort options
- Detailed case view
- Action buttons

### 4. Expert Verification
- Review flagged predictions
- Provide expert feedback
- Approve/Reject cases
- Real-time updates

### 5. Analytics
- Disease distribution charts
- Regional statistics
- Trend analysis
- Export functionality

### 6. User Management
- Create/edit/delete users
- Role assignment
- Activity tracking
- Bulk operations

## Configuration

### API Configuration
Edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### Theme Configuration
Edit CSS variables in `src/styles/global.css`:
```css
:root {
  --primary-color: #2e7d32;
  --accent-color: #ffa726;
  /* ... */
}
```

## Development

### Start Dev Server
```bash
npm start
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## Building & Deployment

### Production Build
```bash
npm run build
```

Output will be in `build/` directory.

### Serve Production Build Locally
```bash
npm install -g serve
serve -s build
```

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build"]
```

Build and run:
```bash
docker build -t cotton-dashboard .
docker run -p 3000:3000 cotton-dashboard
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

## API Integration

### Authentication
```javascript
// Login
const response = await apiService.login({ email, password });

// Logout
await apiService.logout();

// Refresh token
await apiService.refreshToken();
```

### Cases Management
```javascript
// Get all cases
const cases = await apiService.getAllCases({ filter, page, pageSize });

// Get case details
const caseDetails = await apiService.getCaseDetails(caseId);

// Verify case
await apiService.verifyCases(caseId, { verified: true, approved: true });

// Add feedback
await apiService.addFeedback(caseId, { feedback: 'text' });
```

### Analytics
```javascript
// Disease distribution
const diseases = await apiService.getDiseaseDistribution();

// Regional stats
const regions = await apiService.getRegionalStats();

// Trends
const trends = await apiService.getTrends('week');
```

## Performance Optimization

1. **Code Splitting**
   - Use React.lazy() for route-based splitting
   - Dynamic imports for large components

2. **Caching**
   - Cache API responses with React Query
   - Use localStorage for non-sensitive data
   - Implement service workers

3. **Bundle Optimization**
   - Remove unused dependencies
   - Minify CSS and JavaScript
   - Compress images
   - Tree shaking

4. **Runtime Performance**
   - Use React.memo for pure components
   - Implement useCallback for callbacks
   - Use useMemo for expensive computations
   - Avoid inline objects and functions

## Security Best Practices

1. **Authentication & Authorization**
   - Secure token storage
   - HTTPS only in production
   - Implement CSRF protection
   - Role-based access control

2. **Data Protection**
   - Encrypt sensitive data
   - Sanitize user inputs
   - Validate on server-side
   - Implement rate limiting

3. **Third-party Dependencies**
   - Keep dependencies updated
   - Audit for vulnerabilities
   - Use npm audit regularly
   - Pin versions when necessary

4. **Error Handling**
   - Implement error boundaries
   - Log errors securely
   - Show user-friendly messages
   - Avoid exposing sensitive info

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API server is running
   - Verify API URL in .env
   - Check CORS headers
   - Test with curl/Postman

2. **Authentication Issues**
   - Clear localStorage
   - Check token expiry
   - Verify refresh token logic
   - Check backend auth implementation

3. **Build Errors**
   - Delete node_modules: `rm -rf node_modules`
   - Clear npm cache: `npm cache clean --force`
   - Reinstall: `npm install`

4. **Performance Issues**
   - Use React DevTools Profiler
   - Check bundle size: `npm run build`
   - Analyze with Webpack Bundle Analyzer
   - Optimize images and assets

## Testing

### Unit Tests
```bash
npm test
```

### E2E Tests (with Cypress)
```bash
npm install --save-dev cypress
npx cypress open
```

### Performance Testing
```bash
npm run build
npm run analyze
```

## CI/CD Setup

### GitHub Actions
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/
```

## Deployment Checklist

- [ ] Update version number
- [ ] Configure production API URL
- [ ] Set up environment variables
- [ ] Test all features
- [ ] Run security audit
- [ ] Optimize bundle size
- [ ] Test cross-browser compatibility
- [ ] Set up monitoring/analytics
- [ ] Configure CDN
- [ ] Set up backup & disaster recovery
- [ ] Create deployment documentation

## Monitoring & Analytics

### Google Analytics
```javascript
import ReactGA from 'react-ga4';

ReactGA.initialize('GA_MEASUREMENT_ID');
```

### Sentry Error Tracking
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({ dsn: 'YOUR_DSN' });
```

## Support & Documentation

- React: https://react.dev
- React Router: https://reactrouter.com
- Axios: https://axios-http.com
- npm: https://docs.npmjs.com

## Next Steps

1. Implement authentication
2. Connect to API backend
3. Add real-time updates (WebSocket)
4. Implement analytics dashboard
5. Add export functionality
6. Set up CI/CD pipeline
7. Deploy to production
8. Monitor and optimize
