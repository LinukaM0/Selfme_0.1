# Selfme Backend - Server Documentation

## 📋 Overview

The Selfme Backend is a Node.js/Express.js REST API server that powers the enterprise resource planning system. It provides comprehensive endpoints for managing users, finances, inventory, employees, and more.

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | LTS | Runtime environment |
| Express.js | 5.1.0 | Web framework |
| MongoDB | Latest | Database |
| Mongoose | 8.17.2 | ODM/Schema validation |
| JWT | 9.0.2 | Authentication |
| bcrypt | 5.1.1 | Password hashing |
| Multer | 2.0.2 | File uploads |
| CORS | 2.8.5 | Cross-origin requests |

## 📁 Project Structure

```
BackEnd/
├── Controllers/                      # Business logic layer
│   ├── AuthController.js
│   ├── AdminandSupplyControllers/
│   │   ├── AllEmployeeController.js
│   │   ├── AllFeedbackController.js
│   │   ├── userController.js
│   │   └── ...
│   ├── FinanceManager/
│   │   ├── salaryController.js
│   │   ├── staffController.js
│   │   ├── expenseController.js
│   │   ├── jobAssigningController.js
│   │   ├── PaymentController.js
│   │   └── ...
│   ├── inventory_controllers/
│   │   ├── itemController.js
│   │   ├── orderController.js
│   │   ├── supplierController.js
│   │   ├── productRequestController.js
│   │   └── ...
│   ├── TechController/
│   │   ├── employeeController.js
│   │   ├── assignmentController.js
│   │   ├── PaidController.js
│   │   └── ...
│   └── UserController/
│       ├── CartController.js
│       ├── PaymentController.js
│       ├── SubmitFeedbackController.js
│       └── ...
│
├── Model/                            # Data schemas and models
│   ├── UserModel.js
│   ├── AdminandSupplyModel/
│   ├── FinanceManager/
│   ├── inventory_models/
│   ├── TechModel/
│   └── UserModel/
│
├── Routes/                           # API route definitions
│   ├── AuthRoutes.js
│   ├── AdminandSupplyRoutes/
│   ├── FinanceManager/
│   ├── item_routes/
│   ├── TechRoute/
│   └── UserRoutes/
│
├── Item_images/                      # Product image storage
├── Uploads/                          # General file uploads
├── index.js                          # Server entry point
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14 or higher
- MongoDB connection string
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

3. Start the server:
```bash
npm start
# or development mode with auto-reload
npm run dev
```

Server will be running on `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes
**Base URL**: `/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |
| GET | `/auth/verify` | Verify JWT token |

### User Management
**Base URL**: `/all-users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/all-users` | Get all users |
| GET | `/all-users/:id` | Get user by ID |
| POST | `/all-users` | Create new user |
| PUT | `/all-users/:id` | Update user |
| DELETE | `/all-users/:id` | Delete user |

### Finance Management
**Base URL**: `/api/finance`

#### Salary Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/salary` | Get all salary records |
| POST | `/api/finance/salary` | Create salary record |
| PUT | `/api/finance/salary/:id` | Update salary |
| DELETE | `/api/finance/salary/:id` | Delete salary record |

#### Staff Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/staff` | Get all staff |
| POST | `/api/finance/staff` | Add staff member |
| PUT | `/api/finance/staff/:id` | Update staff |
| DELETE | `/api/finance/staff/:id` | Remove staff |

#### Expense Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/expenses` | Get all expenses |
| POST | `/api/finance/expenses` | Create expense |
| PUT | `/api/finance/expenses/:id` | Update expense |
| DELETE | `/api/finance/expenses/:id` | Delete expense |

#### Payment Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/payments` | Get all payments |
| POST | `/api/finance/payments` | Create payment |
| PUT | `/api/finance/payments/:id` | Update payment |
| DELETE | `/api/finance/payments/:id` | Delete payment |

#### Job Assigning Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/job-assigning` | Get job assignments |
| POST | `/api/finance/job-assigning` | Create job assignment |
| PUT | `/api/finance/job-assigning/:id` | Update assignment |
| DELETE | `/api/finance/job-assigning/:id` | Cancel assignment |

