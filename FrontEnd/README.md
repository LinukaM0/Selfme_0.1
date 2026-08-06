# Selfme Frontend - Client Application

## 📋 Overview

The Selfme Frontend is a modern React application built with Vite that provides a comprehensive user interface for the enterprise resource planning system. It includes user-friendly dashboards, real-time data visualization, and seamless integration with the backend API.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.1.1 | UI framework |
| Vite | 7.1.2 | Build tool & dev server |
| React Router DOM | 7.8.1 | Client-side routing |
| Axios | 1.11.0 | HTTP client |
| Chart.js | 4.5.0 | Charts & graphs |
| Recharts | 3.2.1 | React charts library |
| jsPDF | 2.5.2 | PDF generation |
| React Icons | 5.5.0 | Icon library |
| Zod | 4.1.5 | Schema validation |
| React Slick | 0.31.0 | Carousel component |

## 📁 Project Structure

```
FrontEnd/
├── src/
│   ├── Components/              # Reusable React components
│   │   ├── Dashboard/
│   │   ├── Navigation/
│   │   ├── Forms/
│   │   ├── Tables/
│   │   └── ...
│   ├── utils/                   # Helper functions
│   │   ├── api.js              # API calls
│   │   ├── auth.js             # Authentication helpers
│   │   ├── validators.js       # Form validation
│   │   └── ...
│   ├── assets/                  # Images, logos, static files
│   ├── App.jsx                  # Root component
│   ├── App.css                  # Global styles
│   ├── index.css                # Base styles
│   └── main.jsx                 # Entry point
├── public/                       # Static public files
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── vite.config.js               # Vite configuration
├── eslint.config.js             # ESLint rules
├── package.json                 # Dependencies
├── README.md                     # This file
└── index.html                   # HTML template
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14 or higher
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Selfme
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

## 🎨 Key Features

### Dashboard
- Real-time data visualization
- Key performance indicators (KPIs)
- Interactive charts and graphs

### User Management
- User registration and authentication
- Profile management
- User role assignment

### Finance Management
- Salary tracking and management
- Expense tracking
- Payment processing
- Financial status reporting

### Inventory Management
- Product catalog
- Order management
- Supplier management
- Stock tracking
- Product requests

### Employee Management
- Employee directory
- Task assignment
- Job tracking

### Shopping Cart
- Add/remove items
- Inventory-based shopping
- Checkout process

### Feedback System
- Feedback submission
- Feedback history
- Review management

### Reports & Export
- Generate PDF reports
- Data export functionality
- Chart-based visualizations

## 🔗 API Integration

The frontend communicates with the backend API at:
- Development: `http://localhost:5000`
- Production: Configure in `.env` file

### API Client Setup

Located in `utils/api.js`:
```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

## 🔐 Authentication Flow

1. User logs in via login form
2. Backend returns JWT token
3. Token stored in localStorage
4. Token included in all subsequent API requests
5. Automatic logout on token expiration

## 📊 Data Visualization

- **Chart.js**: Bar charts, line charts, pie charts
- **Recharts**: Interactive React charts
- **PDF Generation**: jsPDF for report generation
- **Tables**: Dynamic data tables with sorting and filtering

## 🎨 Styling

- Global styles in `index.css` and `App.css`
- Component-scoped CSS or CSS-in-JS
- Responsive design for mobile and desktop
- **Note**: Project uses a purple theme with custom colors

## 🧩 Component Architecture

### Common Components
- Navigation/Sidebar
- Header
- Tables
- Forms
- Modals
- Loading states
- Error boundaries

### Page Components
- Dashboard
- User Management
- Finance Management
- Inventory Management
- Employee Management
- Reports

## 🚀 Development Workflow

### Component Creation
1. Create component in `Components/` directory
2. Use consistent naming conventions (PascalCase)
3. Add prop validation with TypeScript comments or Zod
4. Export from index.js

### API Integration
1. Add API calls in `utils/api.js`
2. Use Axios for HTTP requests
3. Handle errors gracefully
4. Show loading states

### Form Validation
1. Use Zod for schema validation
2. Validate on submit
3. Show error messages
4. Use react-hook-form for complex forms

## 🔧 Build Configuration

### Vite Configuration (`vite.config.js`)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

### ESLint Configuration
Enforces code quality standards:
```bash
npm run lint
```

## 🌐 Environment Variables

Create `.env` file with:
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Selfme
VITE_JWT_EXPIRY=7d
```

## 📦 Deployment

### Build for Production
```bash
npm run build
```

This generates an optimized `dist/` folder ready for deployment.

### Deploy to
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🐛 Debugging

### Browser DevTools
- React Developer Tools extension
- Redux DevTools (if using Redux)
- Network tab for API debugging

### Console Logging
```javascript
console.log('Debug info', data);
```

### VSCode Extensions
- ES7+ React/Redux/React-Native snippets
- Thunder Client or REST Client for API testing

## 🎨 UI/UX Guidelines

- Consistent color palette
- Responsive layout (mobile-first)
- Accessible component design
- Loading and error states
- User feedback messages
- Tooltips and help text

## 🔄 State Management

Options for managing application state:
- React Context API (built-in)
- Redux (if needed)
- Zustand
- Recoil

## 🤝 Contributing

1. Create feature branch
2. Follow code style conventions
3. Test components thoroughly
4. Submit pull request
5. Get code review

## 📝 Code Style

### Naming Conventions
- Components: PascalCase (`UserDashboard.jsx`)
- Functions: camelCase (`getUserData()`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINT`)
- Files: Match component name or use kebab-case

### Component Example
```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const UserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await API.get('/all-users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      {/* Component JSX */}
    </div>
  );
};

export default UserDashboard;
```

## 🚨 Important Notes

- Always use VITE_* prefix for environment variables
- JWT token stored in localStorage
- API base URL configurable via environment
- Mobile responsive design required
- Cross-browser compatibility tested

## 📚 Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Axios Documentation](https://axios-http.com)
- [React Router Guide](https://reactrouter.com)

## 🎯 Performance Optimization

- Code splitting with React.lazy()
- Image optimization
- CSS minification (automatic with Vite build)
- Tree shaking unused code
- Lazy loading components

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🔗 API Endpoints Used

See Backend README for complete API documentation. Common endpoints:
- `/auth/login` - User authentication
- `/all-users` - User management
- `/api/finance/salary` - Salary management
- `/api/inventory-*` - Inventory management
- `/products` - Product listing
- `/api/cart` - Shopping cart

## 📞 Support

For issues or questions, refer to the main project README or contact the development team.

---

**Build Tool**: Vite
**Framework**: React
**Last Updated**: May 29, 2026
**Version**: 0.1.0
