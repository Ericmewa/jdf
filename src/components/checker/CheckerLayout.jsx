// export default CheckerLayout;
import React, { useState } from "react";
import { Menu } from "antd";
import { Inbox, CheckCircle, BarChart2 } from "lucide-react";
import { useSelector } from "react-redux";

import Navbar from "../Navbar";

// Pages
import AllChecklists from "../../pages/checker/allChecklists";
import CompletedChecklists from "../../pages/checker/Completed";
import Reportss from "../../pages/creator/Reports";

import SharedSidebar from "../common/SharedSidebar";
import Deferrals from "../../pages/checker/Deferral";

const CheckerLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const userId = user?.id;

  const [selectedKey, setSelectedKey] = useState("myQueue");
  const [collapsed, setCollapsed] = useState(false);

  const sidebarWidth = collapsed ? 80 : 300;

  const menuItems = [
    {
      key: "myQueue",
      icon: <Inbox size={18} />,
      label: "My Queue",
    },
    {
      key: "completed",
      icon: <CheckCircle size={18} />,
      label: "Completed",
    },

    {
      key: "deferrals",
      icon: <BarChart2 size={18} />,
      label: "Deferrals",
    },
    {
      key: "reports",
      icon: <BarChart2 size={18} />,
      label: "Reports",
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case "myQueue":
        return <AllChecklists userId={userId} />;
      case "completed":
        return <CompletedChecklists userId={userId} />;

      case "deferrals":
        return <Deferrals userId={userId} />;
      case "reports":
        return <Reportss />;

      default:
        return <AllChecklists userId={userId} />;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Shared Sidebar */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }}>
        <SharedSidebar
          selectedKey={selectedKey}
          setSelectedKey={setSelectedKey}
          collapsed={collapsed}
          toggleCollapse={() => setCollapsed(!collapsed)}
          menuItems={menuItems}
          title="CO Checker"
        />
      </div>

      {/* MAIN AREA */}
      <div
        style={{
          marginLeft: sidebarWidth,
          flex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#f0f2f5",
          overflow: "hidden",
          width: `calc(100% - ${sidebarWidth}px)`,
          transition: "all 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
        }}
      >
        <Navbar />

        {/* CONTENT (SCROLLS) */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            width: "100%",
          }}
        >
          {renderContent()}
        </div>

        {/* FOOTER (STATIC) */}
        <footer
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            padding: "16px 24px",
            textAlign: "center",
            fontSize: 12,
            color: "#6b7280",
            flexShrink: 0,
            width: "100%",
          }}
        >
          © {new Date().getFullYear()} NCBA Bank PLC. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

export default CheckerLayout;
