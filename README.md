# Selfme - Enterprise Resource Planning System

## 📋 Project Description

**Selfme** is a comprehensive Enterprise Resource Planning (ERP) system designed to streamline business operations across multiple departments. It provides integrated solutions for user management, financial operations, inventory control, employee management, and feedback tracking.

## 🎯 Purpose

Selfme enables organizations to:
- Manage users and employee information efficiently
- Handle financial operations including salary management, expense tracking, and payment processing
- Control inventory, orders, suppliers, and product requests
- Assign and track technical tasks
- Collect and manage customer feedback
- Process payments and maintain cart systems

## 🏗️ Project Structure

```
Selfme/
├── BackEnd/                 # Node.js Express Server
│   ├── Controllers/         # Business logic for different modules
│   ├── Model/              # MongoDB models and schemas
│   ├── Routes/             # API route definitions
│   ├── Uploads/            # File upload directory
│   ├── Item_images/        # Product images storage
│   ├── index.js            # Main server file
│   └── package.json        # Backend dependencies
│
├── FrontEnd/               # React + Vite Application
│   ├── src/
│   │   ├── Components/     # Reusable React components
│   │   ├── utils/          # Helper functions and utilities
│   │   ├── assets/         # Static assets
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── public/             # Public static files
│   └── package.json        # Frontend dependencies
│
└── README.md              # This file
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5.1.0)
- **Database**: MongoDB
- **ODM**: Mongoose (v8.17.2)
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt for password hashing
- **File Upload**: Multer
- **Utilities**: CORS, dotenv, uuid

### Frontend
- **Framework**: React (v19.1.1)
- **Build Tool**: Vite (v7.1.2)
- **Routing**: React Router DOM (v7.8.1)
- **HTTP Client**: Axios
- **Data Visualization**: Chart.js, Recharts
- **PDF Generation**: jsPDF
- **Icons**: React Icons
- **Validation**: Zod
- **UI Components**: React Slick Carousel

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. Navigate to BackEnd directory:
```bash
cd BackEnd
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your MongoDB connection string and other environment variables:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

4. Start the server:
```bash
npm start
# or for development with hot reload
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to FrontEnd directory:
```bash
cd FrontEnd
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns)

## 📡 API Endpoints Overview

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### User Management
- `GET /all-users` - Get all users
- `POST /all-users` - Create new user
- `PUT /all-users/:id` - Update user

### Finance Management
- `GET /api/finance/salary` - Get salary records
- `POST /api/finance/salary` - Create salary record
- `GET /api/finance/staff` - Get staff information
- `GET /api/finance/payments` - Get payments
- `GET /api/finance/expenses` - Get expenses

### Inventory Management
- `GET /products` - List all products
- `POST /products` - Create new product
- `GET /orders` - Get orders
- `POST /orders` - Create order
- `GET /suppliers` - Get suppliers
- `POST /suppliers` - Add supplier
- `GET /stockouts` - Get stock movements

### Employee & Tech Management
- `GET /employees` - Get employees
- `GET /api/tech/paidtasks` - Get paid tasks
- `GET /api/finance/jobassignings` - Get job assignments

### User Cart & Payment
- `GET /api/cart` - View cart
- `POST /api/cart` - Add to cart
- `POST /api/payments` - Process payment

### Feedback
- `GET /all-feedback` - Get all feedback
- `POST /api/feedback` - Submit feedback

## 📝 Available Scripts

### Backend
```bash
npm start    # Start server with nodemon
npm run dev  # Development mode
npm test     # Run tests (if configured)
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS enabled for secure cross-origin requests
- Input validation with Zod

## 📊 Key Modules

1. **User Module** - User registration, authentication, profile management
2. **Finance Module** - Salary, expenses, payments, financial status
3. **Inventory Module** - Products, orders, suppliers, stock management
4. **Admin & Supply Module** - Employee management, supplier control
5. **Tech Module** - Task assignment, job management, payment tracking
6. **Feedback Module** - Customer feedback collection and management

## 🤝 Contributing

Please follow the existing code structure and conventions when contributing. Make sure to:
- Test your changes locally
- Follow the existing naming conventions
- Update documentation as needed

## 📧 Support

For questions or issues, please contact the development team.

## 📄 License

ISC License

---

**Last Updated**: May 29, 2026
**Version**: 1.0.0
