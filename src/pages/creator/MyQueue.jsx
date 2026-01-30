// // import React, { useMemo, useState } from "react";
// // import {
// //   Button,
// //   Table,
// //   Tag,
// //   Spin,
// //   Empty,
// //   Tabs,
// //   Card,
// //   Row,
// //   Col,
// //   Input,
// //   DatePicker,
// // } from "antd";
// // import {
// //   SearchOutlined,
// //   FileTextOutlined,
// //   UserOutlined,
// //   CustomerServiceOutlined,
// // } from "@ant-design/icons";
// // import CreatorQueueChecklistModal from "../../components/modals/CreatorQueueChecklistModal";
// // import { useGetChecklistsByCreatorQuery } from "../../api/checklistApi";
// // import dayjs from "dayjs";
// // import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// // import { useSelector } from "react-redux";

// // /* ---------------- THEME COLORS ---------------- */
// // const PRIMARY_BLUE = "#164679";
// // const ACCENT_LIME = "#b5d334";
// // const HIGHLIGHT_GOLD = "#fcb116";
// // const LIGHT_YELLOW = "#fcd716";
// // const SECONDARY_PURPLE = "#7e6496";
// // const SUCCESS_GREEN = "#52c41a";
// // const ERROR_RED = "#ff4d4f";
// // const WARNING_ORANGE = "#faad14";

// // const { RangePicker } = DatePicker;
// // const { TabPane } = Tabs;

// // const Myqueue = () => {
// //   const [selectedChecklist, setSelectedChecklist] = useState(null);
// //   const [activeTab, setActiveTab] = useState("current");
// //   const [searchText, setSearchText] = useState("");

// //   // const { user } = useSelector((state) => state.auth);
// //   // const creatorId = user?._id; // or wherever you get it from

// //   // const {
// //   //   data: allChecklists = [],
// //   //   isLoading,
// //   //   isError,
// //   // } = useGetChecklistsByCreatorQuery(creatorId, {
// //   //   skip: !creatorId,
// //   // });

// //   // console.log("Creator ID:", creatorId);

// //   const { user } = useSelector((state) => state.auth);

// //   const creatorId = user?.id;

// //   const { data: allChecklists = [], isLoading } =
// //     useGetChecklistsByCreatorQuery(creatorId, {
// //       skip: !creatorId,
// //     });

// //   console.log("Creator ID:", creatorId);
// //   console.log("Redux user:", user);
// //   console.log("Creator ID:", user?._id);
// //   console.log("All Checklists in MyQueue:", allChecklists);

// //   /* ---------------- CURRENT QUEUE (PENDING) ---------------- */

// //   console.log("All Checklists in MyQueue:", allChecklists);

// //   const currentQueue = useMemo(() => {
// //     let filtered = allChecklists.filter((c) =>
// //       ["co_creator_review", "rm_review"].includes(
// //         (c.status || "").toLowerCase(),
// //       ),
// //     );

// //     if (searchText) {
// //       const q = searchText.toLowerCase();
// //       filtered = filtered.filter(
// //         (c) =>
// //           c.dclNo?.toLowerCase().includes(q) ||
// //           c.customerNumber?.toLowerCase().includes(q) ||
// //           c.customerName?.toLowerCase().includes(q) ||
// //           c.loanType?.toLowerCase().includes(q),
// //       );
// //     }

// //     return filtered;
// //   }, [allChecklists, searchText]);

// //   // const currentQueue = useMemo(() => {
// //   //   let filtered = allChecklists.filter(
// //   //     (c) => (c.status || "").toLowerCase() === "co_creator_review"
// //   //   );

// //   //   if (searchText) {
// //   //     const q = searchText.toLowerCase();
// //   //     filtered = filtered.filter(
// //   //       (c) =>
// //   //         c.dclNo?.toLowerCase().includes(q) ||
// //   //         c.customerNumber?.toLowerCase().includes(q) ||
// //   //         c.customerName?.toLowerCase().includes(q) ||
// //   //         c.loanType?.toLowerCase().includes(q)
// //   //     );
// //   //   }

// //   //   return filtered;
// //   // }, [allChecklists, searchText]);

