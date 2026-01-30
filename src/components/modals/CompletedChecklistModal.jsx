import CommentHistory from "../common/CommentHistory";
import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Card,
  Descriptions,
  List,
  Avatar,
  Spin,
  Typography,
  Progress,
  Space,
  message,
  Drawer,
  Collapse,
} from "antd";
import {
  EyeOutlined,
  RightOutlined,
  UserOutlined,
  DownloadOutlined,
  LeftOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import DocumentSidebar from "../common/DocumentSidebar";
import { useGetChecklistCommentsQuery } from "../../api/checklistApi";
import { getFullUrl as getFullUrlUtil } from "../../utils/checklistUtils.js";

const { Text } = Typography;

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SECONDARY_PURPLE = "#7e6496";
const API_BASE_URL =
  import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// Helper function to get role tag
const getRoleTag = (role) => {
  let color = "blue";
  const roleLower = (role || "").toLowerCase();
  switch (roleLower) {
    case "rm":
      color = "purple";
      break;
    case "creator":
      color = "green";
      break;
    case "co_checker":
      color = "volcano";
      break;
    case "system":
      color = "default";
      break;
    default:
      color = "blue";
  }
  return (
    <Tag color={color} style={{ marginLeft: 8, textTransform: "uppercase" }}>
      {roleLower.replace(/_/g, " ")}
    </Tag>
  );
};

// Helper function to get checker status display
const getCheckerStatusDisplay = (checkerStatus, checklistStatus) => {
  // If checklist is approved/completed, all documents should show as approved by checker
  if (checklistStatus === "approved" || checklistStatus === "completed") {
    return {
      color: "green",
      text: "✅ Approved",
      icon: <CheckCircleOutlined />,
      tagColor: "#52c41a",
    };
  }

  // If checklist is rejected, all documents should show as rejected by checker
  if (checklistStatus === "rejected") {
    return {
      color: "red",
      text: "❌ Rejected",
      icon: <CloseCircleOutlined />,
      tagColor: "#f5222d",
    };
  }

  // If checklist is in co_checker_review, show individual document status
  if (!checkerStatus) {
    return {
      color: "orange",
      text: "📞 Pending Review",
      icon: <ClockCircleOutlined />,
      tagColor: "#fa8c16",
    };
  }

  const statusLower = checkerStatus.toLowerCase();

  switch (statusLower) {
    case "approved":
      return {
        color: "green",
        text: "✅ Approved",
        icon: <CheckCircleOutlined />,
        tagColor: "#52c41a",
      };
    case "rejected":
      return {
        color: "red",
        text: "❌ Rejected",
        icon: <CloseCircleOutlined />,
        tagColor: "#f5222d",
      };
    case "pending":
      return {
        color: "orange",
        text: "📞 Pending Review",
        icon: <ClockCircleOutlined />,
        tagColor: "#fa8c16",
      };
    case "reviewed":
      return {
        color: "blue",
        text: "👁️ Reviewed",
        icon: <EyeOutlined />,
        tagColor: "#1890ff",
      };
    case "deferred":
      return {
        color: "volcano",
        text: "⏱️ Deferred",
        icon: <ClockCircleOutlined />,
        tagColor: "#fa541c",
      };
    default:
      return {
        color: "default",
        text: checkerStatus,
        icon: null,
        tagColor: "#d9d9d9",
      };
  }
};

// Function to get expiry status
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;

  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");

  return expiry.isBefore(today) ? "expired" : "current";
};

// Helper function to get document status count
const getDocumentStatusCounts = (docs) => {
  const counts = {
    submitted: 0,
    waived: 0,
    deferred: 0,
    sighted: 0,
    tbo: 0,
    pendingrm: 0,
    pendingco: 0,
    approved: 0,
    total: docs.length,
  };

  docs.forEach((doc) => {
    const status = (doc.status || doc.action || "").toLowerCase().trim();

    if (status === "submitted") {
      counts.submitted++;
    } else if (status === "waived") {
      counts.waived++;
    } else if (status === "deferred") {
      counts.deferred++;
    } else if (status === "sighted") {
      counts.sighted++;
    } else if (status === "tbo") {
      counts.tbo++;
    } else if (status === "approved") {
      counts.approved++;
    } else if (status === "pendingrm") {
      counts.pendingrm++;
    } else if (status === "pendingco") {
      counts.pendingco++;
    } else if (status === "pending") {
      // Check if it's pending from RM or Co
      if (doc.category && doc.category.toLowerCase().includes("rm")) {
        counts.pendingrm++;
      } else {
        counts.pendingco++;
      }
    }
  });

  // Calculate total pending
  counts.pending = counts.pendingrm + counts.pendingco;

  // Calculate completed documents (all statuses except pending)
  counts.completed = counts.total - counts.pending;

  return counts;
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
};

