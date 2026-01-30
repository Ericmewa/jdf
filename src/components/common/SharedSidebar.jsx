import React from "react";
import { Menu } from "antd";
import ncbabanklogo from "../../assets/ncbabanklogo.png";

const SIDEBAR_BG = "#2B1C67";
const BORDER_COLOR = "rgba(255,255,255,0.15)";
const HOVER_BG = "rgba(255,255,255,0.1)";

const SharedSidebar = ({
    selectedKey,
    setSelectedKey,
    onMenuItemClick,
    collapsed,
    toggleCollapse,
    menuItems,
    title = "",
}) => {
    // Handle click: prefer specific handler, then default to setting key
    const handleClick = (e) => {
        if (onMenuItemClick) {
            onMenuItemClick(e);
        } else if (setSelectedKey) {
            setSelectedKey(e.key);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100vh",
                width: collapsed ? 80 : 300,
                background: SIDEBAR_BG,
                transition: "width 0.2s cubic-bezier(0.2, 0, 0, 1) 0s",
                display: "flex",
                flexDirection: "column",
                zIndex: 1000,
                boxShadow: "2px 0 10px rgba(0,0,0,0.15)",
                color: "white",
            }}
        >
            {/* Logo Section */}
            <div
                style={{
                    height: 90,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: collapsed ? "column" : "row",
                    borderBottom: `1px solid ${BORDER_COLOR}`,
                    padding: 10,
                    gap: collapsed ? 5 : 10,
                }}
            >
                <img
                    src={ncbabanklogo}
                    alt="NCBA Logo"
                    style={{
                        width: collapsed ? 40 : 60,
                        transition: "all 0.2s",
                        filter: "brightness(0) invert(1)",
                        objectFit: "contain",
                    }}
                />
                {!collapsed && title && (
                    <span
                        style={{ fontSize: 18, fontWeight: "bold", whiteSpace: "nowrap" }}
                    >
                        {title}
                    </span>
                )}
            </div>

            {/* Menu Section */}
            <div style={{ flex: 1, overflowY: "auto", marginTop: 10 }}>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    onClick={handleClick}
                    inlineCollapsed={collapsed}
                    items={menuItems}
                    style={{
                        background: "transparent",
                        borderRight: "none",
                        fontSize: 15,
                    }}
                />
            </div>

            {/* Footer / Copyright */}
            {!collapsed && (
                <div
                    style={{
                        padding: 16,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.6)",
                        borderTop: `1px solid ${BORDER_COLOR}`,
                        textAlign: "center",
                    }}
                >
                    © {new Date().getFullYear()} NCBA Bank
                </div>
            )}

            {/* Collapse Toggle */}
            <div style={{ padding: 12 }}>
                <button
                    onClick={toggleCollapse}
                    style={{
                        width: "100%",
                        padding: "8px",
                        border: "none",
                        borderRadius: 6,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: HOVER_BG, // Use consistent variable
                        color: "#fff",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {collapsed ? ">" : "< Collapse"}
                </button>
            </div>
        </div>
    );
};

export default SharedSidebar;