// //   /* ---------------- PREVIOUS QUEUE (APPROVED) ---------------- */
// //   const previousQueue = useMemo(() => {
// //     let filtered = allChecklists.filter(
// //       (c) => (c.status || "").toLowerCase() === "co_checker_review",
// //     );

// //     if (searchText) {
// //       const q = searchText.toLowerCase();
// //       filtered = filtered.filter(
// //         (c) =>
// //           c.dclNo?.toLowerCase().includes(q) ||
// //           c.customerNumber?.toLowerCase().includes(q) ||
// //           c.customerName?.toLowerCase().includes(q) ||
// //           c.loanType?.toLowerCase().includes(q),
// //       );
// //     }

// //     return filtered;
// //   }, [allChecklists, searchText]);

// //   /* ---------------- REVIVED CHECKLISTS ---------------- */
// //   const revivedQueue = useMemo(() => {
// //     let filtered = allChecklists.filter((c) => c.isRevived === true);

// //     if (searchText) {
// //       const q = searchText.toLowerCase();
// //       filtered = filtered.filter(
// //         (c) =>
// //           c.dclNo?.toLowerCase().includes(q) ||
// //           c.customerNumber?.toLowerCase().includes(q) ||
// //           c.customerName?.toLowerCase().includes(q) ||
// //           c.loanType?.toLowerCase().includes(q),
// //       );
// //     }

// //     return filtered;
// //   }, [allChecklists, searchText]);

// //   /* ---------------- TABLE COLUMNS ---------------- */
// //   const getColumns = (isCurrentTab) => [
// //     {
// //       title: "DCL No",
// //       dataIndex: "dclNo",
// //       width: 140,
// //       render: (text) => (
// //         <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
// //           <FileTextOutlined style={{ marginRight: 6 }} />
// //           {text}
// //         </div>
// //       ),
// //     },
// //     {
// //       title: "Customer No",
// //       dataIndex: "customerNumber",
// //       width: 120,
// //       render: (text) => (
// //         <span style={{ color: SECONDARY_PURPLE }}>{text || "—"}</span>
// //       ),
// //     },
// //     {
// //       title: "Customer Name",
// //       dataIndex: "customerName",
// //       width: 180,
// //       render: (text) => (
// //         <span style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
// //           <CustomerServiceOutlined style={{ marginRight: 6 }} />
// //           {text}
// //         </span>
// //       ),
// //     },

// //     {
// //       title: "IBPS No", // ✅ New IBPS NO column
// //       dataIndex: "ibpsNo",
// //       width: 140,
// //       render: (text) => (
// //         <span
// //           style={{
// //             color: PRIMARY_BLUE,
// //             fontWeight: 500,
// //             fontFamily: "monospace",
// //             backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
// //             padding: "2px 6px",
// //             borderRadius: 4,
// //             fontSize: 13,
// //           }}
// //         >
// //           {text || "Not set"}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: "Loan Type",
// //       dataIndex: "loanType",
// //       width: 130,
// //     },
// //     {
// //       title: "RM",
// //       dataIndex: "assignedToRM",
// //       width: 140,
// //       render: (rm) => (
// //         <span>
// //           <UserOutlined style={{ marginRight: 6 }} />
// //           {rm?.name || "N/A"}
// //         </span>
// //       ),
// //     },
// //     {
// //       title: "Docs",
// //       dataIndex: "documents",
// //       width: 80,
// //       align: "center",
// //       render: (docs = []) => {
// //         const total =
// //           docs.reduce((sum, d) => sum + (d.docList?.length || 0), 0) || 0;

// //         return (
// //           <Tag
// //             color={LIGHT_YELLOW}
// //             style={{
// //               fontWeight: "bold",
// //               borderRadius: 999,
// //               border: `1px solid ${HIGHLIGHT_GOLD}`,
// //             }}
// //           >
// //             {total}
// //           </Tag>
// //         );
// //       },
// //     },
// //     {
// //       title: "SLA",
// //       dataIndex: "slaExpiry",
// //       width: 90,
// //       render: (date) => {
// //         const daysLeft = dayjs(date).diff(dayjs(), "days");
// //         return (
// //           <Tag
// //             color={
// //               daysLeft <= 2
// //                 ? ERROR_RED
// //                 : daysLeft <= 5
// //                   ? WARNING_ORANGE
// //                   : SUCCESS_GREEN
// //             }
// //           >
// //             {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
// //           </Tag>
// //         );
// //       },
// //     },
// //     {
// //       title: "Status",
// //       width: 120,
// //       render: () => (
// //         <Tag color={isCurrentTab ? "orange" : "green"}>
// //           {isCurrentTab ? "Pending Review" : "co_checker_review"}
// //         </Tag>
// //       ),
// //     },
// //   ];

