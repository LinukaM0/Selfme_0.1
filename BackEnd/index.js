// 4) Updated BackEnd/index.js
const express = require("express");
const mongoose = require("mongoose");

const authRouter = require("./Routes/AuthRoutes");
const cartRoutes = require("./Routes/UserRoutes/CartRoute");
const paymentRoutes = require("./Routes/UserRoutes/PaymentRoutes");
const itemRoute = require("./Routes/UserRoutes/itemCartRoutes");
const submitFeedbackRoute = require("./Routes/UserRoutes/SubmitFeedbackRoute"); 

// Import models to ensure they are registered
const Product = require("./Model/inventory_models/itemModel");
const Cart = require("./Model/UserModel/CartModel");
const Payment = require("./Model/UserModel/PaymentModel");
const SubmitFeedback = require("./Model/UserModel/SubmitFeedbackModel"); 
const Expense = require("./Model/FinanceManager/ExpenseModel");

//linuka
const salaryRouter = require("./Routes/FinanceManager/salaryRoutes");
const staffRouter = require("./Routes/FinanceManager/staffRoutes");
const jobAssigningRouter = require("./Routes/FinanceManager/jobAssigningRoutes");
const paymentRouter = require("./Routes/FinanceManager/PaymentRoutes");
const updateFinancialStatusRoute = require("./Routes/FinanceManager/updateFinancialStatusRoute");
const expenseRoutes = require("./Routes/FinanceManager/expenseRoutes");

//lahindu
const userRouter = require("./Routes/AdminandSupplyRoutes/userRoutes");
const allFeedbackRouter = require("./Routes/AdminandSupplyRoutes/AllFeedbackRoutes");
const allEmployeeRouter = require("./Routes/AdminandSupplyRoutes/AllEmployeeRoutes");
const viewSupplyAllRoute = require("./Routes/AdminandSupplyRoutes/ViewSupplyAllRoute");
const getSupplyAllRoute = require("./Routes/AdminandSupplyRoutes/GetSupplyAllRoute");

//sulakshi
const employeeRouter = require("./Routes/TechRoute/employeeRoutes");
//const assignmentRoutes = require("./Routes/TechRoute/assignmentRoutes");
const getPaidPaymentRoute = require("./Routes/TechRoute/GetPaisPaymentRoute");
const paidTaskRouter = require("./Routes/TechRoute/PaidRoute");

//hasaranga
const inventoryInvoiceRoutes = require("./Routes/item_routes/inventoryInvoiceRoutes");
const invoiceOrderRoutes = require("./Routes/item_routes/invoiceOrderRoutes");
const itemRoutes = require("./Routes/item_routes/ItemRoutes");
const productRequestRoutes = require("./Routes/item_routes/productRequestRoutes");
const supplierRouter = require("./Routes/item_routes/supplierRoutes");
const orderRoutes = require("./Routes/item_routes/orderRoutes");
const stockOutRoutes = require("./Routes/item_routes/stockOutRoutes");

const path = require("path");
const fs = require("fs");
const cors = require("cors");
const app = express();

// ------------------- MIDDLEWARE -------------------
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "Uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/auth", authRouter);
app.use("/api", cartRoutes);
app.use("/api", paymentRoutes);
app.use("/api", itemRoute);
app.use("/api/feedback", submitFeedbackRoute);
app.use("/api/finance/expenses", expenseRoutes);
app.use("/item_images", express.static(path.join(__dirname, "item_images")));
// Test route
app.get("/test", (req, res) => res.json({ message: "Server is working" }));
// Serve static files
app.use("/images", express.static(path.join(__dirname, "item_images")));
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));
// Serve static files from uploads folder
app.use("/Uploads", express.static(uploadDir));

// ------------------- ROUTES -------------------
app.use("/auth", authRouter);
//lahindu
app.use("/all-users", userRouter);
app.use("/all-feedback", allFeedbackRouter);
app.use("/all-employees", allEmployeeRouter);
app.use("/all-suppliers", viewSupplyAllRoute);
app.use("/all-productrequests", getSupplyAllRoute);

//sulakshi
app.use("/employees", employeeRouter);
//app.use("/assignments", assignmentRoutes);
app.use("/paid-payments", getPaidPaymentRoute);
app.use("/api/tech/paidtasks", paidTaskRouter);
app.use("/api/finance/jobassignings", jobAssigningRouter); // Updated to match frontend

//hasaranga
app.use("/api/inventory-invoices", inventoryInvoiceRoutes); // ✅ fixed route
app.use("/api/invoice-orders", invoiceOrderRoutes);
app.use("/products", itemRoutes);
app.use("/orders", orderRoutes);
app.use("/productRequests", productRequestRoutes);
app.use("/suppliers", supplierRouter);
app.use("/stockouts", stockOutRoutes);

//linuka
app.use("/api/finance", updateFinancialStatusRoute);
app.use("/api/finance/salary", salaryRouter);
app.use("/api/finance/staff", staffRouter);
app.use("/api/finance/job-assigning", jobAssigningRouter);
app.use("/api/finance/payments", paymentRouter);

// ------------------- DATABASE -------------------
mongoose
  .connect("mongodb+srv://adminSelfme:P40YIFy04Am8rnDe@cluster0.4bp3tta.mongodb.net/test12")
  .then(() => console.log("✅ Connected to MongoDB"))
  .then(() => {
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch((err) => console.log(err));