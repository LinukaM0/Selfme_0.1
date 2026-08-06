// 9) Updated FrontEnd/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
//dasunika
import Home from "./Components/UserManager/Home";
import Login from "./Components/Auth/Login";
import Signup from "./Components/Auth/Signup";
import UserDashboard from "./Components/UserManager/UserDashboard";
import SubmitFeedback from "./Components/UserManager/SubmitFeedback"; 
import ViewFeedback from "./Components/UserManager/ViewFeedback";

//lahindu
import AdminPanel from "./Components/AdminPanel/Admin";
import AllUser from "./Components/AdminPanel/AllUser/AllUser";
import AllFeedback from "./Components/AdminPanel/AllFeedback/AllFeedback";
import AllEmployee from "./Components/AdminPanel/AllEmployee/AllEmployee";
import ViewSupplyAll from "./Components/AdminPanel/VeiwSupplyAll/ViewSupplyAll";
import GetSupplyAll from "./Components/AdminPanel/GetSupplyAll/GetSupplyAll";
import AllProductFSuppli from "./Components/AdminPanel/AllProductFSuppli/AllProductFSuppli";

//linuka
import FinanceManager from "./Components/FinanceManager/FinanceManager";


//sulakshi
import TechnicianDashboard from "./Components/TechnicianDashboard/TechnicianDashboard";
import RegisterEmployee from "./Components/TechnicianDashboard/RegisterEmployee";
import RegisteredEmployees from "./Components/TechnicianDashboard/RegisteredEmployees";
import AssignedTasks from "./Components/TechnicianDashboard/AssignedTasks";
import CompletedTasks from "./Components/TechnicianDashboard/CompletedTasks";
import PendingTasks from './Components/TechnicianDashboard/PendingTask';
import FullCompletedTask from './Components/TechnicianDashboard/FullCompletedTask';


//hasas
import InventoryManage from "./Components/InventoryMange/InventoryMange";
import InventoryManagementHome from "./components/Inventory_Management/Inventory_Management_Home/Inventory_Management_Home";
import Add_Items from "./components/Inventory_Management/Add_Items/Add_Items";
import View_All_Items from "./components/Inventory_Management/View_All_Items/View_All_Items";
import Update_Items from "./components/Inventory_Management/Update_Items/Update_Items";
import View_Stock_Levels from "./components/Inventory_Management/View_Stock_levels/View_Stock_levels";
import Re_Order from "./components/Inventory_Management/Re_Order/Re_Order";
import Product_Request from "./components/Inventory_Management/Product_Request/Product_Request";
import Product_Request_Status from "./components/Inventory_Management/Product_Request_Status/Product_Request_Status";
import Inevntory_Damaged_Return from "./components/Inventory_Management/Inevntory_Damaged_Return/Inevntory_Damaged_Return";
import Add_Suppliers from "./components/Inventory_Management/Supplier/Supplier";
import View_Suppliers from "./components/Inventory_Management/View_Suppliers/View_Suppliers";

import Stock_Outs from "./components/Inventory_Management/Stock_Outs/Stock_Outs";
import Stock_Outs_History from "./components/Inventory_Management/Stock_Out_History/Stock_Out_History";
import Customer_Orders from "./Components/Inventory_Management/Customer_Orders/Customer_Orders";