// //   /* ---------------- TABLE STYLES ---------------- */
// //   const customTableStyles = `
// //     .myqueue-table .ant-table-wrapper {
// //       border-radius: 12px;
// //       overflow: hidden;
// //       box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
// //       border: 1px solid #e0e0e0;
// //     }
// //     .myqueue-table .ant-table-thead > tr > th {
// //       background-color: #f7f7f7 !important;
// //       color: ${PRIMARY_BLUE} !important;
// //       font-weight: 700;
// //       border-bottom: 3px solid ${ACCENT_LIME} !important;
// //     }
// //     .myqueue-table .ant-table-tbody > tr:hover > td {
// //       background-color: rgba(181, 211, 52, 0.1) !important;
// //       cursor: pointer;
// //     }
// //   `;

// //   /* ---------------- RENDER ---------------- */
// //   return (
// //     <div style={{ padding: 24 }}>
// //       <style>{customTableStyles}</style>

// //       {/* HEADER */}
// //       <Card
// //         style={{
// //           marginBottom: 24,
// //           borderLeft: `4px solid ${ACCENT_LIME}`,
// //         }}
// //       >
// //         <h2 style={{ margin: 0, color: PRIMARY_BLUE }}>My Queue</h2>
// //         <p style={{ marginTop: 4, color: "#666" }}>
// //           Review pending and completed checklists
// //         </p>
// //       </Card>

// //       {/* FILTER */}
// //       <Card size="small" style={{ marginBottom: 16 }}>
// //         <Row gutter={16}>
// //           <Col md={12}>
// //             <Input
// //               prefix={<SearchOutlined />}
// //               placeholder="Search DCL / Customer / Loan"
// //               value={searchText}
// //               onChange={(e) => setSearchText(e.target.value)}
// //               allowClear
// //             />
// //           </Col>
// //         </Row>
// //       </Card>

// //       {/* TABS */}
// //       <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
// //         <TabPane tab="Current Queue" key="current">
// //           {isLoading ? (
// //             <Spin style={{ display: "block", margin: 40 }} />
// //           ) : currentQueue.length === 0 ? (
// //             <Empty description="No pending items" />
// //           ) : (
// //             <div className="myqueue-table">
// //               <Table
// //                 rowKey="_id"
// //                 columns={getColumns(true)}
// //                 dataSource={currentQueue}
// //                 pagination={{ pageSize: 10 }}
// //                 onRow={(r) => ({
// //                   onClick: () => setSelectedChecklist(r),
// //                 })}
// //               />
// //             </div>
// //           )}
// //         </TabPane>

// //         <TabPane tab="Previous Queue" key="previous">
// //           {isLoading ? (
// //             <Spin style={{ display: "block", margin: 40 }} />
// //           ) : previousQueue.length === 0 ? (
// //             <Empty description="No approved items" />
// //           ) : (
// //             <div className="myqueue-table">
// //               <Table
// //                 rowKey="_id"
// //                 columns={getColumns(false)}
// //                 dataSource={previousQueue}
// //                 pagination={{ pageSize: 10 }}
// //                 onRow={(r) => ({
// //                   onClick: () => setSelectedChecklist(r),
// //                 })}
// //               />
// //             </div>
// //           )}
// //         </TabPane>

