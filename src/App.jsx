// // src/App.jsx
// import "antd/dist/reset.css";
// import React from "react";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import { ConfigProvider } from "antd";

// // 🔌 Socket Provider
// import { SocketProvider } from "./components/SocketProvider";
// import SessionTimeout from "./components/common/SessionTimeout";

// // Pages
// import RegisterPage from "./pages/RegisterPage";
// import LoginPage from "./pages/LoginPage";
// import ProtectedRoute from "./components/ProtectedRoute";

// // Layouts
// import MainLayout from "./components/creator/COLayout";
// import CheckerLayout from "./components/checker/CheckerLayout";
// import AdminLayout from "./components/admin/AdminLayout";
// import ApproverLayout from "./components/approver/ApproverLayout";
// import RmLayout from "./components/rm/RmLayout";

// // Styles
// import "./App.css";

// const App = () => {
//   const { user } = useSelector((state) => state.auth);
//   const userId = user?.id;

//   return (
//     <ConfigProvider
//       theme={{
//         token: {
//           colorPrimary: "#1890ff",
//         },
//       }}
//     >
//       {/* 🔌 SOCKET PROVIDER WRAPS ENTIRE APP */}
//       <SocketProvider userId={userId}>
//         {/* Enforce 15-minute Session Timeout */}
//         <SessionTimeout timeoutDuration={15 * 60 * 1000} />

//         <Routes>
//           {/* PUBLIC ROUTES */}
//           <Route path="/" element={<Navigate to="/login" />} />
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />

//           {/* CO-CREATOR */}
//           <Route
//             path="/cocreator/*"
//             element={
//               <ProtectedRoute>
//                 <MainLayout />
//               </ProtectedRoute>
//             }
//           />

//           {/* CO-CHECKER */}
//           <Route
//             path="/cochecker/*"
//             element={
//               <ProtectedRoute>
//                 <CheckerLayout />
//               </ProtectedRoute>
//             }
//           />

//           {/* ADMIN */}
//           <Route
//             path="/admin/*"
//             element={
//               <ProtectedRoute>
//                 <AdminLayout />
//               </ProtectedRoute>
//             }
//           />

//           {/* APPROVER */}
//           <Route
//             path="/approver/*"
//             element={
//               <ProtectedRoute>
//                 <ApproverLayout userId={userId} />
//               </ProtectedRoute>
//             }
//           />

//           {/* RM */}
//           <Route
//             path="/rm/*"
//             element={
//               <ProtectedRoute>
//                 <RmLayout userId={userId} />
//               </ProtectedRoute>
//             }
//           />

//           {/* CATCH-ALL */}
//           <Route path="*" element={<Navigate to="/login" />} />
//         </Routes>
//       </SocketProvider>
//     </ConfigProvider>
//   );
// };

// export default App

import React, { useEffect } from "react";
import "antd/dist/reset.css";

import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import socketService from "./service/socketService";

// Pages
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

// Layouts
import MainLayout from "./components/creator/COLayout";
import CheckerLayout from "./components/checker/CheckerLayout";
import AdminLayout from "./components/admin/AdminLayout";
import RmLayout from "./components/rm/RmLayout";
import ApproverLayout from "./components/approver/ApproverLayout"; // Add this import

// Styles
import "./App.css";

const App = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  // Connect socket when user is logged in
  useEffect(() => {
    if (user) {
      console.log("👤 User logged in, connecting socket:", user);
      socketService.connect(user);

      // Emit user online status immediately if already connected,
      // or it will happen automatically in socketService on 'connect' event
      socketService.emitUserOnline(user);

      // Emit activity every 30 seconds
      const activityInterval = setInterval(() => {
        const userId = user.id || user._id;
        socketService.emitUserActivity(userId);
      }, 30000);

      return () => {
        console.log("🔌 Cleaning up socket connection");
        clearInterval(activityInterval);
        socketService.disconnect();
      };
    } else {
      console.log("👤 No user, disconnecting socket");
      socketService.disconnect();
    }
  }, [user]);

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* PROTECTED ROUTES */}

      {/* CO-CREATOR ROUTES */}
      <Route
        path="/cocreator/*"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      />

      {/* CHECKER ROUTES */}
      <Route
        path="/cochecker/*"
        element={
          <ProtectedRoute>
            <CheckerLayout />
          </ProtectedRoute>
        }
      />

      {/* ADMIN ROUTES */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      />

      {/* RELATIONSHIP MANAGER ROUTES */}
      <Route
        path="/rm/*"
        element={
          <ProtectedRoute>
            <RmLayout userId={userId} />
          </ProtectedRoute>
        }
      />

      {/* APPROVER ROUTES - NEW ADDITION */}
      <Route
        path="/approver/*"
        element={
          <ProtectedRoute>
            <ApproverLayout userId={userId} />
          </ProtectedRoute>
        }
      />

      {/* CATCH-ALL */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;