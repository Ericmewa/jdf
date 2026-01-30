import { Table, Tag, Spin, Empty } from "antd";
import { useState } from "react";
import {
  FileTextOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { useGetAllCoCreatorChecklistsQuery } from "../../api/checklistApi";

import {
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

// Import all modal components
// import ReviewChecklistModal from "../../components/modals/CreatorReviewChecklistModal";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModal";
import CompletedChecklistModal from "../../components/modals/CompletedChecklistModal";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
import RmReviewChecklistModal from "../../components/modals/RmReviewChecklistModal";

const CHECKLIST_STATUS_META = {
  co_creator_review: {
    label: "Co-Creator Review",
    color: "blue",
    icon: <SyncOutlined />,
  },
  rm_review: {
    label: "RM Review",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  revived: {
    label: "Revived",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
  co_checker_review: {
    label: "Co-Checker Review",
    color: "purple",
    icon: <SyncOutlined />,
  },
  approved: {
    label: "Approved",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  rejected: {
    label: "Rejected",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
  active: {
    label: "Active",
    color: "cyan",
    icon: <SyncOutlined />,
  },
  completed: {
    label: "Completed",
    color: "success",
    icon: <CheckCircleOutlined />,
  },
  pending: {
    label: "Pending",
    color: "default",
    icon: <ClockCircleOutlined />,
  },
  closed: {
    label: "Revived",
    color: "orange",
    icon: <ClockCircleOutlined />,
  },
};

const renderChecklistStatus = (status) => {
  const meta = CHECKLIST_STATUS_META[status];

  if (!meta) {
    return <Tag color="default">Unknown</Tag>;
  }

  return (
    <Tag
      color={meta.color}
      icon={meta.icon}
      style={{
        fontWeight: 600,
        fontSize: 11,
        borderRadius: 999,
        textTransform: "uppercase",
      }}
    >
      {meta.label}
    </Tag>
  );
};

/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const SECONDARY_PURPLE = "#2B1C67";
const LIGHT_YELLOW = "#FFF7CC";
const HIGHLIGHT_GOLD = "#E6C200";
const SUCCESS_GREEN = "#52c41a";

// Function to determine which modal to show based on status
const getModalComponent = (status) => {
  switch (status) {
    case "rm_review":
      return RmReviewChecklistModal;
    case "co_checker_review":
      return CheckerReviewChecklistModal;
    case "approved":
    case "completed":
      return CompletedChecklistModal;
    case "co_creator_review":
      return ReviewChecklistModal;
    case "closed":
    case "revived":
      return CreatorCompletedChecklistModal;
    case "active":
    case "pending":
    default:
      return ReviewChecklistModal; // default fallback
  }
};

export default function AllDCLsTable({ filters }) {
  // State for modal
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data = [], isLoading } = useGetAllCoCreatorChecklistsQuery();

  const filtered = data.filter((d) =>
    !filters.searchText
      ? true
      : d.dclNo?.toLowerCase().includes(filters.searchText.toLowerCase()) ||
      d.customerName
        ?.toLowerCase()
        .includes(filters.searchText.toLowerCase()),
  );

  // Handle row click to open modal
  const handleRowClick = (record) => {
    setSelectedChecklist(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChecklist(null);
  };

  if (isLoading) return <Spin />;
  if (!filtered.length) return <Empty />;

  /* ---------------- COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL No",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CustomerServiceOutlined style={{ fontSize: 12 }} />
          {text}
        </div>
      ),
    },
    {
      title: "IBPS No",
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
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
    {
      title: "Checker - Approver",
      dataIndex: "approvedBy",
      width: 140,
      render: (approver) => (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
          <span
            style={{
              color: PRIMARY_BLUE,
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {approver?.name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;

        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontSize: 11,
              borderRadius: 999,
              fontWeight: "bold",
              color: PRIMARY_BLUE,
              border: `1px solid ${HIGHLIGHT_GOLD}`,
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {totalDocs}
          </Tag>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "updatedAt",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
        </div>
      ),
    },

    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      fixed: "right",
      render: (status) => renderChecklistStatus(status),
    },
  ];

  // Get the appropriate modal component based on checklist status
  const ModalComponent = selectedChecklist
    ? getModalComponent(selectedChecklist.status)
    : null;

  return (
    <>
      {/* Custom styles */}
      <style>{customTableStyles}</style>

      <Table
        className="creator-completed-table"
        rowKey="_id"
        dataSource={filtered}
        columns={columns}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1300 }}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
        })}
      />

      {/* Render the appropriate modal based on status */}
      {selectedChecklist && ModalComponent && (
        <ModalComponent
          open={isModalOpen}
          checklist={selectedChecklist}
          onClose={handleCloseModal}
          readOnly={true}
        />
      )}
    </>
  );
}

const customTableStyles = `
.creator-completed-table .ant-table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
  border: 1px solid #e0e0e0;
}
.creator-completed-table .ant-table-thead > tr > th {
  background-color: #f7f7f7 !important;
  color: #164679 !important;
  font-weight: 700;
  padding: 14px 12px !important;
  border-bottom: 3px solid #52c41a !important;
}
.creator-completed-table .ant-table-tbody > tr:hover > td {
  background-color: rgba(82, 196, 26, 0.1) !important;
  cursor: pointer;
}
`;
