import { DatePicker } from "antd";
import moment from "moment";
import dayjs from "dayjs";
import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Input,
  Select,
  Card,
  Descriptions,
  message,
  Upload,
  Spin,
  List,
  Avatar,
  Popconfirm,
  Progress,
  Drawer,
  Typography,
  Collapse,
  Divider,
  Row,
  Col,
  Space,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  UserOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  DownloadOutlined,
  ClockCircleOutlined as TimeOutlined,
  RightOutlined,
  LeftOutlined,
  FilePdfOutlined as PdfIcon,
  DeleteOutlined,
} from "@ant-design/icons";

import { loanTypeDocuments } from "../../pages/docTypes";
import {
  useSubmitChecklistToRMMutation,
  useUpdateChecklistStatusMutation,
  useGetChecklistCommentsQuery,
  useSaveChecklistDraftMutation,
} from "../../api/checklistApi";
import CommentHistory from "../common/CommentHistory";
import DocumentInputSectionCoCreator from "../creator/DocumentInputSection";

const { Option } = Select;
const { Text } = Typography;

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SECONDARY_PURPLE = "#7e6496";

const API_BASE_URL =
  import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// ------------------ ENHANCED PROGRESS CALCULATION FUNCTIONS ------------------
const calculateDocumentStats = (docs) => {
  const total = docs.length;

  // Count all status types from CO perspective
  const submitted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "submitted" ||
      d.action?.toLowerCase() === "submitted" ||
      d.coStatus?.toLowerCase() === "submitted",
  ).length;

  const pendingFromRM = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingrm" ||
      d.action?.toLowerCase() === "pendingrm" ||
      d.coStatus?.toLowerCase() === "pendingrm",
  ).length;

  const pendingFromCo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "pendingco" ||
      d.action?.toLowerCase() === "pendingco" ||
      d.coStatus?.toLowerCase() === "pendingco",
  ).length;

  const deferred = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "deferred" ||
      d.action?.toLowerCase() === "deferred" ||
      d.coStatus?.toLowerCase() === "deferred",
  ).length;

  const sighted = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "sighted" ||
      d.action?.toLowerCase() === "sighted" ||
      d.coStatus?.toLowerCase() === "sighted",
  ).length;

  const waived = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "waived" ||
      d.action?.toLowerCase() === "waived" ||
      d.coStatus?.toLowerCase() === "waived",
  ).length;

  const tbo = docs.filter(
    (d) =>
      d.status?.toLowerCase() === "tbo" ||
      d.action?.toLowerCase() === "tbo" ||
      d.coStatus?.toLowerCase() === "tbo",
  ).length;

  // Checker review statuses
  const checkerApproved = docs.filter(
    (d) =>
      d.checkerStatus &&
      (d.checkerStatus.toLowerCase().includes("approved") ||
        d.checkerStatus.toLowerCase() === "approved"),
  ).length;

  const checkerRejected = docs.filter(
    (d) =>
      d.checkerStatus &&
      (d.checkerStatus.toLowerCase().includes("rejected") ||
        d.checkerStatus.toLowerCase() === "rejected"),
  ).length;

  const checkerReviewed = docs.filter(
    (d) =>
      d.checkerStatus &&
      !["not reviewed", "pending", null, undefined].includes(
        d.checkerStatus?.toLowerCase(),
      ),
  ).length;

  const checkerPending = docs.filter(
    (d) =>
      !d.checkerStatus ||
      ["not reviewed", "pending", null, undefined].includes(
        d.checkerStatus?.toLowerCase(),
      ),
  ).length;

  // RM statuses
  const rmSubmitted = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("submitted") ||
        d.rmStatus.toLowerCase().includes("approved") ||
        d.rmStatus.toLowerCase().includes("satisfactory")),
  ).length;

  const rmPending = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("pending") ||
        d.rmStatus.toLowerCase().includes("awaiting")),
  ).length;

  const rmDeferred = docs.filter(
    (d) =>
      d.rmStatus &&
      (d.rmStatus.toLowerCase().includes("deferred") ||
        d.rmStatus.toLowerCase().includes("returned")),
  ).length;

  // FIXED PROGRESS CALCULATION:
  // Documents that should be considered as "completed" for progress calculation
  const completedDocs = docs.filter((d) => {
    const status = (d.status || d.action || "").toLowerCase();
    // Documents with these statuses are considered "completed" or "not pending"
    return (
      status === "submitted" ||
      status === "sighted" ||
      status === "waived" ||
      status === "tbo"
    );
    // Note: "deferred" is NOT considered completed
  }).length;

  // Documents that are still pending or incomplete
  const incompleteDocs = docs.filter((d) => {
    const status = (d.status || d.action || "").toLowerCase();
    return (
      status === "pendingrm" || status === "pendingco" || status === "deferred"
    );
  }).length;

  // Calculate progress percentage
  // Total relevant docs = completed + incomplete
  const totalRelevantDocs = completedDocs + incompleteDocs;

  let progressPercent = 0;
  if (totalRelevantDocs === 0) {
    progressPercent = 0;
  } else {
    progressPercent = Math.round((completedDocs / totalRelevantDocs) * 100);
  }

  return {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    checkerApproved,
    checkerRejected,
    checkerReviewed,
    checkerPending,
    rmSubmitted,
    rmPending,
    rmDeferred,
    progressPercent,
    completedDocs, // Added for clarity
    incompleteDocs, // Added for clarity
    totalRelevantDocs, // Added for clarity
  };
};