// //         <TabPane
// //           tab={
// //             <span style={{ color: SECONDARY_PURPLE }}>
// //               🔄 Revived Checklists ({revivedQueue.length})
// //             </span>
// //           }
// //           key="revived"
// //         >
// //           {isLoading ? (
// //             <Spin style={{ display: "block", margin: 40 }} />
// //           ) : revivedQueue.length === 0 ? (
// //             <Empty description="No revived checklists" />
// //           ) : (
// //             <div className="myqueue-table">
// //               <Table
// //                 rowKey="_id"
// //                 columns={[
// //                   ...getColumns(true),
// //                   {
// //                     title: "Original DCL",
// //                     dataIndex: "originalChecklistId",
// //                     width: 120,
// //                     render: (_, record) => (
// //                       <Tag color="purple">
// //                         {record.dclNo?.includes("copy")
// //                           ? record.dclNo.split(" copy")[0]
// //                           : "Original"}
// //                       </Tag>
// //                     ),
// //                   },
// //                   {
// //                     title: "Revived On",
// //                     dataIndex: "revivedAt",
// //                     width: 120,
// //                     render: (date) =>
// //                       date ? dayjs(date).format("DD MMM YYYY") : "—",
// //                   },
// //                 ]}
// //                 dataSource={revivedQueue}
// //                 pagination={{ pageSize: 10 }}
// //                 onRow={(r) => ({
// //                   onClick: () => setSelectedChecklist(r),
// //                 })}
// //               />
// //             </div>
// //           )}
// //         </TabPane>
// //       </Tabs>

// //       {/* MODAL */}
// //       {selectedChecklist && (
// //         <ReviewChecklistModal
// //           checklist={selectedChecklist}
// //           open={!!selectedChecklist}
// //           onClose={() => setSelectedChecklist(null)}
// //         />
// //         // <CreatorQueueChecklistModal
// //         //   open
// //         //   checklist={selectedChecklist}
// //         //   onClose={() => {
// //         //     setSelectedChecklist(null);
// //         //     refetch();
// //         //   }}
// //         //   sourceType={activeTab === "current" ? "from_rm" : "from_checker"}
// //         // />
// //       )}
// //     </div>
// //   );
// // };

// // export default Myqueue;
// import React, { useMemo, useState } from "react";
// import {
//   Button,
//   Table,
//   Tag,
//   Spin,
//   Empty,
//   Tabs,
//   Card,
//   Row,
//   Col,
//   Input,
//   DatePicker,
// } from "antd";
// import {
//   SearchOutlined,
//   FileTextOutlined,
//   UserOutlined,
//   CustomerServiceOutlined,
// } from "@ant-design/icons";
// import CreatorQueueChecklistModal from "../../components/modals/CreatorQueueChecklistModal";
// import { useGetChecklistsByCreatorQuery } from "../../api/checklistApi";
// import dayjs from "dayjs";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import { useSelector } from "react-redux";

// /* ---------------- THEME COLORS ---------------- */
// const PRIMARY_BLUE = "#164679";
// const ACCENT_LIME = "#b5d334";
// const HIGHLIGHT_GOLD = "#fcb116";
// const LIGHT_YELLOW = "#fcd716";
// const SECONDARY_PURPLE = "#7e6496";
// const SUCCESS_GREEN = "#52c41a";
// const ERROR_RED = "#ff4d4f";
// const WARNING_ORANGE = "#faad14";

// const { RangePicker } = DatePicker;
// const { TabPane } = Tabs;

// const Myqueue = () => {
//   const [selectedChecklist, setSelectedChecklist] = useState(null);
//   const [activeTab, setActiveTab] = useState("current");
//   const [searchText, setSearchText] = useState("");

//   // const { user } = useSelector((state) => state.auth);
//   // const creatorId = user?._id; // or wherever you get it from

//   // const {
//   //   data: allChecklists = [],
//   //   isLoading,
//   //   isError,
//   // } = useGetChecklistsByCreatorQuery(creatorId, {
//   //   skip: !creatorId,
//   // });

//   // console.log("Creator ID:", creatorId);

//   const { user } = useSelector((state) => state.auth);

//   const creatorId = user?.id;

//   const { data: allChecklists = [], isLoading } =
//     useGetChecklistsByCreatorQuery(creatorId, {
//       skip: !creatorId,
//     });

//   console.log("Creator ID:", creatorId);
//   console.log("Redux user:", user);
//   console.log("Creator ID:", user?._id);
//   console.log("All Checklists in MyQueue:", allChecklists);