#### Financial Status Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/finance/` | Get financial status |
| PUT | `/api/finance/` | Update financial status |

### Inventory Management
**Base URL**: `/api/inventory` or `/products`, `/orders`, etc.

#### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| POST | `/products` | Create product |
| PUT | `/products/:id` | Update product |
| DELETE | `/products/:id` | Delete product |

#### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get all orders |
| POST | `/orders` | Create order |
| PUT | `/orders/:id` | Update order |
| DELETE | `/orders/:id` | Delete order |

#### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | Get all suppliers |
| POST | `/suppliers` | Add supplier |
| PUT | `/suppliers/:id` | Update supplier |
| DELETE | `/suppliers/:id` | Delete supplier |

#### Product Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/productRequests` | Get product requests |
| POST | `/productRequests` | Create request |
| PUT | `/productRequests/:id` | Update request |
| DELETE | `/productRequests/:id` | Cancel request |

#### Stock Out
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stockouts` | Get stock movements |
| POST | `/stockouts` | Create stock movement |
| PUT | `/stockouts/:id` | Update movement |

#### Inventory Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory-invoices` | Get invoices |
| POST | `/api/inventory-invoices` | Create invoice |
| PUT | `/api/inventory-invoices/:id` | Update invoice |

#### Invoice Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoice-orders` | Get invoice orders |
| POST | `/api/invoice-orders` | Create invoice order |

### Admin & Supply Management
**Base URL**: `/all-*`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/all-employees` | Get all employees |
| GET | `/all-feedback` | Get all feedback |
| GET | `/all-suppliers` | Get all suppliers |
| GET | `/all-productrequests` | Get product requests |

### Employee & Tech Management
**Base URL**: `/employees`, `/api/tech`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees` | Get employees |
| POST | `/employees` | Add employee |
| PUT | `/employees/:id` | Update employee |
| GET | `/api/tech/paidtasks` | Get paid tasks |
| POST | `/api/tech/paidtasks` | Create paid task |
| GET | `/paid-payments` | Get paid payments |

### User Cart & Payment
**Base URL**: `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:id` | Update cart item |
| DELETE | `/api/cart/:id` | Remove from cart |
| POST | `/api/payments` | Process payment |
| GET | `/api/payments` | Get payment history |

### Feedback
**Base URL**: `/api/feedback`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feedback` | Get all feedback |
| POST | `/api/feedback` | Submit feedback |
| DELETE | `/api/feedback/:id` | Delete feedback |

### Static Files

| Route | Description |
|-------|-------------|
| `/images` | Product images |
| `/uploads` | Uploaded files |
| `/item_images` | Item images |

## 🔒 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Token is obtained by logging in via `/auth/login`

## 🔧 Development

### Running with Nodemon
The project uses nodemon for automatic server restart during development:

```bash
npm run dev
```

### Environment Variables

Create a `.env` file with:
```env
MONGODB_URI=<your_mongodb_connection_string>
PORT=5000
JWT_SECRET=<your_secret_key>
JWT_EXPIRE=7d
NODE_ENV=development
```

## 📝 Request/Response Examples

### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## 🐛 Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📊 Database Models

- User
- Product
- Order
- Salary
- Staff
- Payment
- Expense
- Employee
- Cart
- Feedback
- Supplier
- And more...

## 🚨 Important Notes

- MongoDB connection string is stored in environment variables
- Ensure all required fields are provided in POST requests
- File uploads use Multer middleware
- Images are stored in `Item_images` and `Uploads` directories
- JWT tokens expire after the configured duration

## 🤝 Contributing

Follow these guidelines when contributing:
1. Create models using Mongoose schemas
2. Organize controllers by module
3. Define routes in separate files
4. Use consistent error handling
5. Document new endpoints

## 📞 Support

For issues or questions, contact the development team or check the main project README.

---

**Server Port**: 5000
**Database**: MongoDB
**Last Updated**: May 29, 2026
**Version**: 1.0.0