// Helper to ensure file URL includes the base URL
const getFullUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ------------------ Upload Utility Function ------------------
const uploadFileToBackend = async (
  file,
  checklistId,
  documentId,
  documentName,
  category,
) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("checklistId", checklistId);
  formData.append("documentId", documentId);
  formData.append("documentName", documentName);
  formData.append("category", category);

  try {
    const response = await fetch(`${API_BASE_URL}/api/uploads`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Upload failed");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    message.error(error.message || "File upload failed");
    throw error;
  }
};

// ------------------ Format File Size ------------------
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Custom CSS
const customStyles = `
  .ant-modal-header { background-color: ${PRIMARY_BLUE} !important; padding: 18px 24px !important; }
  .ant-modal-title { color: white !important; font-size: 1.15rem !important; font-weight: 700 !important; letter-spacing: 0.5px; }
  .ant-modal-close-x { color: white !important; }

  .checklist-info-card .ant-card-head { border-bottom: 2px solid ${ACCENT_LIME} !important; }
  .checklist-info-card .ant-descriptions-item-label { font-weight: 600 !important; color: ${SECONDARY_PURPLE} !important; padding-bottom: 4px; }
  .checklist-info-card .ant-descriptions-item-content { color: ${PRIMARY_BLUE} !important; font-weight: 700 !important; font-size: 13px !important; }

  .doc-table.ant-table-wrapper table { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
  .doc-table .ant-table-thead > tr > th { background-color: #f7f9fc !important; color: ${PRIMARY_BLUE} !important; font-weight: 600 !important; padding: 12px 16px !important; }
  .doc-table .ant-table-tbody > tr > td { padding: 10px 16px !important; border-bottom: 1px dashed #f0f0f0 !important; }

  .ant-input, .ant-select-selector { border-radius: 6px !important; border-color: #e0e0e0 !important; }
  .ant-input:focus, .ant-select-focused .ant-select-selector { box-shadow: 0 0 0 2px rgba(22, 70, 121, 0.2) !important; border-color: ${PRIMARY_BLUE} !important; }

  .status-tag { font-weight: 700 !important; border-radius: 999px !important; padding: 3px 8px !important; text-transform: capitalize; min-width: 80px; text-align: center; display: inline-flex; align-items: center; gap: 4px; justify-content: center; }

  .ant-modal-footer .ant-btn { border-radius: 8px; font-weight: 600; height: 38px; padding: 0 16px; }
  .ant-modal-footer .ant-btn-primary { background-color: ${PRIMARY_BLUE} !important; border-color: ${PRIMARY_BLUE} !important; }
 
  /* PDF specific styles */
  .pdf-export-container { background: white; padding: 20px; font-family: Arial, sans-serif; }
  .pdf-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid ${PRIMARY_BLUE}; padding-bottom: 15px; }
  .pdf-title { color: ${PRIMARY_BLUE}; font-size: 24px; font-weight: bold; }
  .pdf-subtitle { color: #666; font-size: 16px; margin-top: 5px; }
  .pdf-section { margin-bottom: 20px; }
  .pdf-section-title { background: #f7f9fc; padding: 8px 12px; border-left: 4px solid ${PRIMARY_BLUE}; font-weight: bold; color: ${PRIMARY_BLUE}; margin-bottom: 10px; }
  .pdf-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .pdf-table th { background: #f0f0f0; padding: 8px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
  .pdf-table td { padding: 8px; border: 1px solid #ddd; }
  .pdf-tag { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: bold; text-align: center; min-width: 70px; }
  .pdf-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
  .pdf-info-item { border: 1px solid #e0e0e0; padding: 10px; border-radius: 6px; }
  .pdf-info-label { font-weight: bold; color: ${SECONDARY_PURPLE}; font-size: 12px; }
  .pdf-info-value { color: ${PRIMARY_BLUE}; font-weight: bold; font-size: 13px; margin-top: 4px; }
 
  /* Document sidebar styles */
  .doc-sidebar-toggle {
    position: absolute;
    top: 16px;
    right: 90px;
    z-index: 10;
  }
`;