//   /* ---------------- FETCH DATA ---------------- */
//   // const {
//   //   data: allChecklists = [],
//   //   isLoading,
//   //   refetch,
//   // } = useGetChecklistsByCreatorQuery();

//   /* ---------------- CURRENT QUEUE (PENDING) ---------------- */

//   console.log("All Checklists in MyQueue:", allChecklists);

//   const currentQueue = useMemo(() => {
//     let filtered = allChecklists.filter((c) =>
//       ["co_creator_review", "rm_review"].includes(
//         (c.status || "").toLowerCase(),
//       ),
//     );

//     if (searchText) {
//       const q = searchText.toLowerCase();
//       filtered = filtered.filter(
//         (c) =>
//           c.dclNo?.toLowerCase().includes(q) ||
//           c.customerNumber?.toLowerCase().includes(q) ||
//           c.customerName?.toLowerCase().includes(q) ||
//           c.loanType?.toLowerCase().includes(q),
//       );
//     }

//     return filtered;
//   }, [allChecklists, searchText]);

//   /* ---------------- PREVIOUS QUEUE (APPROVED) ---------------- */
//   const previousQueue = useMemo(() => {
//     let filtered = allChecklists.filter(
//       (c) => (c.status || "").toLowerCase() === "co_checker_review",
//     );

//     if (searchText) {
//       const q = searchText.toLowerCase();
//       filtered = filtered.filter(
//         (c) =>
//           c.dclNo?.toLowerCase().includes(q) ||
//           c.customerNumber?.toLowerCase().includes(q) ||
//           c.customerName?.toLowerCase().includes(q) ||
//           c.loanType?.toLowerCase().includes(q),
//       );
//     }

//     return filtered;
//   }, [allChecklists, searchText]);

//   /* ---------------- TABLE COLUMNS ---------------- */
//   const getColumns = (isCurrentTab) => [
//     {
//       title: "DCL No",
//       dataIndex: "dclNo",
//       width: 140,
//       render: (text) => (
//         <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
//           <FileTextOutlined style={{ marginRight: 6 }} />
//           {text}
//         </div>
//       ),
//     },
//     {
//       title: "Customer No",
//       dataIndex: "customerNumber",
//       width: 120,
//       render: (text) => (
//         <span style={{ color: SECONDARY_PURPLE }}>{text || "—"}</span>
//       ),
//     },
//     {
//       title: "Customer Name",
//       dataIndex: "customerName",
//       width: 180,
//       render: (text) => (
//         <span style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
//           <CustomerServiceOutlined style={{ marginRight: 6 }} />
//           {text}
//         </span>
//       ),
//     },

//     {
//       title: "IBPS No", // ✅ New IBPS NO column
//       dataIndex: "ibpsNo",
//       width: 140,
//       render: (text) => (
//         <span
//           style={{
//             color: PRIMARY_BLUE,
//             fontWeight: 500,
//             fontFamily: "monospace",
//             backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
//             padding: "2px 6px",
//             borderRadius: 4,
//             fontSize: 13,
//           }}
//         >
//           {text || "Not set"}
//         </span>
//       ),
//     },
//     {
//       title: "Loan Type",
//       dataIndex: "loanType",
//       width: 130,
//     },
//     {
//       title: "RM",
//       dataIndex: "assignedToRM",
//       width: 140,
//       render: (rm) => (
//         <span>
//           <UserOutlined style={{ marginRight: 6 }} />
//           {rm?.name || "N/A"}
//         </span>
//       ),
//     },
//     {
//       title: "Docs",
//       dataIndex: "documents",
//       width: 80,
//       align: "center",
//       render: (docs = []) => {
//         const total =
//           docs.reduce((sum, d) => sum + (d.docList?.length || 0), 0) || 0;