import { isAuthenticated } from "./utils/auth";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* dasunika */}
        <Route
          path="/dashboard"
          element={isAuthenticated() ? <UserDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/feedback"
          element={isAuthenticated() ? <SubmitFeedback /> : <Navigate to="/login" />}
        />
        <Route
          path="/feedback/view"
          element={isAuthenticated() ? <ViewFeedback /> : <Navigate to="/login" />}
        />
        {/* hasa */}
        <Route
          path="/InventoryMange"
          element={isAuthenticated() ? <InventoryManage /> : <Navigate to="/login" />}
        />
        <Route
          path="/inventory"
          element={isAuthenticated() ? <InventoryManagementHome /> : <Navigate to="/login" />}
        />
        <Route
          path="/addItems"
          element={isAuthenticated() ? <Add_Items /> : <Navigate to="/login" />}
        />
        <Route
          path="/viewAllItems"
          element={isAuthenticated() ? <View_All_Items /> : <Navigate to="/login" />}
        />
        <Route
          path="/updateItem/:id"
          element={isAuthenticated() ? <Update_Items /> : <Navigate to="/login" />}
        />
        <Route
          path="/stocklevels"
          element={isAuthenticated() ? <View_Stock_Levels /> : <Navigate to="/login" />}
        />
        <Route
          path="/reorderlevels"
          element={isAuthenticated() ? <Re_Order /> : <Navigate to="/login" />}
        />
        <Route
          path="/product_request"
          element={isAuthenticated() ? <Product_Request /> : <Navigate to="/login" />}
        />
        <Route
          path="/product_status"
          element={isAuthenticated() ? <Product_Request_Status /> : <Navigate to="/login" />}
        />
        <Route
          path="/damage_return_add"
          element={isAuthenticated() ? <Inevntory_Damaged_Return /> : <Navigate to="/login" />}
        />
       
        <Route
          path="/material_outgoings"
          element={isAuthenticated() ? <Stock_Outs /> : <Navigate to="/login" />}
        />
        <Route
          path="/material_outgoings_history"
          element={isAuthenticated() ? <Stock_Outs_History /> : <Navigate to="/login" />}
        />
        <Route
          path="/addSupplier"
          element={isAuthenticated() ? <Add_Suppliers /> : <Navigate to="/login" />}
        />
        <Route
          path="/viewSuppliers"
          element={isAuthenticated() ? <View_Suppliers /> : <Navigate to="/login" />}
        />
        <Route
          path="/material_orders"
          element={isAuthenticated() ? <Customer_Orders /> : <Navigate to="/login" />}
        />

        {/* lahindu */}
        <Route
          path="/mainAdminhome"
          element={isAuthenticated() ? <AdminPanel /> : <Navigate to="/login" />}
        />
        <Route
          path="/AllUsers"
          element={isAuthenticated() ? <AllUser /> : <Navigate to="/login" />}
        />
        <Route
          path="/AllFeedback"
          element={isAuthenticated() ? <AllFeedback /> : <Navigate to="/login" />}
        />
        <Route
          path="/AllEmployees"
          element={isAuthenticated() ? <AllEmployee /> : <Navigate to="/login" />}
        />
        <Route
          path="/AllProducts"
          element={isAuthenticated() ? <AllProductFSuppli /> : <Navigate to="/login" />}
        />
        <Route
          path="/ViewSupplyAll"
          element={isAuthenticated() ? <ViewSupplyAll /> : <Navigate to="/login" />}
        />
        <Route
          path="/GetSupplyAll"
          element={isAuthenticated() ? <GetSupplyAll /> : <Navigate to="/login" />}
        />
        {/* linuka */}
        <Route
          path="/FinanceManager"
          element={isAuthenticated() ? <FinanceManager /> : <Navigate to="/login" />}
        />
        {/* sulakshi */}
        <Route
          path="/register-employee"
          element={isAuthenticated() ? <RegisterEmployee /> : <Navigate to="/login" />}
        />
        <Route
          path="/employees"
          element={isAuthenticated() ? <RegisteredEmployees /> : <Navigate to="/login" />}
        />
        <Route
          path="/assigned-tasks"
          element={isAuthenticated() ? <AssignedTasks /> : <Navigate to="/login" />}
        />
        <Route
          path="/completed-tasks"
          element={isAuthenticated() ? <CompletedTasks /> : <Navigate to="/login" />}
        />
        <Route
          path="/technicianDashboard"
          element={isAuthenticated() ? <TechnicianDashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/pending-tasks"
          element={isAuthenticated() ? <PendingTasks /> : <Navigate to="/login" />}
        />
        <Route
          path="/full-completed-tasks"
          element={isAuthenticated() ? <FullCompletedTask /> : <Navigate to="/login" />}
        />

        {/* dasunika */}
        <Route
          path="/"
          element={isAuthenticated() ? <Home /> : <Navigate to="/login" />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;