// ---------------- DOCUMENT SIDEBAR (UPDATED TO SHOW SUPPORTING DOCS) ----------------
const DocumentSidebar = ({ documents, open, onClose, supportingDocs }) => {
  const uploadedDocs = documents.filter((d) => d.fileUrl);

  // Combine regular docs and supporting docs for sidebar
  const allDocs = [...uploadedDocs, ...supportingDocs];

  const groupedDocs = allDocs.reduce((acc, doc) => {
    const group = doc.category || "Main Documents";
    if (!acc[group]) acc[group] = [];
    acc[group].push(doc);
    return acc;
  }, {});

  const lastUpload =
    allDocs.length > 0
      ? allDocs
        .map(
          (d) =>
            new Date(
              d.uploadData?.createdAt ||
              d.uploadedAt ||
              d.updatedAt ||
              d.createdAt ||
              0,
            ),
        )
        .sort((a, b) => b - a)[0]
      : null;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>Uploaded Documents</span>
          <Tag color="blue">{allDocs.length} doc</Tag>
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
              children: docs.map((doc, idx) => (
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
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <b>{doc.uploadData?.fileName || doc.name}</b>
                    <Tag
                      color={
                        doc.uploadData?.status === "active"
                          ? "green"
                          : doc.isSupporting
                            ? "blue"
                            : "orange"
                      }
                    >
                      {doc.uploadData?.status === "active"
                        ? "Active"
                        : doc.isSupporting
                          ? "Supporting"
                          : "Regular"}
                    </Tag>
                  </div>

                  {/* DOC ID */}
                  <div
                    style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}
                  >
                    ID: {doc.uploadData?._id || doc.id || doc._id || "—"}
                  </div>

                  {/* META */}
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    🕒{" "}
                    {doc.uploadData?.createdAt
                      ? dayjs(doc.uploadData.createdAt).format(
                        "DD MMM YYYY HH:mm:ss",
                      )
                      : doc.uploadedAt
                        ? dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm:ss")
                        : "N/A"}
                    {"  •  "}
                    {doc.uploadData?.fileSize
                      ? formatFileSize(doc.uploadData.fileSize)
                      : "N/A"}
                    {"  •  "}
                    {doc.uploadData?.fileType || "Unknown"}
                  </div>

                  {/* CATEGORY */}
                  <div style={{ marginTop: 6 }}>
                    <Tag color="purple">{doc.category || "Supporting"}</Tag>
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
                      Uploaded by{" "}
                      <b>{doc.uploadData?.uploadedBy || "Current User"}</b>
                    </div>
                    <div style={{ color: "#6b7280" }}>
                      {doc.uploadData?.createdAt
                        ? dayjs(doc.uploadData.createdAt).format(
                          "DD MMM YYYY HH:mm:ss",
                        )
                        : doc.uploadedAt
                          ? dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm:ss")
                          : ""}
                    </div>
                  </div>

                  {/* OWNER + DOWNLOAD */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 10,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      👤 Document:{" "}
                      <b>{doc.uploadData?.documentName || doc.name}</b>
                    </div>

                    {(doc.uploadData?.status === "active" || doc.fileUrl) && (
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          window.open(
                            getFullUrl(doc.fileUrl || doc.uploadData?.fileUrl),
                            "_blank",
                          )
                        }
                      >
                        Download
                      </Button>
                    )}
                  </div>
                </Card>
              )),
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
      </Card>
    </Drawer>
  );
};

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
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;

  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");

  return expiry.isBefore(today) ? "expired" : "current";
};