//         return (
//           <Tag
//             color={LIGHT_YELLOW}
//             style={{
//               fontWeight: "bold",
//               borderRadius: 999,
//               border: `1px solid ${HIGHLIGHT_GOLD}`,
//             }}
//           >
//             {total}
//           </Tag>
//         );
//       },
//     },
//     {
//       title: "SLA",
//       dataIndex: "slaExpiry",
//       width: 90,
//       render: (date) => {
//         const daysLeft = dayjs(date).diff(dayjs(), "days");
//         return (
//           <Tag
//             color={
//               daysLeft <= 2
//                 ? ERROR_RED
//                 : daysLeft <= 5
//                   ? WARNING_ORANGE
//                   : SUCCESS_GREEN
//             }
//           >
//             {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
//           </Tag>
//         );
//       },
//     },
//     {
//       title: "Status",
//       width: 120,
//       render: () => (
//         <Tag color={isCurrentTab ? "orange" : "green"}>
//           {isCurrentTab ? "Pending Review" : "co_checker_review"}
//         </Tag>
//       ),
//     },
//   ];

//   /* ---------------- TABLE STYLES ---------------- */
//   const customTableStyles = `
//     .myqueue-table .ant-table-wrapper {
//       border-radius: 12px;
//       overflow: hidden;
//       box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
//       border: 1px solid #e0e0e0;
//     }
//     .myqueue-table .ant-table-thead > tr > th {
//       background-color: #f7f7f7 !important;
//       color: ${PRIMARY_BLUE} !important;
//       font-weight: 700;
//       border-bottom: 3px solid ${ACCENT_LIME} !important;
//     }
//     .myqueue-table .ant-table-tbody > tr:hover > td {
//       background-color: rgba(181, 211, 52, 0.1) !important;
//       cursor: pointer;
//     }
//   `;

//   /* ---------------- RENDER ---------------- */
//   return (
//     <div style={{ padding: 24 }}>
//       <style>{customTableStyles}</style>

//       {/* HEADER */}
//       <Card
//         style={{
//           marginBottom: 24,
//           borderLeft: `4px solid ${ACCENT_LIME}`,
//         }}
//       >
//         <h2 style={{ margin: 0, color: PRIMARY_BLUE }}>My Queue</h2>
//         <p style={{ marginTop: 4, color: "#666" }}>
//           Review pending and completed checklists
//         </p>
//       </Card>

//       {/* FILTER */}
//       <Card size="small" style={{ marginBottom: 16 }}>
//         <Row gutter={16}>
//           <Col md={12}>
//             <Input
//               prefix={<SearchOutlined />}
//               placeholder="Search DCL / Customer / Loan"
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               allowClear
//             />
//           </Col>
//         </Row>
//       </Card>

//       {/* TABS */}
//       <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
//         <TabPane tab="Current Queue" key="current">
//           {isLoading ? (
//             <Spin style={{ display: "block", margin: 40 }} />
//           ) : currentQueue.length === 0 ? (
//             <Empty description="No pending items" />
//           ) : (
//             <div className="myqueue-table">
//               <Table
//                 rowKey="_id"
//                 columns={getColumns(true)}
//                 dataSource={currentQueue}
//                 pagination={{ pageSize: 10 }}
//                 onRow={(r) => ({
//                   onClick: () => setSelectedChecklist(r),
//                 })}
//               />
//             </div>
//           )}
//         </TabPane>

//         <TabPane tab="Previous Queue" key="previous">
//           {isLoading ? (
//             <Spin style={{ display: "block", margin: 40 }} />
//           ) : previousQueue.length === 0 ? (
//             <Empty description="No approved items" />
//           ) : (
//             <div className="myqueue-table">
//               <Table
//                 rowKey="_id"
//                 columns={getColumns(false)}
//                 dataSource={previousQueue}
//                 pagination={{ pageSize: 10 }}
//                 onRow={(r) => ({
//                   onClick: () => setSelectedChecklist(r),
//                 })}
//               />
//             </div>
//           )}
//         </TabPane>
//       </Tabs>

