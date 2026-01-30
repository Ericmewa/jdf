// // export default AdminLayout;
// import React, { useState, useEffect } from "react";
// import { Spin, Alert, Table, Tag, Menu } from "antd"; // ✅ Menu included
// import { CheckCircle, Clock, Users } from "lucide-react";

// import AdminDashboard from "../../pages/admin/AdminDashboard.jsx";
// import CreateUserDrawer from "../../pages/admin/createUserDrawer.jsx";
// import DashboardSummary from "../../pages/admin/dashboardSummary.jsx";
// // import AuditTrailViewer from "../../pages/admin/AuditTrailViewer.jsx";
// import Navbar from "../Navbar.jsx";
// import { useGetLogsQuery } from "../../api/logApi";
// import { useGetUsersQuery } from "../../api/userApi";
// import socket from "../../app/socket";
// import OnlineUsersTable from "../../pages/admin/OnlineUsersTable.jsx";
// import UserAuditTrailPage from "../../pages/admin/AuditTrailViewer.jsx";
// import SharedSidebar from "../common/SharedSidebar";

// const themeVars = {
//   light: {
//     "--bg-main": "#f4f6ff",
//     "--bg-sidebar": "#2B1C67",
//     "--bg-navbar": "#ffffff",
//     "--text-main": "#2B1C67",
//     "--sidebar-shadow": "rgba(0,0,0,0.15)",
//   },
//   dark: {
//     "--bg-main": "#181a1f",
//     "--bg-sidebar": "#1c143a",
//     "--bg-navbar": "#22252b",
//     "--text-main": "#ffffff",
//     "--sidebar-shadow": "rgba(255,255,255,0.15)",
//   },
// };
// const applyTheme = (mode) => {
//   Object.entries(themeVars[mode]).forEach(([key, value]) =>
//     document.documentElement.style.setProperty(key, value)
//   );
// };

// /* ADMIN LAYOUT */
// const AdminLayout = () => {
//   const [selectedKey, setSelectedKey] = useState("all users");
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [theme, setTheme] = useState("light");
//   const [onlineUserIds, setOnlineUserIds] = useState([]);

//   const menuItems = [
//     {
//       key: "all users",
//       label: "All users",
//       icon: <CheckCircle size={18} />,
//     },
//     { key: "auditlogs", label: "Audit Logs", icon: <Clock size={18} /> },
//     {
//       key: "onlineusers",
//       label: "Online Users",
//       icon: <Users size={18} />,
//     },
//   ];

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "rm",
//   });

//   applyTheme(theme);

//   const {
//     data: logs = [],
//     isLoading: logsLoading,
//     error: logsError,
//   } = useGetLogsQuery();

//   const {
//     data: users = [],
//     isLoading: usersLoading,
//     error: usersError,
//   } = useGetUsersQuery(undefined, {
//     pollingInterval: 5000,
//   });

//   console.log("Fetched Logs:", logs);
//   console.log("Fetched Users:", users);
//   useEffect(() => {
//     console.log("📡 AdminDashboard mounted");

//     if (!socket.connected) {
//       console.log("🔌 Connecting socket...");
//       socket.connect();
//     }

//     const currentUser = {
//       _id: localStorage.getItem("userId"),
//       name: localStorage.getItem("userName"),
//       email: localStorage.getItem("userEmail"),
//       role: localStorage.getItem("userRole"),
//     };

//     console.log("👤 Emitting user-online:", currentUser);

//     if (currentUser._id) {
//       socket.emit("user-online", currentUser);
//     }

//     const handleOnlineUsers = (usersArray) => {
//       console.log("👥 Online users received:", usersArray);
//       setOnlineUserIds(usersArray.map((u) => u._id));
//     };

//     socket.on("online-users", handleOnlineUsers);

//     return () => {
//       console.log("❌ AdminDashboard unmounted");
//       socket.off("online-users", handleOnlineUsers);
//     };
//   }, []);

//   console.log("Online User IDs:", onlineUserIds);

//   const renderContent = () => {
//     if (logsLoading || usersLoading)
//       return (
//         <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
//       );

//     if (logsError || usersError)
//       return (
//         <Alert
//           type="error"
//           message="Error loading data"
//           description="There was an error fetching logs or users."
//         />
//       );

//     switch (selectedKey) {
//       case "all users":
//         return <AdminDashboard />;
//       case "onlineusers":
//         return <OnlineUsersTable />;
//       case "auditlogs":
//         return <UserAuditTrailPage />;
//       default:
//         return <AdminDashboard />;
//     }
//   };

//   return (
//     <div
//       style={{ display: "flex", height: "100vh", background: "var(--bg-main)" }}
//     >
//       <SharedSidebar
//         selectedKey={selectedKey}
//         setSelectedKey={setSelectedKey}
//         collapsed={sidebarCollapsed}
//         toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
//         menuItems={menuItems}
//         title="Admin Dashboard"
//       />

//       <div
//         style={{
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           marginLeft: sidebarCollapsed ? 80 : 300,
//           transition: "margin-left 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
//           width: `calc(100% - ${sidebarCollapsed ? 80 : 300}px)`
//         }}
//       >
//         <Navbar
//           toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
//           theme={theme}
//           setTheme={setTheme}
//         />
//         <div
//           style={{
//             padding: 20,
//             flex: 1,
//             overflowY: "auto",
//             color: "var(--text-main)",
//           }}
//         >
//           {renderContent()}
//         </div>

