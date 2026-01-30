import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import {
  CheckCircle,
  Inbox,
  BarChart2,
  Clock,
  FileText,
  ListChecks,
} from "lucide-react";

// Import your RM components
import MyQueue from "../../pages/rm/MyQueue";
import Completed from "../../pages/rm/Completed";
import ReportsPage from "../../pages/rm/Reports";
import Navbar from "../Navbar";
import SharedSidebar from "../common/SharedSidebar";

// Import Deferral Components
import DeferralForm from "../../pages/deferrals/DeferralForm";
import DeferralPending from "../../pages/deferrals/DeferralPending";
import Reports from "../../pages/creator/Reports";

const RmLayout = ({ userId, rmId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("myqueue");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Update selectedKey based on current location
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/deferrals')) {
      setSelectedKey('deferral');
    } else if (path.includes('/completed')) {
      setSelectedKey('completed');
    } else if (path.includes('/reports')) {
      setSelectedKey('reports');
    } else if (path.includes('/myqueue') || path === '/rm' || path === '/rm/') {
      setSelectedKey('myqueue');
    }
  }, [location.pathname]);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

  const menuItems = [
    {
      key: "myqueue",
      label: "My Queue",
      icon: <Inbox size={18} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "completed",
      label: "Completed",
      icon: <CheckCircle size={18} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "deferral",
      label: "Deferrals",
      icon: <Clock size={16} style={{ color: "#e5e7eb" }} />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart2 size={18} style={{ color: "#e5e7eb" }} />,
    },
  ];

  const handleClick = (e) => {
    console.log("Menu clicked:", e.key);

    setSelectedKey(e.key);

    // Handle deferral route
    if (e.key === "deferral") {
      navigate("/rm/deferrals/pending");
      return;
    }

    navigate(`/rm/${e.key}`);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "#f0f2f5",
      }}
    >
      <SharedSidebar
        selectedKey={selectedKey}
        setSelectedKey={setSelectedKey}
        onMenuItemClick={handleClick}
        collapsed={sidebarCollapsed}
        toggleCollapse={toggleSidebar}
        menuItems={menuItems}
        title="RM Dashboard"
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: sidebarCollapsed ? 80 : 300,
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
          width: `calc(100% - ${sidebarCollapsed ? 80 : 300}px)`,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        <div
          style={{
            padding: "24px",
            flex: 1,
            overflowY: "auto",
            background: "#f0f2f5",
          }}
        >
          <Routes>
            {/* Main RM Routes */}
            <Route
              path="/"
              element={<MyQueue userId={userId || "rm_current"} />}
            />
            <Route
              path="/myqueue"
              element={<MyQueue userId={userId || "rm_current"} />}
            />
            <Route
              path="/completed"
              element={<Completed userId={userId || "rm_current"} />}
            />
            <Route
              path="/reports"
              element={<Reports userId={userId || "rm_current"} />}
            />

            {/* Deferral Routes */}
            <Route path="/deferrals">
              <Route
                path="request"
                element={<DeferralForm userId={userId || "rm_current"} />}
              />
              <Route
                path="pending"
                element={<DeferralPending userId={userId || "rm_current"} />}
              />
            </Route>
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default RmLayout;