//       {/* MODAL */}
//       {selectedChecklist && (
//         <ReviewChecklistModal
//           checklist={selectedChecklist}
//           open={!!selectedChecklist}
//           onClose={() => setSelectedChecklist(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default Myqueue;
import React, { useMemo, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Spin,
  Empty,
  Tabs,
  Card,
  Row,
  Col,
  Input,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from "@ant-design/icons";
import CreatorQueueChecklistModal from "../../components/modals/CreatorQueueChecklistModal";
import { useGetChecklistsByCreatorQuery } from "../../api/checklistApi";
import dayjs from "dayjs";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
import { useSelector } from "react-redux";

/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const Myqueue = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [activeTab, setActiveTab] = useState("co_creator_review");
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth);

  const creatorId = user?.id;

  const { data: allChecklists = [], isLoading } =
    useGetChecklistsByCreatorQuery(creatorId, {
      skip: !creatorId,
    });

  console.log("Creator ID:", creatorId);
  console.log("Redux user:", user);
  console.log("Creator ID:", user?._id);
  console.log("All Checklists in MyQueue:", allChecklists);

  /* ---------------- CO_CREATOR_REVIEW QUEUE ---------------- */
  const coCreatorReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "co_creator_review",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);

  /* ---------------- RM_REVIEW QUEUE ---------------- */
  const rmReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "rm_review",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);

  /* ---------------- CO_CHECKER_REVIEW QUEUE ---------------- */
  const coCheckerReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "co_checker_review",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);

  /* ---------------- TABLE COLUMNS ---------------- */
  const getColumns = (isCurrentTab) => [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      render: (text) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 120,
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE }}>{text || "—"}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
          <CustomerServiceOutlined style={{ marginRight: 6 }} />
          {text}
        </span>
      ),
    },

    {
      title: "IBPS No", // ✅ New IBPS NO column
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 130,
    },
    {
      title: "RM",
      dataIndex: "assignedToRM",
      width: 140,
      render: (rm) => (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          {rm?.name || "N/A"}
        </span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs = []) => {
        const total =
          docs.reduce((sum, d) => sum + (d.docList?.length || 0), 0) || 0;

        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontWeight: "bold",
              borderRadius: 999,
              border: `1px solid ${HIGHLIGHT_GOLD}`,
            }}
          >
            {total}
          </Tag>
        );
      },
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 90,
      render: (date) => {
        const daysLeft = dayjs(date).diff(dayjs(), "days");
        return (
          <Tag
            color={
              daysLeft <= 2
                ? ERROR_RED
                : daysLeft <= 5
                  ? WARNING_ORANGE
                  : SUCCESS_GREEN
            }
          >
            {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      width: 120,
      render: (_, record) => (
        <Tag
          color={
            record.status === "co_creator_review"
              ? "orange"
              : record.status === "rm_review"
                ? "blue"
                : "green"
          }
        >
          {record.status || "Unknown"}
        </Tag>
      ),
    },
  ];

  /* ---------------- TABLE STYLES ---------------- */
  const customTableStyles = `
    .myqueue-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .myqueue-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
    }
    .myqueue-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
  `;

  /* ---------------- RENDER ---------------- */
  return (
    <div style={{ padding: 24 }}>
      <style>{customTableStyles}</style>

      {/* HEADER */}
      <Card
        style={{
          marginBottom: 24,
          borderLeft: `4px solid ${ACCENT_LIME}`,
        }}
      >
        <h2 style={{ margin: 0, color: PRIMARY_BLUE }}>My Queue</h2>
        <p style={{ marginTop: 4, color: "#666" }}>
          Review pending and completed checklists
        </p>
      </Card>

      {/* FILTER */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col md={12}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search DCL / Customer / Loan"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* TABS */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab="CO Creator Review" key="co_creator_review">
          {isLoading ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : coCreatorReviewQueue.length === 0 ? (
            <Empty description="No pending items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="_id"
                columns={getColumns(true)}
                dataSource={coCreatorReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => setSelectedChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab="RM Review" key="rm_review">
          {isLoading ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : rmReviewQueue.length === 0 ? (
            <Empty description="No RM review items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="_id"
                columns={getColumns(false)}
                dataSource={rmReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => setSelectedChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab="CO Checker Review" key="co_checker_review">
          {isLoading ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : coCheckerReviewQueue.length === 0 ? (
            <Empty description="No approved items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="_id"
                columns={getColumns(false)}
                dataSource={coCheckerReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => setSelectedChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>
      </Tabs>

      {/* MODAL */}
      {selectedChecklist && (
        <ReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
        />
      )}
    </div>
  );
};

export default Myqueue;