//         <CreateUserDrawer
//           visible={drawerOpen}
//           onClose={() => setDrawerOpen(false)}
//           formData={formData}
//           setFormData={setFormData}
//           loading={false}
//           onCreate={() => {
//             console.log("FORM VALUES:", formData);
//             setFormData({ name: "", email: "", password: "", role: "rm" });
//             setDrawerOpen(false);
//           }}
//         />
//       </div>
//     </div>
//   );
// };

// export default AdminLayout;


import React, { useState } from "react";
import { Menu } from "antd";
import { BellOutlined, UserOutlined, MenuOutlined } from "@ant-design/icons";

import {
  ClipboardList,
  CheckCircle,
  Clock,
  Settings,
  Sun,
  Moon,
} from "lucide-react";

import UserTable from "../../pages/admin/UserTable";
import AdminDashboard from "../../pages/admin/AdminDashboard.jsx";
import CreateUserDrawer from "../../pages/admin/createUserDrawer.jsx";
import DashboardSummary from "../../pages/admin/dashboardSummary.jsx";
import LiveUsers from "../../pages/admin/LiveUsers.jsx";
import AuditLogsPage from "../../pages/admin/AuditLogsPage.jsx";
import Navbar from "../Navbar.jsx";

/* ---------------------------------------------------------------------- */
/*  GLOBAL THEME VARIABLES                                                */
/* ---------------------------------------------------------------------- */
const themeVars = {
  light: {
    "--bg-main": "#f4f6ff",
    "--bg-sidebar": "#2B1C67",
    "--bg-navbar": "#ffffff",
    "--text-main": "#2B1C67",
    "--sidebar-shadow": "rgba(0,0,0,0.15)",
  },
  dark: {
    "--bg-main": "#181a1f",
    "--bg-sidebar": "#1c143a",
    "--bg-navbar": "#22252b",
    "--text-main": "#ffffff",
    "--sidebar-shadow": "rgba(255,255,255,0.15)",
  },
};

/* Apply theme */
const applyTheme = (mode) => {
  const vars = themeVars[mode];
  Object.keys(vars).forEach((key) =>
    document.documentElement.style.setProperty(key, vars[key])
  );
};
const Sidebar = ({
  selectedKey,
  setSelectedKey,
  collapsed,
  toggleCollapse,
}) => {
  const handleClick = (e) => setSelectedKey(e.key);

  return (
    <div
      style={{
        width: collapsed ? 75 : 250,
        background: "var(--bg-sidebar)",
        color: "white",
        transition: "0.25s ease",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: `2px 0 10px var(--sidebar-shadow)`,
      }}
      className="sidebar"
    >
      {/* Logo/Header */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "25px 20px",
          fontSize: collapsed ? 26 : 22,
          fontWeight: "bold",
          textAlign: collapsed ? "center" : "left",
        }}
      >
        {collapsed ? "AD" : "Admin Dashboard"}
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleClick}
        style={{
          background: "transparent",
          borderRight: "none",
        }}
        inlineCollapsed={collapsed}
        items={[
          {
            key: "all users",
            label: "All users",
            icon: <CheckCircle size={18} />,
          },
          {
            key: "live users",
            label: "Live Users",
            icon: <UserOutlined />,
          },
          {
            key: "auditlogs",
            label: "Audit Logs",
            icon: <Clock size={18} />,
          },
        ]}
      />

      {/* Collapse Button */}
      <div style={{ marginTop: "auto", padding: 20 }}>
        <button
          onClick={toggleCollapse}
          style={{
            width: "100%",
            padding: "8px 0",
            borderRadius: 6,
            border: "none",
            background: "#fff",
            color: "var(--bg-sidebar)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {collapsed ? "Expand" : "Collapse"}
        </button>
      </div>
    </div>
  );
};

<Navbar />;

/* ---------------------------------------------------------------------- */
/*  MAIN LAYOUT — SAME CONTENT, ONLY STYLE UPGRADES                       */
/* ---------------------------------------------------------------------- */
const AdminLayout = () => {
  const [selectedKey, setSelectedKey] = useState("users");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "rm",
  });

  /* Apply theme immediately */
  applyTheme(theme);

  const renderContent = () => {
    switch (selectedKey) {
      // case "users":
      //   return <UserTable />;
      case "all users":
        return <AdminDashboard />;
      case "live users":
        return <LiveUsers />;
      case "auditlogs":
        return <AuditLogsPage />;
      case "rms":
        return (
          <div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
            >
              Create RM User
            </button>
          </div>
        );
      case "co checkers":
        return <h1 style={pageStyle}>CO Checkers</h1>;
      default:
        return <AdminDashboard />;
    }
  };

  const sidebarWidth = sidebarCollapsed ? 80 : 300;

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden", // Important: prevent whole page scroll
        background: "var(--bg-main)",
      }}
      className="main-layout"
    >
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }}>
        <Sidebar
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
          collapsed={sidebarCollapsed}
          toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* MAIN SECTION */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: sidebarWidth,
          height: "100vh",
          overflow: "hidden",
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
        }}
      >
        <Navbar
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={theme}
          setTheme={setTheme}
        />

        <div
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            color: "var(--text-main)",
            width: "100%",
          }}
        >
          {renderContent()}
        </div>

        {/* Drawer */}
        <CreateUserDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          formData={formData}
          setFormData={setFormData}
          loading={false}
          onCreate={() => {
            console.log("FORM VALUES:", formData);
            setFormData({ name: "", email: "", password: "", role: "rm" });
            setDrawerOpen(false);
          }}
        />
      </div>
    </div>
  );
};

const pageStyle = {
  fontSize: 28,
  fontWeight: "bold",
  color: "var(--text-main)",
};

export default AdminLayout;

