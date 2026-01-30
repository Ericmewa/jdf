// import { Card, Row, Col, Input, DatePicker, Select, Button } from "antd";
// import { SearchOutlined } from "@ant-design/icons";

// const { RangePicker } = DatePicker;
// const { Option } = Select;

// export default function ReportsFilters({
//   activeTab,
//   filters,
//   setFilters,
//   clearFilters,
// }) {
//   return (
//     <Card size="small" style={{ marginBottom: 16 }}>
//       <Row gutter={16}>
//         <Col md={8}>
//           <Input
//             prefix={<SearchOutlined />}
//             placeholder="Search..."
//             value={filters.searchText}
//             onChange={(e) =>
//               setFilters({ ...filters, searchText: e.target.value })
//             }
//             allowClear
//           />
//         </Col>

//         {activeTab !== "allDCLs" && (
//           <Col md={8}>
//             <RangePicker
//               style={{ width: "100%" }}
//               value={filters.dateRange}
//               onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
//             />
//           </Col>
//         )}

//         {activeTab === "allDCLs" && (
//           <Col md={6}>
//             <Select
//               value={filters.status}
//               onChange={(value) => setFilters({ ...filters, status: value })}
//             >
//               <Option value="All">All</Option>
//               <Option value="Completed">Completed</Option>
//               <Option value="Active">Active</Option>
//               <Option value="Deferred">Deferred</Option>
//             </Select>
//           </Col>
//         )}

//         <Col md={2}>
//           <Button onClick={clearFilters}>Clear</Button>
//         </Col>
//       </Row>
//     </Card>
//   );
// }
// src/components/ReportsFilters.jsx
import React from "react";
import { Card, Row, Col, Input, DatePicker, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportsFilters({
  activeTab,
  filters,
  setFilters,
  clearFilters,
}) {
  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col md={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search..."
            value={filters.searchText}
            onChange={(e) =>
              setFilters({ ...filters, searchText: e.target.value })
            }
            allowClear
          />
        </Col>

        {activeTab !== "allDCLs" && (
          <Col md={8}>
            <RangePicker
              style={{ width: "100%" }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Col>
        )}

        {activeTab === "allDCLs" && (
          <Col md={6}>
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="All">All</Option>
              <Option value="Completed">Completed</Option>
              <Option value="Active">Active</Option>
              <Option value="Deferred">Deferred</Option>
            </Select>
          </Col>
        )}

        <Col md={2}>
          <Button onClick={clearFilters}>Clear</Button>
        </Col>
      </Row>
    </Card>
  );
}