const CompletedChecklistModal = ({ checklist, open, onClose, readOnly = false }) => {
  const [docs, setDocs] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [documentCounts, setDocumentCounts] = useState({
    submitted: 0,
    waived: 0,
    deferred: 0,
    sighted: 0,
    tbo: 0,
    pendingrm: 0,
    pendingco: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    total: 0,
  });
  const [supportingDocs, _] = useState([]);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    console.log("Original checklist documents:", checklist.documents);

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        console.log("Processing docList:", item.category, item.docList);
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          status: doc.status || doc.action || "pending",
          checkerStatus:
            doc.checkerStatus ||
            doc.coCheckerStatus ||
            doc.co_checker_status ||
            null,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) {
        console.log(
          "Processing single doc:",
          item.category,
          item.status || item.action,
        );
        return acc.concat({
          ...item,
          status: item.status || item.action || "pending",
          checkerStatus:
            item.checkerStatus ||
            item.coCheckerStatus ||
            item.co_checker_status ||
            null,
        });
      }
      return acc;
    }, []);

    console.log("Flattened documents:", flatDocs);

    const preparedDocs = flatDocs.map((doc, idx) => {
      // Determine final checker status based on overall checklist status
      let finalCheckerStatus = doc.checkerStatus || null;

      // CRITICAL FIX: If checklist is approved/completed, all documents should show as approved
      if (checklist.status === "approved" || checklist.status === "completed") {
        finalCheckerStatus = "approved";
      } else if (checklist.status === "rejected") {
        finalCheckerStatus = "rejected";
      } else {
        // For other statuses, use the individual document status
        finalCheckerStatus = doc.checkerStatus || "pending";
      }

      return {
        ...doc,
        docIdx: idx,
        status: doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        fileUrl: doc.fileUrl || null,
        expiryDate: doc.expiryDate || null,
        checkerStatus: doc.checkerStatus || null,
        finalCheckerStatus: finalCheckerStatus,
        name: doc.name || doc.documentName || `Document ${idx + 1}`,
      };
    });

    console.log(
      "Prepared docs with statuses:",
      preparedDocs.map((d) => ({
        name: d.name,
        status: d.status,
        action: d.action,
      })),
    );

    setDocs(preparedDocs);

    // Calculate document status counts
    const counts = getDocumentStatusCounts(preparedDocs);
    console.log("Calculated counts:", counts);
    setDocumentCounts(counts);
  }, [checklist]);

  const DocumentSidebar = ({ documents, open, onClose, supportingDocs }) => {
    // Combine regular docs and supporting docs
    const allDocs = useMemo(() => {
      const uploadedDocs = documents.filter(
        (d) =>
          d.fileUrl ||
          d.uploadData?.fileUrl ||
          d.filePath ||
          d.url ||
          d.uploadData?.status === "active",
      );

      const supporting = supportingDocs || [];

      return [...uploadedDocs, ...supporting];
    }, [documents, supportingDocs]);

    const groupedDocs = allDocs.reduce((acc, doc) => {
      const group = doc.category || "Supporting Documents";
      if (!acc[group]) acc[group] = [];
      acc[group].push(doc);
      return acc;
    }, {});

    const lastUpload =
      allDocs.length > 0
        ? allDocs
          .map(
            (d) => new Date(d.uploadDate || d.updatedAt || d.createdAt || 0),
          )
          .sort((a, b) => b - a)[0]
        : null;

    return (
      <Drawer
        title={
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 600 }}>Uploaded Documents</span>
            <Tag color="blue">{allDocs.length} doc(s)</Tag>
          </div>
        }
        placement="right"
        width={420}
        open={open}
        onClose={onClose}
      >
        <div style={{ marginBottom: 12, color: "#6b7280", fontSize: 13 }}>
          📄 Documents uploaded to this checklist
        </div>

        {Object.entries(groupedDocs).map(([category, docs]) => (
          <Collapse
            key={category}
            defaultActiveKey={[category]}
            expandIconPosition="end"
            style={{ marginBottom: 16 }}
            items={[
              {
                key: category,
                label: (
                  <b style={{ color: "#164679" }}>
                    {category} ({docs.length})
                  </b>
                ),
                children: docs.map((doc, idx) => {
                  // Determine file URL
                  const fileUrl =
                    doc.fileUrl ||
                    doc.uploadData?.fileUrl ||
                    doc.filePath ||
                    doc.url;

                  // Determine file name
                  const fileName =
                    doc.uploadData?.fileName ||
                    doc.name ||
                    doc.fileName ||
                    doc.documentName ||
                    "Unnamed Document";

                  // Determine upload date
                  const uploadDate =
                    doc.uploadDate ||
                    doc.uploadData?.createdAt ||
                    doc.updatedAt ||
                    doc.createdAt;

                  // Determine uploader
                  const uploadedBy =
                    doc.uploadedBy ||
                    doc.uploadData?.uploadedBy ||
                    doc.owner ||
                    "Unknown";

                  return (
                    <Card
                      key={idx}
                      size="small"
                      style={{
                        borderRadius: 10,
                        marginBottom: 12,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      {/* HEADER */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <b>{fileName}</b>
                        <Tag color={doc.status === "deleted" ? "red" : "green"}>
                          {doc.status === "deleted" ? "Deleted" : "Active"}
                        </Tag>
                      </div>

                      {/* DOC TYPE */}
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginBottom: 6,
                        }}
                      >
                        Type:{" "}
                        {doc.type || doc.uploadData?.fileType || "Document"}
                      </div>

                      {/* META */}
                      <div style={{ fontSize: 12, color: "#374151" }}>
                        🕒{" "}
                        {uploadDate
                          ? dayjs(uploadDate).format("DD MMM YYYY HH:mm:ss")
                          : "N/A"}
                        {"  •  "}
                        {doc.fileSize || doc.uploadData?.fileSize
                          ? formatFileSize(
                            doc.fileSize || doc.uploadData?.fileSize,
                          )
                          : "N/A"}
                      </div>

                      {/* CATEGORY */}
                      <div style={{ marginTop: 6 }}>
                        <Tag
                          color={
                            doc.category === "Supporting Documents"
                              ? "cyan"
                              : "purple"
                          }
                        >
                          {doc.category || "Supporting Document"}
                        </Tag>
                      </div>

                      {/* UPLOAD INFO */}
                      <div
                        style={{
                          marginTop: 10,
                          paddingLeft: 10,
                          borderLeft: "3px solid #84cc16",
                          fontSize: 12,
                        }}
                      >
                        <div>
                          Uploaded by <b>{uploadedBy}</b>
                        </div>
                        <div style={{ color: "#6b7280" }}>
                          {uploadDate
                            ? dayjs(uploadDate).format("DD MMM YYYY HH:mm:ss")
                            : ""}
                        </div>
                      </div>

                      {/* DOWNLOAD BUTTON */}
                      {fileUrl && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            marginTop: 10,
                          }}
                        >
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              const fullUrl = fileUrl.startsWith("http")
                                ? fileUrl
                                : `${API_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
                              window.open(fullUrl, "_blank");
                            }}
                            size="small"
                          >
                            Download
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                }),
              },
            ]}
          />
        ))}

        {/* FOOTER SUMMARY */}
        <Card size="small" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total Documents:</span>
            <b>{allDocs.length}</b>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span>Last Upload:</span>
            <b>
              {lastUpload
                ? dayjs(lastUpload).format("DD MMM YYYY HH:mm:ss")
                : "—"}
            </b>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span>RM Documents:</span>
            <b>
              {
                documents.filter((d) => d.fileUrl || d.uploadData?.fileUrl)
                  .length
              }
            </b>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <span>Supporting Docs:</span>
            <b>{supportingDocs?.length || 0}</b>
          </div>
        </Card>
      </Drawer>
    );
  };

  // Function to get checker status color for PDF
  const getCheckerStatusColorForPDF = (checkerStatus, checklistStatus) => {
    // If checklist is approved/completed, all documents are approved by checker
    if (checklistStatus === "approved" || checklistStatus === "completed") {
      return { bg: "#d4edda", color: "#155724" };
    }

    // If checklist is rejected, all documents are rejected by checker
    if (checklistStatus === "rejected") {
      return { bg: "#f8d7da", color: "#721c24" };
    }

    if (!checkerStatus) return { bg: "#f5f5f5", color: "#666" };

    const statusLower = checkerStatus.toLowerCase();
    switch (statusLower) {
      case "approved":
        return { bg: "#d4edda", color: "#155724" };
      case "rejected":
        return { bg: "#f8d7da", color: "#721c24" };
      case "pending":
        return { bg: "#fff3cd", color: "#856404" };
      case "reviewed":
        return { bg: "#cce5ff", color: "#004085" };
      case "deferred":
        return { bg: "#d1ecf1", color: "#0c5460" };
      default:
        return { bg: "#e2e3e5", color: "#383d41" };
    }
  };

  // Function to get expiry status for PDF
  const getExpiryStatusForPDF = (expiryDate) => {
    if (!expiryDate) return null;

    const today = dayjs().startOf("day");
    const expiry = dayjs(expiryDate).startOf("day");

    return expiry.isBefore(today) ? "expired" : "current";
  };

  // Function to generate and download PDF
  const downloadChecklistAsPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = await import("html2canvas");

      // Bank color scheme
      const bankColors = {
        primary: "#1a365d",
        secondary: "#2c5282",
        accent: "#0f766e",
        success: "#047857",
        warning: "#d97706",
        danger: "#dc2626",
        light: "#f8fafc",
        border: "#e2e8f0",
        text: "#334155",
        textLight: "#64748b",
      };

      // Helper function to get status colors
      const getStatusColor = (status) => {
        const statusLower = (status || "").toLowerCase();
        switch (statusLower) {
          case "submitted":
          case "approved":
            return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
          case "pendingrm":
            return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
          case "pendingco":
            return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
          case "waived":
            return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
          case "sighted":
            return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
          case "deferred":
            return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
          case "tbo":
            return { bg: "#f1f5f9", color: "#475569", border: "#94a3b8" };
          default:
            return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
        }
      };

      // Helper function for text truncation
      const truncateText = (text, maxLength) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
      };

      // Get checklist information
      const customerNumber =
        checklist?.customerNumber ||
        checklist?.title?.split("-")?.pop() ||
        "CUST-507249";
      const dclNo = checklist?.dclNo || "DCL-26-0036";
      const ibpsNo = checklist?.ibpsNo || "Not provided";
      const loanType = checklist?.loanType || "Equity Release Loan";
      const createdBy = checklist?.createdBy?.name || "Eric Mewa";
      const rm = checklist?.assignedToRM?.name || "mark";
      const coChecker =
        checklist?.assignedToCoChecker?.name ||
        checklist?.coChecker ||
        "Pending";
      const status = checklist?.status || "completed";
      const completedAt =
        checklist?.completedAt || checklist?.updatedAt || checklist?.createdAt;

      // Create PDF container
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.top = "0";
      pdfContainer.style.width = "794px";
      pdfContainer.style.padding = "20px 30px";
      pdfContainer.style.backgroundColor = "#ffffff";
      pdfContainer.style.fontFamily = "'Calibri', 'Arial', sans-serif";
      pdfContainer.style.color = "#333333";

      // Build the PDF content with bank-style design
      pdfContainer.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
       
        .pdf-header {
          border-bottom: 2px solid ${bankColors.primary};
          padding-bottom: 15px;
          margin-bottom: 20px;
          position: relative;
        }
       
        .bank-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
       
        .logo-circle {
          width: 50px;
          height: 50px;
          background: ${bankColors.primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 20px;
        }
       
        .bank-name {
          font-size: 20px;
          font-weight: bold;
          color: ${bankColors.primary};
          letter-spacing: 0.5px;
        }
       
        .bank-tagline {
          font-size: 10px;
          color: ${bankColors.textLight};
          margin-top: 2px;
          letter-spacing: 0.3px;
        }
       
        .document-title {
          font-size: 16px;
          font-weight: bold;
          color: ${bankColors.secondary};
          margin-bottom: 5px;
        }
       
        .document-subtitle {
          font-size: 12px;
          color: ${bankColors.textLight};
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
       
        .document-badge {
          background: ${bankColors.light};
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
       
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
       
        .section-card {
          background: white;
          border: 1px solid ${bankColors.border};
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
       
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin-bottom: 12px;
          padding-bottom: 6px;
          border-bottom: 1px solid ${bankColors.light};
          display: flex;
          align-items: center;
          gap: 8px;
        }
       
        .section-title::before {
          content: "▌";
          color: ${bankColors.accent};
          font-size: 12px;
        }
       
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 8px;
          font-size: 10px;
        }
       
        .info-item {
          padding: 8px;
          background: ${bankColors.light};
          border-radius: 4px;
          border-left: 3px solid ${bankColors.secondary};
        }
       
        .info-label {
          font-size: 9px;
          color: ${bankColors.textLight};
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }
       
        .info-value {
          font-size: 11px;
          font-weight: 600;
          color: ${bankColors.text};
        }
       
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
          margin-bottom: 15px;
          font-size: 9px;
        }
       
        .summary-card {
          padding: 8px;
          border-radius: 6px;
          text-align: center;
          background: ${bankColors.light};
          border: 1px solid ${bankColors.border};
        }
       
        .summary-number {
          font-size: 16px;
          font-weight: bold;
          color: ${bankColors.primary};
          margin: 4px 0;
        }
       
        .summary-label {
          font-size: 8px;
          color: ${bankColors.textLight};
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
       
        .progress-bar {
          height: 6px;
          background: ${bankColors.border};
          border-radius: 3px;
          overflow: hidden;
          margin: 12px 0;
        }
       
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${bankColors.success}, ${bankColors.accent});
          border-radius: 3px;
        }
       
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: ${bankColors.textLight};
        }
       
        .table-container {
          overflow-x: auto;
          margin-top: 12px;
        }
       
        .document-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
          table-layout: fixed;
        }
       
        .document-table th {
          background: ${bankColors.primary};
          color: white;
          text-align: left;
          padding: 8px 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-right: 1px solid rgba(255,255,255,0.2);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
       
        .document-table td {
          padding: 6px;
          border-bottom: 1px solid ${bankColors.border};
          vertical-align: top;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
       
        .document-table tr:nth-child(even) {
          background: ${bankColors.light};
        }
       
        .status-badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 8px;
          font-weight: 600;
          display: inline-block;
          border: 1px solid;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
       
        .comment-box {
          background: ${bankColors.light};
          border-left: 3px solid ${bankColors.accent};
          padding: 10px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 10px;
          line-height: 1.4;
        }
       
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
       
        .comment-author {
          font-weight: 600;
          color: ${bankColors.primary};
          font-size: 10px;
        }
       
        .comment-date {
          font-size: 9px;
          color: ${bankColors.textLight};
        }
       
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(0,0,0,0.03);
          font-weight: bold;
          pointer-events: none;
          z-index: 1;
        }
       
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid ${bankColors.border};
          text-align: center;
          font-size: 9px;
          color: ${bankColors.textLight};
          line-height: 1.4;
        }
       
        .disclaimer {
          background: ${bankColors.light};
          padding: 8px;
          border-radius: 3px;
          margin-top: 8px;
          font-size: 8px;
        }
       
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid ${bankColors.border};
        }
       
        .document-info {
          flex: 1;
        }
       
        .current-status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 140px;
        }
       
        .status-label {
          font-size: 9px;
          color: ${bankColors.textLight};
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }
       
        .status-display {
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          border: 2px solid;
          min-width: 120px;
        }
      </style>

      <!-- Watermark -->
      <div class="watermark">COMPLETED CHECKLIST</div>

      <!-- Header with Bank Logo -->
      <div class="pdf-header">
        <div class="bank-logo">
          <div class="logo-circle">NCBA</div>
          <div>
            <div class="bank-name">COMPLETED CHECKLIST REVIEW</div>
            <div class="bank-tagline">Document Control System</div>
          </div>
        </div>
       
        <!-- Document Info and Status Section -->
        <div class="header-content">
          <div class="document-info">
            <div class="document-title">Completed Checklist - ${customerNumber}</div>
            <div class="document-subtitle">
              <span class="document-badge">
                <span class="badge-dot" style="background: ${bankColors.primary}"></span>
                DCL No: <strong>${dclNo}</strong>
              </span>
              <span class="document-badge">
                <span class="badge-dot" style="background: ${bankColors.secondary}"></span>
                IBPS No: <strong>${ibpsNo}</strong>
              </span>
              <span class="document-badge">
                <span class="badge-dot" style="background: ${bankColors.accent}"></span>
                Completed: <strong>${completedAt ? dayjs(completedAt).format("DD MMM YYYY, HH:mm:ss") : dayjs().format("DD MMM YYYY, HH:mm:ss")}</strong>
              </span>
            </div>
          </div>
         
          <!-- Current Status Display -->
          <div class="current-status-section">
            <div class="status-label">Overall Status</div>
            <div class="status-display" style="
              background: #d1fae5;
              color: #065f46;
              border-color: #10b981;
            ">
              COMPLETED
            </div>
          </div>
        </div>
      </div>

      <!-- Checklist Information -->
      <div class="section-card">
        <div class="section-title">Checklist Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Customer Number</div>
            <div class="info-value">${customerNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">DCL Number</div>
            <div class="info-value">${dclNo}</div>
          </div>
          <div class="info-item">
            <div class="info-label">IBPS Number</div>
            <div class="info-value">${ibpsNo}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Loan Type</div>
            <div class="info-value">${loanType}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Created By</div>
            <div class="info-value">${createdBy}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Relationship Manager</div>
            <div class="info-value">${rm}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Co-Checker</div>
            <div class="info-value">${coChecker}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Completed Date</div>
            <div class="info-value">${completedAt ? dayjs(completedAt).format("DD MMM YYYY, HH:mm:ss") : "N/A"}</div>
          </div>
        </div>
      </div>

      <!-- Document Summary -->
      <div class="section-card">
        <div class="section-title">Document Summary</div>
       
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-label">Total</div>
            <div class="summary-number">${documentCounts.total}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Submitted</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${documentCounts.submitted}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Approved</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${documentCounts.approved}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Waived</div>
            <div class="summary-number" style="color: ${bankColors.warning};">
              ${documentCounts.waived}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Deferred</div>
            <div class="summary-number" style="color: #8b5cf6;">
              ${documentCounts.deferred}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Sighted</div>
            <div class="summary-number" style="color: #3b82f6;">
              ${documentCounts.sighted}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-label">TBO</div>
            <div class="summary-number" style="color: #06b6d4;">
              ${documentCounts.tbo}
            </div>
          </div>
         
          <div class="summary-card">
            <div class="summary-label">Completed</div>
            <div class="summary-number" style="color: ${bankColors.success};">
              ${documentCounts.completed}
            </div>
          </div>
        </div>
       
        <div class="progress-text">
          <span>Completion Progress:</span>
          <span>100% (${documentCounts.completed}/${documentCounts.total})</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 100%"></div>
        </div>
        <div style="font-size: 9px; color: ${bankColors.success}; margin-top: 8px; text-align: center; font-weight: 600;">
          ✓ This checklist has been completed and all documents are processed
        </div>
      </div>

      <!-- Document Details -->
      <div class="section-card">
        <div class="section-title">Document Details</div>
        <div class="table-container">
          <table class="document-table">
            <thead>
              <tr>
                <th width="10%">Category</th>
                <th width="18%">Document Name</th>
                <th width="10%">Action</th>
                <th width="10%">Status</th>
                <th width="12%">Checker Status</th>
                <th width="12%">Co Comment</th>
                <th width="10%">Expiry Date</th>
                <th width="10%">Validity</th>
                <th width="8%">File</th>
              </tr>
            </thead>
            <tbody>
              ${docs
          .map((doc, index) => {
            const statusColor = getStatusColor(doc.status);
            const checkerStatusColor = getStatusColor(
              doc.checkerStatus || doc.finalCheckerStatus,
            );
            const statusLabel =
              doc.status === "deferred" && doc.deferralNo
                ? `Deferred (${doc.deferralNo})`
                : (doc.status || "N/A").toUpperCase();

            const checkerStatusLabel =
              doc.checkerStatus || doc.finalCheckerStatus
                ? (
                  doc.checkerStatus ||
                  doc.finalCheckerStatus ||
                  "N/A"
                ).toUpperCase()
                : "—";

            const expiryStatus =
              (doc.category || "").toLowerCase().trim() ===
                "compliance documents"
                ? getExpiryStatus(doc.expiryDate)
                : null;

            const hasFile = doc.fileUrl ? "Yes" : "No";

            const truncatedName = truncateText(doc.name, 35);
            const truncatedCoComment = truncateText(doc.comment, 30);

            return `
                <tr>
                  <td style="font-weight: 600; color: ${bankColors.secondary};">
                    ${doc.category || "N/A"}
                  </td>
                  <td title="${doc.name || "N/A"}">${truncatedName}</td>
                  <td>
                    <span style="text-transform: uppercase; font-weight: 600; color: ${bankColors.primary}; font-size: 8px;">
                      ${doc.action || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" style="
                      background: ${statusColor.bg};
                      color: ${statusColor.color};
                      border-color: ${statusColor.border};
                    ">
                      ${statusLabel}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" style="
                      background: ${checkerStatusColor.bg};
                      color: ${checkerStatusColor.color};
                      border-color: ${checkerStatusColor.border};
                    ">
                      ${checkerStatusLabel}
                    </span>
                  </td>
                  <td title="${doc.comment || "—"}">
                    ${truncatedCoComment || "—"}
                  </td>
                  <td style="font-family: monospace; font-size: 8px;">
                    ${doc.expiryDate ? dayjs(doc.expiryDate).format("DD/MM/YY") : "—"}
                  </td>
                  <td>
                    ${(() => {
                if (!expiryStatus) return "—";
                return `<span class="status-badge" style="
                        background: ${expiryStatus === "current" ? "#d1fae5" : "#fee2e2"};
                        color: ${expiryStatus === "current" ? "#065f46" : "#991b1b"};
                        border-color: ${expiryStatus === "current" ? "#10b981" : "#ef4444"};
                      ">
                        ${expiryStatus === "current" ? "CUR" : "EXP"}
                      </span>`;
              })()}
                  </td>
                  <td style="text-align: center;">
                    ${hasFile}
                  </td>
                </tr>
              `;
          })
          .join("")}
            </tbody>
          </table>
        </div>
        <div style="font-size: 8px; color: ${bankColors.textLight}; marginTop: 10px; textAlign: center;">
          Showing ${docs.length} documents • Completed: ${documentCounts.completed} • Pending: ${documentCounts.pending}
        </div>
      </div>

      <!-- Comment History -->
      ${comments && comments.length > 0
          ? `
        <div class="section-card">
          <div class="section-title">Comment Trail & History (${comments.length} comments)</div>
          <div style="max-height: 200px; overflow-y: auto; border: 1px solid ${bankColors.border}; border-radius: 4px; padding: 10px;">
            ${comments
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt || b.timestamp) -
                new Date(a.createdAt || a.timestamp),
            )
            .slice(0, 5)
            .map((comment, index) => {
              const userName = comment.userId?.name || "System";
              const userRole = comment.userId?.role || "system";
              const message = comment.message || "";
              const timestamp = comment.createdAt || comment.timestamp;
              const formattedTime = dayjs(timestamp).format(
                "DD MMM YYYY HH:mm:ss",
              );

              // Determine role tag color
              let roleColor = "blue";
              const roleLower = (userRole || "").toLowerCase();
              switch (roleLower) {
                case "rm":
                  roleColor = "purple";
                  break;
                case "creator":
                  roleColor = "green";
                  break;
                case "co_checker":
                case "checker":
                  roleColor = "volcano";
                  break;
                case "system":
                  roleColor = "default";
                  break;
                default:
                  roleColor = "blue";
              }

              const roleBg =
                roleColor === "purple"
                  ? "#d6c1ff"
                  : roleColor === "green"
                    ? "#d4edda"
                    : roleColor === "volcano"
                      ? "#ffccc7"
                      : roleColor === "default"
                        ? "#f0f0f0"
                        : "#d0e8ff";

              const roleText =
                roleColor === "purple"
                  ? "#7e6496"
                  : roleColor === "green"
                    ? "#155724"
                    : roleColor === "volcano"
                      ? "#721c24"
                      : roleColor === "default"
                        ? "#666"
                        : "#004085";

              return `
              <div style="margin-bottom: ${index < 4 ? "10px" : "0"}; padding-bottom: ${index < 4 ? "10px" : "0"}; border-bottom: ${index < 4 ? "1px dashed ${bankColors.border}" : "none"};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${bankColors.primary}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">
                      ${userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style="font-weight: bold; color: ${bankColors.primary}; font-size: 10px;">
                        ${userName}
                      </div>
                      <span style="
                        display: inline-block;
                        padding: 1px 6px;
                        border-radius: 8px;
                        background: ${roleBg};
                        color: ${roleText};
                        font-size: 8px;
                        font-weight: bold;
                        text-transform: uppercase;
                        margin-top: 2px;
                      ">
                        ${roleLower.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  <div style="font-size: 9px; color: ${bankColors.textLight};">
                    ${formattedTime}
                  </div>
                </div>
                <div style="margin-left: 32px; font-size: 10px; line-height: 1.4; color: ${bankColors.text}; word-break: break-word;">
                  ${message}
                </div>
              </div>
            `;
            })
            .join("")}
          </div>
        </div>
      `
          : `
        <div class="section-card">
          <div class="section-title">Comment Trail & History</div>
          <div style="text-align: center; padding: 20px; color: ${bankColors.textLight}; font-size: 10px; border: 1px dashed ${bankColors.border}; border-radius: 4px;">
            No historical comments yet.
          </div>
        </div>
      `
        }

      <!-- Footer -->
      <div class="footer">
        <div>
          <strong>COMPLETED CHECKLIST REPORT</strong> •
          Document Control System •
          Generated by: ${createdBy} •
          Page 1 of 1
        </div>
        <div class="disclaimer">
          This is a system-generated document for completed checklists. For official purposes only.
          Any unauthorized reproduction or distribution is strictly prohibited.
          Generated on ${dayjs().format("DD MMM YYYY, HH:mm:ss")} •
          DCL: ${dclNo} • Customer: ${customerNumber} • Status: ${status.replace(/_/g, " ").toUpperCase()}
        </div>
      </div>
    `;

      document.body.appendChild(pdfContainer);

      // Wait for images to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas.default(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        width: pdfContainer.offsetWidth,
        height: pdfContainer.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        "",
        "FAST",
      );
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight,
          "",
          "FAST",
        );
        heightLeft -= pageHeight;
      }

      const fileName = `Completed_Checklist_${dclNo}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
      pdf.save(fileName);

      document.body.removeChild(pdfContainer);

      message.success("Checklist PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 120,
      render: (text) => (
        <span
          style={{ fontSize: 12, color: SECONDARY_PURPLE, fontWeight: 500 }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "Co Status",
      dataIndex: "status",
      width: 120,
      render: (status, record) => {
        let color = "default";
        const statusLower = (status || "").toLowerCase();

        switch (statusLower) {
          case "submitted":
            color = "green";
            break;
          case "approved":
            color = "green";
            break;
          case "pendingrm":
            color = "#6E0C05";
            break;
          case "pendingco":
            color = "#6E0549";
            break;
          case "waived":
            color = "#C4AA1D";
            break;
          case "sighted":
            color = "#02ECF5";
            break;
          case "deferred":
            color = "#55C41D";
            break;
          case "tbo":
            color = "#0F13E5";
            break;
          default:
            color = "default";
        }

        const statusLabel =
          status === "deferred" && record.deferralNo
            ? `Deferred (${record.deferralNo})`
            : status;

        return (
          <Tag className="status-tag" color={color}>
            {statusLabel}
          </Tag>
        );
      },
    },
    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      width: 140,
      render: (finalCheckerStatus, record) => {
        // FORCE override based on checklist status
        const checklistStatus = checklist?.status;
        let displayStatus = finalCheckerStatus;

        // Always prioritize checklist status
        if (checklistStatus === "approved" || checklistStatus === "completed") {
          displayStatus = "approved";
        } else if (checklistStatus === "rejected") {
          displayStatus = "rejected";
        }

        const statusDisplay = getCheckerStatusDisplay(
          displayStatus,
          checklistStatus,
        );

        return (
          <Tag
            color={statusDisplay.color}
            icon={statusDisplay.icon}
            style={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {statusDisplay.text}
          </Tag>
        );
      },
    },
    {
      title: "Co Comment",
      dataIndex: "comment",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      width: 100,
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        return record.expiryDate
          ? dayjs(record.expiryDate).format("DD/MM/YYYY")
          : "-";
      },
    },
    {
      title: "Expiry Status",
      dataIndex: "expiryStatus",
      width: 120,
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        const status = getExpiryStatus(record.expiryDate);

        if (!status) return "-";

        return (
          <Button
            size="small"
            type="primary"
            danger={status === "expired"}
            style={{
              backgroundColor: status === "current" ? "#52c41a" : undefined,
              borderColor: status === "current" ? "#52c41a" : undefined,
              cursor: "default",
              fontWeight: "bold",
            }}
          >
            {status === "current" ? "Current" : "Expired"}
          </Button>
        );
      },
    },
    {
      title: "View",
      key: "view",
      width: 80,
      render: (_, record) =>
        record.fileUrl && (
          <>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(
                  getFullUrlUtil(record.fileUrl || record.uploadData?.fileUrl),
                  "_blank",
                )
              }
              style={{ borderRadius: 6 }}
            >
              View
            </Button>
          </>
        ),
    },
  ];

  // Calculate progress percentage - For completed checklists, it should always be 100%
  const progressPercent = 100; // Always 100% for completed checklists

  // Calculate document counts for display
  const docsCount = docs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl,
  ).length;
  const supportingDocsCount = supportingDocs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl || d.url,
  ).length;

  return (
    <Modal
      title={
        <div style={{ color: "white", fontWeight: "bold" }}>
          Completed Checklist - {checklist?.title || ""}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      styles={{
        header: {
          background: PRIMARY_BLUE,
          borderBottom: `1px solid ${PRIMARY_BLUE}`,
        },
      }}
      footer={[
        <Button
          key="download"
          icon={<FilePdfOutlined />}
          loading={isGeneratingPDF}
          onClick={downloadChecklistAsPDF}
          type="primary"
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
            marginRight: "auto",
          }}
        >
          Download as PDF
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {/* 🔹 VIEW DOCUMENTS BUTTON (ADDED) */}
      <div className="doc-sidebar-toggle" style={{ marginBottom: 16 }}>
        <Button
          icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
          onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
        >
          View Documents
          <Tag color="green" style={{ marginLeft: 6 }}>
            Docs: {docsCount}
          </Tag>
          {supportingDocsCount > 0 && (
            <Tag color="blue" style={{ marginLeft: 6 }}>
              Supporting: {supportingDocsCount}
            </Tag>
          )}
        </Button>
      </div>

      {/* 🔹 DOCUMENT SIDEBAR (ADDED) */}
      <DocumentSidebar
        supportingDocs={supportingDocs}
        documents={docs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {checklist && (
        <>
          <Card
            className="checklist-info-card"
            size="small"
            title={
              <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
                Checklist Details
              </span>
            }
            style={{
              marginBottom: 18,
              borderRadius: 10,
              border: `1px solid #e0e0e0`,
            }}
          >
            <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
              <Descriptions.Item label="DCL No">
                {checklist.dclNo}
              </Descriptions.Item>
              <Descriptions.Item label="IBPS No">
                {checklist.ibpsNo || "Not provided"}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {checklist.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="Loan Type">
                {checklist.loanType}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {checklist.createdBy?.name}
              </Descriptions.Item>
              <Descriptions.Item label="RM">
                {checklist.assignedToRM?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Co-Checker">
                {checklist.assignedToCoChecker?.name || "Pending"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">{checklist.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Completed At">
                {checklist.completedAt || checklist.updatedAt || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <div
            style={{
              padding: "16px",
              background: "#f7f9fc",
              borderRadius: 8,
              border: "1px solid #e0e0e0",
              marginBottom: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
                Total: {documentCounts.total}
              </div>
              <div style={{ fontWeight: "700", color: "green" }}>
                Submitted: {documentCounts.submitted}
              </div>
              <div style={{ fontWeight: "700", color: "#faad14" }}>
                Waived: {documentCounts.waived}
              </div>
              <div style={{ fontWeight: "700", color: "#fa541c" }}>
                Deferred: {documentCounts.deferred}
              </div>
              <div style={{ fontWeight: "700", color: "#1890ff" }}>
                Sighted: {documentCounts.sighted}
              </div>
              <div style={{ fontWeight: "700", color: "#722ed1" }}>
                TBO: {documentCounts.tbo}
              </div>
            </div>
            <Progress percent={progressPercent} status="active" />
            <div
              style={{
                textAlign: "center",
                marginTop: "8px",
                fontWeight: "600",
                color: PRIMARY_BLUE,
              }}
            >
              Checklist Complete - All documents processed
            </div>
          </div>

          <Table
            className="doc-table"
            columns={columns}
            dataSource={docs}
            pagination={false}
            rowKey="docIdx"
            size="small"
            scroll={{ x: "max-content" }}
          />

          <div style={{ marginTop: 24 }}>
            <h4>Comment Trail & History</h4>
            <CommentHistory comments={comments} isLoading={commentsLoading} />
          </div>
        </>
      )}
    </Modal>
  );
};

export default CompletedChecklistModal;