const ReviewChecklistModal = ({ checklist, open, onClose, readOnly = false }) => {
  const [docs, setDocs] = useState([]);
  const [newDocName, setNewDocName] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [creatorComment, setCreatorComment] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState(null);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // NEW: Supporting documents state
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);

  // FIXED: Properly destructure the mutation hooks
  const [submitRmChecklist, { isLoading: isSubmittingToRM }] =
    useSubmitChecklistToRMMutation();
  const [updateChecklistStatus, { isLoading: isCheckerSubmitting }] =
    useUpdateChecklistStatusMutation();
  const [saveDraft, { isLoading: isSavingDraft }] =
    useSaveChecklistDraftMutation();
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
    checklist?.status?.toLowerCase(),
  );

  const initializeDocsFromLoanType = (loanType) => {
    const loanDocs = loanTypeDocuments[loanType] || [];

    const flattenedDocs = loanDocs.flatMap((group, groupIdx) =>
      group.documents.map((docName, docIdx) => ({
        docIdx: `${groupIdx}-${docIdx}`,
        name: docName,
        category: group.title,
        status: "pendingrm",
        action: "pendingrm",
        comment: "",
        fileUrl: null,
        expiryDate: null,
        finalCheckerStatus: "pending",
      })),
    );

    setDocs(flattenedDocs);
  };

  const handleLoanTypeChange = (value) => {
    setSelectedLoanType(value);
    initializeDocsFromLoanType(value);
    setSelectedCategoryName(null);
  };

  const handleAddNewDocument = () => {
    if (!newDocName.trim() || !selectedCategoryName) {
      return message.error(
        "Please enter a document name and select a category.",
      );
    }

    const exists = docs.some(
      (d) =>
        d.name.toLowerCase() === newDocName.trim().toLowerCase() &&
        d.category === selectedCategoryName,
    );

    if (exists) {
      return message.error("This document already exists in this category.");
    }

    setDocs((prevDocs) => [
      ...prevDocs,
      {
        docIdx: prevDocs.length,
        name: newDocName.trim(),
        category: selectedCategoryName,
        status: "pendingrm",
        action: "pendingrm",
        comment: "",
        fileUrl: null,
        expiryDate: null,
        finalCheckerStatus: "pending",
      },
    ]);

    message.success(
      `Document '${newDocName.trim()}' added to ${selectedCategoryName}.`,
    );

    setNewDocName("");
    setSelectedCategoryName(null);
  };

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          checkerStatus: doc.checkerStatus || item.checkerStatus,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) return acc.concat(item);
      return acc;
    }, []);

    const preparedDocs = flatDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status || "pendingrm",
      action: doc.status || "pendingrm",
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      finalCheckerStatus:
        doc.checkerStatus || doc.finalCheckerStatus || "pending",
    }));

    setDocs(preparedDocs);
  }, [checklist]);

  // Calculate document stats using the new function
  const documentStats = useMemo(() => {
    return calculateDocumentStats(docs);
  }, [docs]);

  // Get document stats from the calculation
  const {
    total,
    submitted,
    pendingFromRM,
    pendingFromCo,
    deferred,
    sighted,
    waived,
    tbo,
    checkerApproved,
    checkerRejected,
    checkerReviewed,
    checkerPending,
    rmSubmitted,
    rmPending,
    rmDeferred,
    progressPercent,
  } = documentStats;

  // NEW: Handle supporting document upload
  const handleUploadAdditionalDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);
      console.log("📤 Uploading supporting document:", file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklist._id);
      formData.append("documentId", `support_${Date.now()}`);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      if (result.success) {
        // Add to supportingDocs state
        const newSupportingDoc = {
          id: result.data._id || Date.now().toString(),
          name: file.name,
          fileUrl: `${API_BASE_URL}${result.data.fileUrl}`,
          uploadData: result.data,
          uploadedAt: new Date().toISOString(),
          category: "Supporting Documents",
          isSupporting: true,
        };

        setSupportingDocs((prev) => [...prev, newSupportingDoc]);
        message.success(`"${file.name}" uploaded successfully!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Upload failed: " + error.message);
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  // NEW: Handle supporting document deletion
  const handleDeleteSupportingDoc = async (docId, docName) => {
    const confirm = window.confirm(`Delete "${docName}"?`);

    if (!confirm) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/uploads/${docId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove from supportingDocs state
        setSupportingDocs((prev) => prev.filter((doc) => doc.id !== docId));
        message.success("Document deleted!");
      } else {
        message.error(result.error || "Delete failed");
      }
    } catch (error) {
      message.error("Delete error: " + error.message);
    }
  };

  const downloadChecklistAsPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = await import("html2canvas");

      // Calculate document statistics for PDF
      const stats = calculateDocumentStats(docs);
      const totalRelevantDocs = stats.total - stats.pendingFromCo;
      const completedDocsCount = stats.submitted;

      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.top = "0";
      pdfContainer.style.width = "794px";
      pdfContainer.style.padding = "20px 30px";
      pdfContainer.style.backgroundColor = "#ffffff";
      pdfContainer.style.fontFamily = "'Calibri', 'Arial', sans-serif";
      pdfContainer.style.color = "#333333";

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

      const getStatusColor = (status) => {
        const statusLower = (status || "").toLowerCase();
        switch (statusLower) {
          case "submitted":
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

      const truncateText = (text, maxLength) => {
        if (!text) return "";
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
      };

      // Create HTML content
      const htmlContent = `
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
         
          /* Supporting documents section */
          .supporting-docs-section {
            margin-top: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
          }
         
          .supporting-doc-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
          }
         
          .supporting-doc-item:last-child {
            border-bottom: none;
          }
        </style>

        <!-- Watermark -->
        <div class="watermark">${checklist?.bankName || "BANK DOCUMENT"}</div>

        <!-- Header with Bank Logo -->
        <div class="pdf-header">
          <div class="bank-logo">
            <div class="logo-circle">${checklist?.bankInitials || "NCBA"}</div>
            <div>
              <div class="bank-name">${checklist?.bankName || "NCBA BANK KENYA PLC"}</div>
              <div class="bank-tagline">GO FOR IT</div>
            </div>
          </div>
         
          <!-- Document Info and Status Section -->
          <div class="header-content">
            <div class="document-info">
              <div class="document-title">Co Checklist Review - Document Checklist</div>
              <div class="document-subtitle">
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.primary}"></span>
                  DCL No: <strong>${checklist?.dclNo || "N/A"}</strong>
                </span>
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.secondary}"></span>
                  IBPS No: <strong>${checklist?.ibpsNo || "Not provided"}</strong>
                </span>
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.accent}"></span>
                  Generated: <strong>${dayjs().format("DD MMM YYYY, HH:mm:ss")}</strong>
                </span>
              </div>
            </div>
           
            <!-- Current Status Display -->
            <div class="current-status-section">
              <div class="status-label">Current Status</div>
              <div class="status-display" style="
                background: ${checklist?.status === "co_creator_review" ? "#d1fae5" : "#fef3c7"};
                color: ${checklist?.status === "co_creator_review" ? "#065f46" : "#92400e"};
                border-color: ${checklist?.status === "co_creator_review" ? "#10b981" : "#f59e0b"};
              ">
                ${checklist?.status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN"}
              </div>
            </div>
          </div>
        </div>

        <!-- Checklist Information -->
        <div class="section-card">
          <div class="section-title">Checklist Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">DCL Number</div>
              <div class="info-value">${checklist?.dclNo || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">IBPS Number</div>
              <div class="info-value">${checklist?.ibpsNo || "Not provided"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Loan Type</div>
              <div class="info-value">${checklist?.loanType || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Creation Date</div>
              <div class="info-value">${dayjs(checklist?.createdAt).format("DD MMM YYYY") || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Created By</div>
              <div class="info-value">${checklist?.createdBy?.name || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Relationship Manager</div>
              <div class="info-value">${checklist?.assignedToRM?.name || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Co-Checker</div>
              <div class="info-value">${checklist?.assignedToCoChecker?.name || "Pending Assignment"}</div>
            </div>
          </div>
        </div>

        <!-- Document Summary -->
        <div class="section-card">
          <div class="section-title">Document Summary</div>
         
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">Total</div>
              <div class="summary-number">${stats.total}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Relevant</div>
              <div class="summary-number" style="color: ${bankColors.success};">
                ${totalRelevantDocs}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Completed</div>
              <div class="summary-number" style="color: ${bankColors.success};">
                ${completedDocsCount}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Pending RM</div>
              <div class="summary-number" style="color: ${bankColors.warning};">
                ${stats.pendingFromRM}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Pending Co</div>
              <div class="summary-number" style="color: #8b5cf6;">
                ${stats.pendingFromCo}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Deferred</div>
              <div class="summary-number" style="color: ${bankColors.danger};">
                ${stats.deferred}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Sighted</div>
              <div class="summary-number" style="color: #3b82f6;">
                ${stats.sighted}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Waived</div>
              <div class="summary-number" style="color: ${bankColors.warning};">
                ${stats.waived}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">TBO</div>
              <div class="summary-number" style="color: #06b6d4;">
                ${stats.tbo}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Progress</div>
              <div class="summary-number" style="color: ${bankColors.success};">
                ${stats.progressPercent}%
              </div>
            </div>
          </div>
         
          <div class="progress-text">
            <span>Progress (excluding pendingco):</span>
            <span>${stats.progressPercent}% (${completedDocsCount}/${totalRelevantDocs})</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${stats.progressPercent}%"></div>
          </div>
          <div style="font-size: 9px; color: ${bankColors.textLight}; margin-top: 8px;">
            Note: ${stats.pendingFromCo} document(s) with "pendingco" status excluded from progress calculation
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
                  <th width="10%">Deferral No</th> <!-- Added Deferral No Column -->
                  <th width="10%">Expiry Date</th>
                  <th width="10%">Validity</th>
                  <th width="8%">View</th>
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
                    <td style="font-family: monospace; font-weight: 600; color: #d97706;">
                      ${doc.deferralNo || doc.deferralNumber || "—"}
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
          <div style="font-size: 8px; color: ${bankColors.textLight}; margin-top: 10px; text-align: center;">
            Showing ${docs.length} documents • Completed: ${completedDocsCount} • Pendingco (excluded): ${stats.pendingFromCo}
          </div>
        </div>

        <!-- Supporting Documents Section -->
        ${supportingDocs.length > 0
          ? `
          <div class="section-card">
            <div class="section-title">Supporting Documents (${supportingDocs.length})</div>
            <div style="margin-top: 10px;">
              ${supportingDocs
            .map(
              (doc) => `
                <div class="supporting-doc-item">
                  <div>
                    <div style="font-weight: 600; font-size: 10px;">${doc.name}</div>
                    <div style="font-size: 9px; color: ${bankColors.textLight}; margin-top: 2px;">
                      Uploaded: ${dayjs(doc.uploadedAt).format("DD MMM YYYY, HH:mm")}
                    </div>
                  </div>
                  <span style="font-size: 9px; color: ${bankColors.success}; font-weight: 600;">✓ Uploaded</span>
                </div>
              `,
            )
            .join("")}
            </div>
          </div>
        `
          : ""
        }

        <!-- Creator Comment -->
        ${creatorComment
          ? `
          <div class="section-card">
            <div class="section-title">Creator's Remarks</div>
            <div class="comment-box">
              <div class="comment-header">
                <span class="comment-author">${checklist?.createdBy?.name || "Checklist Creator"}</span>
                <span class="comment-date">${dayjs().format("DD MMM YYYY, HH:mm")}</span>
              </div>
              <div>${creatorComment}</div>
            </div>
          </div>
        `
          : ""
        }

        <!-- Comment History -->
        ${comments && comments.length > 0
          ? `
          <div class="section-card">
            <div class="section-title">Comment History (Last 3)</div>
            <div class="comment-box" style="margin-bottom: 8px;">
              ${comments
            .slice(0, 3)
            .map(
              (comment) => `
                <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed ${bankColors.border};">
                  <div class="comment-header">
                    <span class="comment-author">${comment.userId?.name || "System User"}</span>
                    <span class="comment-date">
                      ${dayjs(comment.createdAt || comment.timestamp).format("DD/MM/YY HH:mm")}
                    </span>
                  </div>
                  <div style="font-size: 9px;">${truncateText(comment.message, 150)}</div>
                </div>
              `,
            )
            .join("")}
            </div>
          </div>
        `
          : ""
        }

        <!-- Footer -->
        <div class="footer">
          <div>
            <strong>${checklist?.bankName || "NCBA BANK KENYA PLC"}</strong> •
            Document Checklist Review System •
            Generated by: ${checklist?.createdBy?.name || "System"} •
            Page 1 of 1
          </div>
          <div class="disclaimer">
            This is a system-generated document. For official purposes only.
            Any unauthorized reproduction or distribution is strictly prohibited.
            Generated on ${dayjs().format("DD MMM YYYY, HH:mm:ss")} •
            DCL: ${checklist?.dclNo || "N/A"} • IBPS: ${checklist?.ibpsNo || "N/A"}
          </div>
        </div>
      `;

      pdfContainer.innerHTML = htmlContent;
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

      const imgWidth = 297;
      const pageHeight = 210;
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

      const fileName = `DCL_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
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

  const handleDelete = (idx) => {
    const updated = docs
      .filter((_, i) => i !== idx)
      .map((doc, i) => ({ ...doc, docIdx: i }));
    setDocs(updated);
    message.success("Document deleted.");
  };

  const handleActionChange = (idx, value) => {
    const updated = [...docs];
    updated[idx].action = value;
    updated[idx].status = value;
    setDocs(updated);
  };

  const handleDeferralNoChange = (idx, value) => {
    const updated = [...docs];
    updated[idx].deferralNo = value;
    setDocs(updated);
  };

  const handleCommentChange = (idx, value) => {
    const updated = [...docs];
    updated[idx].comment = value;
    setDocs(updated);
  };

  const handleFileUpload = (docIdx, file) => {
    const updated = [...docs];
    updated[docIdx].fileUrl = URL.createObjectURL(file);
    updated[docIdx].status = "uploaded";
    setDocs(updated);
    message.success("File uploaded");
    return false;
  };

  const ALLOWED_DOC_ACTIONS = [
    "submitted_for_review",
    "sighted",
    "waived",
    "deferred",
    "tbo",
    "approved",
    "submitted",
  ];

  const canSubmitToCoChecker =
    checklist?.status === "co_creator_review" &&
    docs.length > 0 &&
    docs.every((doc) =>
      ALLOWED_DOC_ACTIONS.includes((doc.action || "").toLowerCase()),
    );

  const submitToRM = async () => {
    try {
      if (!checklist?._id) throw new Error("Checklist ID missing");

      // Include supporting docs in the payload
      const nestedDocuments = docs.reduce((acc, doc) => {
        let categoryGroup = acc.find((c) => c.category === doc.category);
        if (!categoryGroup) {
          categoryGroup = { category: doc.category, docList: [] };
          acc.push(categoryGroup);
        }
        categoryGroup.docList.push({
          _id: doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          displayStatus:
            doc.status === "deferred" && doc.deferralNo
              ? `Deferred (${doc.deferralNo})`
              : doc.status,
          deferralNo: doc.deferralNo,
          action: doc.action,
          comment: doc.comment,
          fileUrl: doc.fileUrl,
          deferralReason: doc.deferralReason,
          expiryDate: doc.expiryDate || null,
        });

        return acc;
      }, []);

      const payload = {
        creatorComment,
        documents: nestedDocuments,
        supportingDocs: supportingDocs, // Include supporting docs
      };
      await submitRmChecklist({ id: checklist._id, body: payload }).unwrap();
      message.success("Checklist submitted to RM!");
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.error || "Failed to submit checklist to RM");
    }
  };

  const submitToCheckers = async () => {
    if (!checklist?.dclNo) return message.error("DCL No missing.");

    try {
      message.loading({
        content: "Submitting checklist to Co-Checker...",
        key: "checkerSubmit",
      });

      const payload = {
        dclNo: checklist.dclNo,
        status: "co_checker_review",
        documents: docs.map((doc) => ({
          _id: doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.action || doc.status,
          comment: doc.comment || "",
          fileUrl: doc.fileUrl || null,
          expiryDate: doc.expiryDate || null,
          deferralNo: doc.deferralNo || null,
        })),
        supportingDocs: supportingDocs, // Include supporting docs
      };

      console.log("Simplified payload:", payload);

      const result = await updateChecklistStatus(payload).unwrap();

      message.success({
        content: "Checklist submitted to Co-Checker!",
        key: "checkerSubmit",
        duration: 3,
      });
      onClose();
    } catch (err) {
      console.error("Submit Error Details:", {
        error: err,
        data: err?.data,
        status: err?.status,
        endpoint: "/api/cocreatorChecklist/update-status",
      });

      message.error({
        content:
          err?.data?.message ||
          err?.data?.error ||
          "Failed to submit checklist.",
        key: "checkerSubmit",
      });
    }
  };

  const allDocsApproved =
    docs.length > 0 && docs.every((doc) => doc.action === "submitted");

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
      width: 250,
      render: (text, record) => (
        <Input
          size="small"
          value={record.name}
          onChange={(e) => {
            const updated = [...docs];
            updated[record.docIdx].name = e.target.value;
            setDocs(updated);
          }}
          disabled={isActionDisabled}
        />
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 220,
      render: (text, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            size="small"
            value={record.action}
            style={{ width: record.action === "deferred" ? 110 : "100%" }}
            onChange={(val) => handleActionChange(record.docIdx, val)}
            disabled={isActionDisabled}
          >
            <Option value="submitted">Submitted</Option>
            <Option value="pendingrm">Pending from RM</Option>
            <Option value="pendingco">Pending from Co</Option>
            <Option value="tbo">TBO</Option>
            <Option value="sighted">Sighted</Option>
            <Option value="waived">Waived</Option>
            <Option value="deferred">Deferred</Option>
          </Select>

          {record.action === "deferred" && (
            <Input
              size="small"
              placeholder="Deferral No"
              value={record.deferralNo || ""}
              onChange={(e) =>
                handleDeferralNoChange(record.docIdx, e.target.value)
              }
              style={{ width: 100 }}
              disabled={isActionDisabled}
            />
          )}
        </div>
      ),
    },
    {
      title: "Co status",
      dataIndex: "status",
      width: 150,
      render: (status, record) => {
        let color = "default";

        switch ((status || "").toLowerCase()) {
          case "submitted":
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
      title: "Deferral No",
      dataIndex: "deferralNo",
      width: 120,
      render: (deferralNo, record) => {
        if (record.status === "deferred" && deferralNo) {
          return (
            <Tag color="orange" style={{ fontWeight: "bold" }}>
              {deferralNo}
            </Tag>
          );
        }
        return "-";
      },
    },

    {
      title: "Checker Status",
      dataIndex: "finalCheckerStatus",
      render: (checkerStatus, record) => {
        // ✅ Debug: Check each row's checkerStatus
        console.log("Checker Status for document:", record._id, checkerStatus);

        let color = "default";
        let label = checkerStatus || "Pending";

        switch ((checkerStatus || "").toLowerCase()) {
          case "approved":
            color = "green";
            label = "Approved";
            break;
          case "rejected":
            color = "red";
            label = "Rejected";
            break;
          case "pending":
            color = "gold";
            label = "Pending";
            break;
          default:
            color = "default";
        }

        return <Tag color={color}>{label}</Tag>;
      },
    },

    {
      title: "Co comment",
      dataIndex: "comment",
      width: 200,
      render: (text, record) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={text}
          onChange={(e) => handleCommentChange(record.docIdx, e.target.value)}
          disabled={isActionDisabled}
        />
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      render: (_, record) => {
        const category = (record.category || "").toLowerCase().trim();

        if (category !== "compliance documents") {
          return "-";
        }

        const dateValue = record.expiryDate ? dayjs(record.expiryDate) : null;

        return (
          <DatePicker
            value={dateValue}
            onChange={(date) => {
              const updatedDocs = [...docs];
              updatedDocs[record.docIdx].expiryDate = date
                ? date.toISOString()
                : null;
              setDocs(updatedDocs);
            }}
            allowClear
            disabled={isActionDisabled}
            style={{ width: 160 }}
            placeholder="Select expiry date"
          />
        );
      },
    },
    {
      title: "Expiry Status",
      dataIndex: "expiryStatus",
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
            }}
          >
            {status === "current" ? "Current" : "Expired"}
          </Button>
        );
      },
    },

    {
      title: "RM Status",
      dataIndex: "rmStatus",
      width: 160,
      render: (status, record) => {
        if (!status) {
          return <Tag color="default">—</Tag>;
        }

        let color = "blue";

        switch ((status || "").toLowerCase()) {
          case "submitted_for_review":
            color = "success";
            break;
          case "approved":
            color = "green";
            break;
          case "defferal_requested":
            color = "warning";
            break;
          case "pending_from_customer":
            color = "orange";
            break;
          default:
            color = "default";
        }

        return (
          <div className="flex items-center gap-2">
            <Tag className="status-tag" color={color}>
              {status.replace(/_/g, " ")}
            </Tag>

            {/* Deferral Number */}
            {status.toLowerCase() === "defferal_requested" &&
              record?.deferralNumber && (
                <span className="text-xs text-gray-500">
                  #{record.deferralNumber}
                </span>
              )}
          </div>
        );
      },
    },

    {
      title: "View",
      key: "view",
      width: 80,
      render: (_, record) =>
        record.fileUrl || record.uploadData?.fileUrl ? (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => {
              const newWindow = window.open(
                getFullUrl(record.fileUrl || record.uploadData?.fileUrl),
                "_blank",
                "noopener,noreferrer",
              );
              if (!newWindow)
                message.error("Popup blocked! Please allow popups.");
            }}
            size="small"
            style={{
              backgroundColor: PRIMARY_BLUE,
              borderColor: PRIMARY_BLUE,
              borderRadius: 6,
            }}
            disabled={false} // Should be viewable even in read-only mode
          >
            View
          </Button>
        ) : (
          <Tag color="default">No File</Tag>
        ),
    },
    {
      title: "Delete",
      key: "delete",
      width: 80,
      render: (_, record) =>
        !readOnly ? (
          <Popconfirm
            title="Delete document?"
            description="This action cannot be undone."
            okText="Yes, Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record.docIdx)}
          >
            <Button type="text" danger size="small" disabled={isActionDisabled}>
              Delete
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={`Review Checklist  ${checklist?.title || ""}`}
        open={open}
        onCancel={onClose}
        width={1150}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={[
          <Button
            key="download"
            icon={<PdfIcon />}
            loading={isGeneratingPDF}
            onClick={downloadChecklistAsPDF}
            style={{
              backgroundColor: PRIMARY_BLUE,
              borderColor: PRIMARY_BLUE,
              color: "white",
              borderRadius: "6px",
              fontWeight: 600,
              marginRight: 8
            }}
          >
            Download PDF
          </Button>,

          !readOnly && (
            <Button
              key="save-draft"
              onClick={async () => {
                try {
                  message.loading({
                    content: "Saving draft...",
                    key: "saveDraft",
                  });
                  const payload = {
                    checklistId: checklist._id,
                    draftData: {
                      documents: docs.map((doc) => ({
                        _id: doc._id,
                        name: doc.name,
                        category: doc.category,
                        status: doc.status || doc.action,
                        action: doc.action,
                        comment: doc.comment,
                        fileUrl: doc.fileUrl,
                        expiryDate: doc.expiryDate,
                        deferralNo: doc.deferralNo,
                      })),
                      creatorComment,
                      supportingDocs,
                    },
                  };
                  await saveDraft(payload).unwrap();
                  message.success({
                    content: "Draft saved successfully!",
                    key: "saveDraft",
                    duration: 3,
                  });
                } catch (error) {
                  console.error("Save draft error:", error);
                  message.error({
                    content: "Failed to save draft",
                    key: "saveDraft",
                  });
                }
              }}
              loading={isSavingDraft}
              style={{
                borderColor: ACCENT_LIME,
                color: PRIMARY_BLUE,
                borderRadius: '6px',
                fontWeight: 600,
                marginRight: "auto"
              }}
            >
              Save Draft
            </Button>
          ),

          !readOnly && (
            <Upload
              key="upload-support"
              showUploadList={false}
              beforeUpload={handleUploadAdditionalDoc}
              disabled={isActionDisabled || uploadingSupportingDoc}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploadingSupportingDoc}
                style={{ borderRadius: '6px' }}
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          ),

          <Button key="cancel" onClick={onClose} style={{ borderRadius: '6px' }}>
            Close
          </Button>,

          !readOnly && (
            <Button
              key="submit"
              type="primary"
              disabled={isActionDisabled || allDocsApproved}
              loading={isSubmittingToRM}
              onClick={submitToRM}
              style={{ borderRadius: '6px', fontWeight: 600 }}
            >
              Submit to RM
            </Button>
          ),

          !readOnly && (
            <Button
              key="submit-checker"
              type="primary"
              loading={isCheckerSubmitting}
              onClick={submitToCheckers}
              disabled={!canSubmitToCoChecker}
              style={{ backgroundColor: PRIMARY_BLUE, borderRadius: '6px', fontWeight: 600 }}
            >
              Submit to Co-Checker
            </Button>
          ),
        ].filter(Boolean)}
      >
        {/* 🔹 VIEW DOCUMENTS BUTTON (UPDATED TO SHOW TOTAL COUNT) */}
        <div className="doc-sidebar-toggle">
          <Button
            icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
            onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
          >
            View Documents
            {docs.filter((d) => d.fileUrl).length + supportingDocs.length >
              0 && (
                <Tag color="green" style={{ marginLeft: 6 }}>
                  {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
                </Tag>
              )}
          </Button>
        </div>

        {/* 🔹 DOCUMENT SIDEBAR (UPDATED TO INCLUDE SUPPORTING DOCS) */}
        <DocumentSidebar
          documents={docs}
          supportingDocs={supportingDocs}
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
                marginTop: 24,
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
              </Descriptions>
            </Card>

            {/* Enhanced Progress Section - Applied the same concept */}
            <div
              style={{
                padding: "16px",
                background: "#f7f9fc",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                marginBottom: 18,
              }}
            >
              {/* Stats Row - counts of each status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ fontWeight: "700", color: PRIMARY_BLUE }}>
                  Total: {total}
                </div>
                <div style={{ fontWeight: "700", color: "green" }}>
                  Submitted: {submitted}
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    color: pendingFromRM > 0 ? "#f59e0b" : "#8b5cf6",
                  }}
                >
                  Pending RM: {pendingFromRM}
                </div>
                <div
                  style={{
                    fontWeight: "700",
                    color: "#8b5cf6",
                    border: pendingFromCo > 0 ? "2px solid #8b5cf6" : "none",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: pendingFromCo > 0 ? "#f3f4f6" : "transparent",
                  }}
                >
                  Pending Co: {pendingFromCo}
                </div>
                <div style={{ fontWeight: "700", color: "#ef4444" }}>
                  Deferred: {deferred}
                </div>
                <div style={{ fontWeight: "700", color: "#3b82f6" }}>
                  Sighted: {sighted}
                </div>
                <div style={{ fontWeight: "700", color: "#f59e0b" }}>
                  Waived: {waived}
                </div>
                <div style={{ fontWeight: "700", color: "#06b6d4" }}>
                  TBO: {tbo}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    Completion Progress
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: PRIMARY_BLUE,
                    }}
                  >
                    {progressPercent}%
                  </span>
                </div>
                <Progress
                  percent={progressPercent}
                  strokeColor={{
                    "0%": PRIMARY_BLUE,
                    "100%": ACCENT_LIME,
                  }}
                  strokeWidth={6}
                />
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

            {!readOnly && (
              <div style={{ marginTop: 18 }}>
                <DocumentInputSectionCoCreator
                  loanType={selectedLoanType || checklist?.loanType}
                  newDocName={newDocName}
                  setNewDocName={setNewDocName}
                  selectedCategoryName={selectedCategoryName}
                  setSelectedCategoryName={setSelectedCategoryName}
                  handleAddNewDocument={handleAddNewDocument}
                />
              </div>
            )}

            {/* NEW: Supporting Documents Section */}
            <div style={{ marginTop: 24 }}>
              {supportingDocs.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4 style={{ color: PRIMARY_BLUE, fontSize: 14, marginBottom: 8 }}>
                    📎 Supporting Documents ({supportingDocs.length})
                  </h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {supportingDocs.map((doc) => (
                      <Card size="small" key={doc.id} style={{ borderRadius: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: 13 }}>{doc.name}</strong>
                            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                              Uploaded: {dayjs(doc.uploadedAt).format("DD MMM YYYY HH:mm")}
                            </div>
                          </div>
                          <Space>
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() => window.open(getFullUrl(doc.fileUrl || doc.uploadData?.fileUrl), "_blank")}
                            >
                              View
                            </Button>
                            {!readOnly && (
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteSupportingDoc(doc.uploadData?._id || doc.id, doc.name)}
                                disabled={isActionDisabled}
                              >
                                Delete
                              </Button>
                            )}
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 8 }}>Creator Comment</h4>
              <Input.TextArea
                rows={2}
                value={creatorComment}
                onChange={(e) => setCreatorComment(e.target.value)}
                disabled={isActionDisabled}
                placeholder="Add a comment for RM / Co-Checker"
                style={{ borderRadius: 8 }}
              />
            </div>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 12 }}>
                Comment Trail & History
              </h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default ReviewChecklistModal;
