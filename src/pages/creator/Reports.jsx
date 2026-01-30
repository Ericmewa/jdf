
import React, { useState } from "react";
import { Tabs, Card, Row, Col, Tooltip, Divider, Button } from "antd";
import {
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import Deferrals from "./Deferrals";
import AllDCLsTable from "./AllDCLsTable";
import ReportsFilters from "./ReportsFilters";
import useReportsFilters from "../../hooks/useReportsFilters";

const { TabPane } = Tabs;

export default function Reports() {
  const [activeTab, setActiveTab] = useState("deferrals");

  // Filter hook
  const { filters, setFilters, clearFilters } = useReportsFilters();

  // Export CSV
  const exportReport = (data) => {
    if (!data?.length) return;
    const filename = `${activeTab}_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
    const csv =
      "data:text/csv;charset=utf-8," +
      data.map((row) => Object.values(row).join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = filename;
    link.click();
  };

  // Render table based on active tab
  const renderTable = () => {
    switch (activeTab) {
      case "deferrals":
        return <Deferrals filters={filters} onExport={exportReport} />;
      case "allDCLs":
        return <AllDCLsTable filters={filters} onExport={exportReport} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* HEADER */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between">
          <Col>
            <h2>DCL Reports & Analytics</h2>
          </Col>
          <Col>
            <Tooltip title="Export Report">
              <Button
                icon={<DownloadOutlined />}
                onClick={() => exportReport([])} // replace with actual table data
              />
            </Tooltip>
          </Col>
        </Row>
      </Card>

      {/* FILTERS */}
      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        setFilters={setFilters}
        clearFilters={clearFilters}
      />

      {/* TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          clearFilters(); // reset filters when switching tabs
        }}
        type="card"
      >
        <TabPane
          key="deferrals"
          tab={
            <>
              <CheckCircleOutlined /> Deferrals
            </>
          }
        />
        <TabPane
          key="allDCLs"
          tab={
            <>
              <FileTextOutlined /> All DCLs
            </>
          }
        />
      </Tabs>

      <Divider />

      {/* TABLE */}
      {renderTable()}

      {/* FOOTER */}
      <div style={{ marginTop: 24, fontSize: 12 }}>
        Generated on {dayjs().format("DD/MM/YYYY HH:mm:ss")}
      </div>
    </div>
  );
}
