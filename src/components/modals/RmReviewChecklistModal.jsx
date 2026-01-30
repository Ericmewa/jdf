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
  Space,
  List,
  Avatar,
  Divider,
  Drawer,
  Typography,
  Collapse,
  Timeline,
  Progress,
  Row,
  Col,
} from "antd";
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  UserOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  FileZipOutlined,
  CalendarOutlined,
  ClockCircleOutlined as TimeOutlined,
  UserAddOutlined,
  RightOutlined,
  LeftOutlined,
  FilePdfOutlined as PdfIcon,
} from "@ant-design/icons";

import {
  useRmSubmitChecklistToCoCreatorMutation,
  useGetChecklistCommentsQuery,
  useSaveChecklistDraftMutation,
} from "../../api/checklistApi";

// Import shared utilities
import { getFullUrl as getFullUrlUtil } from "../../utils/checklistUtils";

// Import shared components
import AddDocumentModal from "../common/AddDocumentModal";
import CommentHistory from "../common/CommentHistory";
import StatusTag from "../common/StatusTag";

const { Option } = Select;
const { Text } = Typography;

// ------------------ COLORS ------------------
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SECONDARY_PURPLE = "#7e6496";

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



  const rmCompletedDocs = docs.filter((d) => {
    const rmStatus = (d.rmStatus || "").toLowerCase();
    const coStatus = (d.status || "").toLowerCase();

    // RM has submitted these
    if (
      rmStatus.includes("submitted") ||
      rmStatus.includes("approved") ||
      rmStatus.includes("satisfactory")
    ) {
      return true;
    }

    // Documents that are already completed/processed by CO and don't need RM action
    if (
      coStatus === "sighted" ||
      coStatus === "waived" ||
      coStatus === "tbo" ||
      coStatus === "submitted" ||
      coStatus === "pendingco"
    ) {
      return true;
    }

    // Deferred documents (RM has acted on them)
    if (
      rmStatus.includes("deferred") ||
      rmStatus.includes("deferral") ||
      coStatus === "deferred"
    ) {
      return true;
    }

    return false;
  });

  const progressPercent =
    total === 0 ? 0 : Math.round((rmCompletedDocs.length / total) * 100);

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
  };
};

// ------------------ CUSTOM STYLES ------------------
const customStyles = `
  .ant-modal-header {
      background-color: ${PRIMARY_BLUE} !important;
      padding: 18px 24px !important;
  }
  .ant-modal-title {
      color: white !important;
      font-size: 1.15rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.5px;
  }
  .ant-modal-close-x { color: white !important; }

  .checklist-info-card .ant-card-head {
    border-bottom: 2px solid ${ACCENT_LIME} !important;
  }
  .checklist-info-card .ant-descriptions-item-label {
      font-weight: 600 !important;
      color: ${SECONDARY_PURPLE} !important;
  }
  .checklist-info-card .ant-descriptions-item-content {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700 !important;
  }

  .doc-table.ant-table-wrapper table {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }
  .doc-table .ant-table-thead > tr > th {
      background-color: #f7f9fc !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600 !important;
      padding: 12px 16px !important;
  }
  .doc-table .ant-table-tbody > tr > td {
      padding: 10px 16px !important;
      border-bottom: 1px dashed #f0f0f0 !important;
  }

  .status-tag {
    font-weight: 700 !important;
    border-radius: 999px !important;
    padding: 3px 8px !important;
    text-transform: capitalize;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .deferral-input.missing {
    border-color: #ff4d4f !important;
  }

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
`;

// ------------------ API Base URL ------------------
const API_BASE_URL =
  import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// ------------------ Upload Utility Functions ------------------
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
    return data.data; // Should match your Upload model
  } catch (error) {
    message.error(error.message || "File upload failed");
    throw error;
  }
};

// In your component, update handleDeleteFile:
const handleDeleteFile = async (docIdx) => {
  const document = docs[docIdx];

  if (!document.uploadData) {
    message.error("No upload found");
    return;
  }

  // Exact same confirmation as test button
  const confirm = window.confirm(`Delete "${document.name}"?`);
  if (!confirm) return;

  try {
    // Exact same fetch as test button
    const response = await fetch(
      `${API_BASE_URL}/api/uploads/${document.uploadData._id}`,
      {
        method: "DELETE",
      },
    );

    const result = await response.json();

    if (result.success) {
      // Simple state update
      const newDocs = [...docs];
      newDocs[docIdx] = {
        ...newDocs[docIdx],
        uploadData: null,
        fileUrl: null,
      };
      setDocs(newDocs);

      message.success("Deleted!");
    } else {
      message.error(result.error || "Delete failed");
    }
  } catch (error) {
    message.error("Delete error: " + error.message);
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

// CommentTrail removed and replaced by shared CommentHistory component

const DocumentSidebar = ({ documents, open, onClose, supportingDocs }) => {
  const uploadedDocs = documents.filter(
    (d) => d.uploadData && d.uploadData.status !== "deleted",
  );

  // Combine regular docs and supporting docs for sidebar
  const allDocs = [...uploadedDocs, ...supportingDocs]; // ADD THIS - but supportingDocs needs to be passed as prop or available in scope

  const groupedDocs = allDocs.reduce((acc, doc) => {
    // CHANGE uploadedDocs to allDocs
    const group = doc.category || "Main Documents";
    if (!acc[group]) acc[group] = [];
    acc[group].push(doc);
    return acc;
  }, {});

  const lastUpload =
    allDocs.length > 0 // CHANGE uploadedDocs to allDocs
      ? allDocs // CHANGE uploadedDocs to allDocs
        .map((d) => new Date(d.uploadData?.createdAt || d.updatedAt || 0))
        .sort((a, b) => b - a)[0]
      : null;

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>Uploaded Documents</span>
          <Tag color="blue">{allDocs.length} doc</Tag>{" "}
          {/* CHANGE uploadedDocs to allDocs */}
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
                        doc.uploadData?.status === "active" ? "green" : "red"
                      }
                    >
                      {doc.uploadData?.status === "active"
                        ? "Active"
                        : "Deleted"}
                    </Tag>
                  </div>

                  {/* DOC ID */}
                  <div
                    style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}
                  >
                    ID: {doc.uploadData?._id || doc._id || "—"}
                  </div>

                  {/* META */}
                  <div style={{ fontSize: 12, color: "#374151" }}>
                    🕒{" "}
                    {doc.uploadData?.createdAt
                      ? dayjs(doc.uploadData.createdAt).format(
                        "DD MMM YYYY HH:mm:ss",
                      )
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
                    <Tag color="purple">{doc.category}</Tag>
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

                    {doc.uploadData?.status === "active" && (
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          window.open(
                            `${API_BASE_URL}${doc.uploadData.fileUrl}`,
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
          <b>{allDocs.length}</b> {/* CHANGE uploadedDocs to allDocs */}
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

const renderStatusTag = (doc) => {
  const key = (doc?.rmStatus || "").toString(); // ensure it's a string
  const normalized = key.toLowerCase().split(" ")[0];
  let color = "default";
  let text = key || "Unknown";

  // Append deferral number if exists
  if (
    (key === "Deferred" || key === "defferal_requested") &&
    doc?.deferralNumber
  ) {
    text += ` (${doc.deferralNumber})`;
  }

  switch (normalized) {
    case "pending_from_customer":
      color = "#fadb14";
      break;
    case "submitted_for_review":
      color = "#52c41a";
      break;
    case "deferred":
    case "deferral_requested":
      color = "#ff4d4f";
      break;
    default:
      color = "gray";
  }

  return (
    <Tag
      className="status-tag"
      style={{
        color: color,
        backgroundColor: color + "22",
        borderColor: color + "55",
      }}
    >
      {text}
    </Tag>
  );
};

// ------------------ HELPER: Role Tag ------------------
const getRoleTag = (role) => {
  switch ((role || "").toLowerCase()) {
    case "rm":
      return <Tag color="blue">RM</Tag>;
    case "co-checker":
      return <Tag color="green">Co-Checker</Tag>;
    case "creator":
      return <Tag color="purple">Creator</Tag>;
    case "system":
      return <Tag color="gray">System</Tag>;
    default:
      return <Tag>{role || "Unknown"}</Tag>;
  }
};

const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return null;

  const today = dayjs().startOf("day");
  const expiry = dayjs(expiryDate).startOf("day");

  return expiry.isBefore(today) ? "expired" : "current";
};

const RmReviewChecklistModal = ({ checklist, open, onClose, refetch, readOnly = false }) => {
  const [docs, setDocs] = useState([]);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [showDeferralModal, setShowDeferralModal] = useState(false);
  const [deferralNumber, setDeferralNumber] = useState("");
  const [deferralDocIdx, setDeferralDocIdx] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false); // Added for PDF loading state

  const [rmGeneralComment, setRmGeneralComment] = useState("");
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
  // Track uploading state per doc
  const [uploadingDocs, setUploadingDocs] = useState({}); // Track uploading state per doc

  // Add Document Modal States
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [submitRmChecklistToCoCreator, { isLoading }] =
    useRmSubmitChecklistToCoCreatorMutation();
  const [saveDraft, { isLoading: isSavingDraft }] =
    useSaveChecklistDraftMutation();

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  const getInitialRmStatus = (doc) => {
    if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
      return doc.rmStatus; // RM already acted
    }

    // Default from CO
    return doc.status || "pendingrm";
  };

  const API_BASE_URL =
    import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

  // Helper to ensure file URL includes the base URL
  const getFullUrl = (url) => {
    if (!url) return null;
    // If URL already starts with http/https, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Otherwise, prepend API_BASE_URL
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // ------------------ Upload Utility Functions ------------------
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
      return data.data; // Should match your Upload model
    } catch (error) {
      message.error(error.message || "File upload failed");
      throw error;
    }
  };

  // In your component, update handleDeleteFile:
  const handleDeleteFile = async (docIdx) => {
    const document = docs[docIdx];

    if (!document.uploadData) {
      message.error("No upload found");
      return;
    }

    // Exact same confirmation as test button
    const confirm = window.confirm(`Delete "${document.name}"?`);
    if (!confirm) return;

    try {
      // Exact same fetch as test button
      const response = await fetch(
        `${API_BASE_URL}/api/uploads/${document.uploadData._id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.success) {
        // Simple state update
        const newDocs = [...docs];
        newDocs[docIdx] = {
          ...newDocs[docIdx],
          uploadData: null,
          fileUrl: null,
        };
        setDocs(newDocs);

        message.success("Deleted!");
      } else {
        message.error(result.error || "Delete failed");
      }
    } catch (error) {
      message.error("Delete error: " + error.message);
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

  // const CommentTrail = ({ comments, isLoading }) => {
  //   if (isLoading) return <Spin className="block m-5" />;
  //   if (!comments || comments.length === 0)
  //     return <i className="pl-4">No historical comments yet.</i>;

  //   const getRoleTag = (role) => {
  //     switch ((role || "").toLowerCase()) {
  //       case "rm":
  //         return <Tag color="blue">RM</Tag>;
  //       case "co-checker":
  //         return <Tag color="green">Co-Checker</Tag>;
  //       case "creator":
  //         return <Tag color="purple">Creator</Tag>;
  //       case "system":
  //         return <Tag color="gray">System</Tag>;
  //       default:
  //         return <Tag>{role || "Unknown"}</Tag>;
  //     }
  //   };

  //   return (
  //     <div className="max-h-52 overflow-y-auto">
  //       <List
  //         dataSource={comments}
  //         itemLayout="horizontal"
  //         renderItem={(item) => (
  //           <List.Item>
  //             <List.Item.Meta
  //               avatar={<Avatar icon={<UserOutlined />} />}
  //               title={
  //                 <div className="flex justify-between">
  //                   <div>
  //                     <b>{item.userId?.name || "System"}</b>
  //                     {getRoleTag(item.userId?.role || "system")}
  //                   </div>
  //                   <span className="text-xs text-gray-500">
  //                     {new Date(
  //                       item.createdAt || item.timestamp
  //                     ).toLocaleString()}
  //                   </span>
  //                 </div>
  //               }
  //               description={
  //                 <div className="wrap-break-word">{item.message}</div>
  //               }
  //             />
  //           </List.Item>
  //         )}
  //       />
  //     </div>
  //   );
  // };

  // CommentTrail duplicate removed and replaced by shared CommentHistory component

  useEffect(() => {
    if (!checklist || !checklist.documents) return;
    const flattenedDocs = checklist.documents.reduce((acc, categoryObj) => {
      const filteredDocs = categoryObj.docList
        .filter((doc) => doc.name?.trim() !== "")
        .map((doc) => ({
          ...doc,
          category: categoryObj.category,
        }));
      return acc.concat(filteredDocs);
    }, []);

    const preparedDocs = flattenedDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status || "pendingrm",
      comment: doc.comment || "",
      action: doc.status || "pendingrm",
      fileUrl: doc.fileUrl || null,
      deferralReason: doc.deferralReason || "",
      // ✅ FIX: Initialize from deferralNo (backend field) if deferralNumber is missing
      deferralNumber: doc.deferralNumber || doc.deferralNo || "",
      deferralNo: doc.deferralNo || doc.deferralNumber || "",

      rmStatus: getInitialRmStatus(doc),
      rmTouched: doc.rmStatus != null,
      uploadData: doc.uploadData || null,
    }));

    setDocs(preparedDocs);
  }, [checklist]);

  const isActionAllowed = !readOnly && checklist?.status === "rm_review";

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

  const downloadChecklistAsPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      // Dynamically import jsPDF and html2canvas
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = await import("html2canvas");

      // Create a temporary container for PDF generation
      const pdfContainer = document.createElement("div");
      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      pdfContainer.style.top = "0";
      pdfContainer.style.width = "1123px"; // Wider for landscape A4
      pdfContainer.style.padding = "15px 20px";
      pdfContainer.style.backgroundColor = "#ffffff";
      pdfContainer.style.fontFamily = "'Arial', sans-serif";
      pdfContainer.style.color = "#333333";

      // Bank-style color scheme
      const bankColors = {
        primary: "#164679",
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

      // Calculate status colors for PDF
      const getStatusColor = (status) => {
        const statusLower = (status || "").toLowerCase();
        switch (statusLower) {
          case "submitted":
          case "submitted_for_review":
          case "submitted for review":
            return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
          case "pending":
          case "pendingrm":
          case "pending_from_customer":
          case "pending from customer":
            return { bg: "#fee2e2", color: "#991b1b", border: "#ef4444" };
          case "pendingco":
            return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
          case "waived":
            return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
          case "sighted":
            return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
          case "deferred":
          case "deferral":
          case "defferal_requested":
          case "deferral requested":
            return { bg: "#e0e7ff", color: "#3730a3", border: "#6366f1" };
          case "tbo":
            return { bg: "#cffafe", color: "#0e7490", border: "#06b6d4" };
          default:
            return { bg: "#f1f5f9", color: "#64748b", border: "#cbd5e1" };
        }
      };

      // Build the PDF content with ALL columns
      pdfContainer.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
        }
       
        .pdf-container {
          width: 100%;
          min-height: 100vh;
          font-size: 12px !important; /* Base font size increased */
        }
       
        .pdf-header {
          border-bottom: 2px solid ${bankColors.primary};
          padding-bottom: 12px;
          margin-bottom: 15px;
        }
       
        .bank-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
       
        .logo-circle {
          width: 40px;
          height: 40px;
          background: ${bankColors.primary};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px; /* Increased */
        }
       
        .bank-name {
          font-size: 18px; /* Increased from 16px */
          font-weight: bold;
          color: ${bankColors.primary};
        }
       
        .bank-tagline {
          font-size: 11px; /* Increased from 9px */
          color: ${bankColors.textLight};
          margin-top: 2px;
        }
       
        .document-title {
          font-size: 16px; /* Increased from 13px */
          font-weight: bold;
          color: ${bankColors.secondary};
          margin-bottom: 4px;
        }
       
        .document-subtitle {
          font-size: 12px; /* Increased from 10px */
          color: ${bankColors.textLight};
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
       
        .document-badge {
          background: ${bankColors.light};
          padding: 4px 8px; /* Increased padding */
          border-radius: 3px;
          font-size: 11px; /* Increased from 9px */
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
       
        .badge-dot {
          width: 6px; /* Increased */
          height: 6px; /* Increased */
          border-radius: 50%;
        }
       
        .section-card {
          background: white;
          border: 1px solid ${bankColors.border};
          border-radius: 5px;
          padding: 12px; /* Increased */
          margin-bottom: 12px;
        }
       
        .section-title {
          font-size: 14px; /* Increased from 12px */
          font-weight: bold;
          color: ${bankColors.primary};
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 1px solid ${bankColors.light};
          display: flex;
          align-items: center;
          gap: 6px;
        }
       
        .section-title::before {
          content: "▌";
          color: ${bankColors.accent};
          font-size: 12px; /* Increased */
        }
       
        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px; /* Increased */
          margin-bottom: 8px; /* Increased */
        }
       
        .info-item {
          padding: 8px; /* Increased */
          background: ${bankColors.light};
          border-radius: 3px;
          border-left: 2px solid ${bankColors.secondary};
        }
       
        .info-label {
          font-size: 10px; /* Increased from 8px */
          color: ${bankColors.textLight};
          text-transform: uppercase;
          margin-bottom: 2px; /* Increased */
        }
       
        .info-value {
          font-size: 12px; /* Increased from 10px */
          font-weight: 600;
          color: ${bankColors.text};
        }
       
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 8px; /* Increased */
          margin-bottom: 12px;
        }
       
        .summary-card {
          padding: 8px; /* Increased */
          border-radius: 4px;
          text-align: center;
          background: ${bankColors.light};
          border: 1px solid ${bankColors.border};
        }
       
        .summary-number {
          font-size: 16px; /* Increased from 14px */
          font-weight: bold;
          color: ${bankColors.primary};
          margin: 4px 0;
        }
       
        .summary-label {
          font-size: 9px; /* Increased from 7px */
          color: ${bankColors.textLight};
          text-transform: uppercase;
        }
       
        .progress-bar {
          height: 6px; /* Increased */
          background: ${bankColors.border};
          border-radius: 2px;
          overflow: hidden;
          margin: 8px 0;
        }
       
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, ${bankColors.success}, ${bankColors.accent});
          border-radius: 2px;
        }
       
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 11px; /* Increased from 9px */
          color: ${bankColors.textLight};
        }
       
        .table-container {
          overflow-x: auto;
          margin-top: 10px; /* Increased */
        }
       
        .document-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px !important; /* Increased from 8px */
          table-layout: fixed;
          min-width: 1000px;
        }
       
        .document-table th {
          background: ${bankColors.primary};
          color: white;
          text-align: left;
          padding: 8px 10px; /* Increased */
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2px;
          font-size: 10px !important; /* Increased from 7px */
          white-space: nowrap;
        }
       
        .document-table td {
          padding: 8px 10px; /* Increased */
          border-bottom: 1px solid ${bankColors.border};
          vertical-align: top;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-size: 11px !important; /* Added */
        }
       
        .document-table tr:nth-child(even) {
          background: #fafafa;
        }
       
        /* Column widths - adjusted for all 9 columns */
        .document-table th:nth-child(1),
        .document-table td:nth-child(1) {
          width: 12%;
          min-width: 80px; /* Increased */
        } /* Category */
        .document-table th:nth-child(2),
        .document-table td:nth-child(2) {
          width: 20%;
          min-width: 130px; /* Increased */
        } /* Document Name */
        .document-table th:nth-child(3),
        .document-table td:nth-child(3) {
          width: 10%;
          min-width: 80px; /* Increased */
        } /* CO Status */
        .document-table th:nth-child(4),
        .document-table td:nth-child(4) {
          width: 14%;
          min-width: 110px; /* Increased */
        } /* CO Comment */
        .document-table th:nth-child(5),
        .document-table td:nth-child(5) {
          width: 10%;
          min-width: 80px; /* Increased */
        } /* Expiry Date */
        .document-table th:nth-child(6),
        .document-table td:nth-child(6) {
          width: 10%;
          min-width: 80px; /* Increased */
        } /* Expiry Status */
        .document-table th:nth-child(7),
        .document-table td:nth-child(7) {
          width: 10%;
          min-width: 90px; /* Increased */
        } /* RM Status */
        .document-table th:nth-child(8),
        .document-table td:nth-child(8) {
          width: 8%;
          min-width: 70px; /* Increased */
        } /* Deferral No */
        .document-table th:nth-child(9),
        .document-table td:nth-child(9) {
          width: 6%;
          min-width: 60px; /* Increased */
        } /* File */
       
        .status-badge {
          padding: 3px 8px; /* Increased */
          border-radius: 8px;
          font-size: 10px !important; /* Increased from 7px */
          font-weight: 600;
          display: inline-block;
          border: 1px solid;
          white-space: nowrap;
          text-align: center;
        }
       
        .comment-box {
          background: ${bankColors.light};
          border-left: 2px solid ${bankColors.accent};
          padding: 10px; /* Increased */
          border-radius: 3px;
          margin-top: 8px; /* Increased */
          font-size: 12px; /* Increased from 9px */
          line-height: 1.4;
        }
       
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px; /* Increased */
        }
       
        .comment-author {
          font-weight: 600;
          color: ${bankColors.primary};
          font-size: 12px; /* Increased from 9px */
        }
       
        .comment-date {
          font-size: 11px; /* Increased from 8px */
          color: ${bankColors.textLight};
        }
       
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 50px;
          color: rgba(0,0,0,0.03);
          font-weight: bold;
          pointer-events: none;
          z-index: 1;
        }
       
        .footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid ${bankColors.border};
          text-align: center;
          font-size: 10px; /* Increased from 8px */
          color: ${bankColors.textLight};
          line-height: 1.4;
        }
       
        .disclaimer {
          background: ${bankColors.light};
          padding: 8px; /* Increased */
          border-radius: 2px;
          margin-top: 8px; /* Increased */
          font-size: 9px; /* Increased from 7px */
        }
       
        .expired-tag {
          background: #fee2e2 !important;
          color: #991b1b !important;
          border-color: #ef4444 !important;
        }
       
        .current-tag {
          background: #d1fae5 !important;
          color: #065f46 !important;
          border-color: #10b981 !important;
        }
       
        /* New styles for header layout */
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid ${bankColors.border};
        }
       
        .document-info {
          flex: 1;
        }
       
        .current-status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 130px; /* Increased */
        }
       
        .status-label {
          font-size: 10px; /* Increased from 8px */
          color: ${bankColors.textLight};
          text-transform: uppercase;
          margin-bottom: 4px; /* Increased */
        }
       
        .status-display {
          padding: 6px 12px; /* Increased */
          border-radius: 3px;
          font-size: 12px; /* Increased from 10px */
          font-weight: 600;
          text-align: center;
          border: 1px solid;
          min-width: 110px; /* Increased */
        }
      </style>

      <!-- Watermark -->
      <div class="watermark">${checklist?.bankName || "BANK DOCUMENT"}</div>

      <!-- Main Container -->
      <div class="pdf-container">
        <!-- Header with Bank Logo -->
        <div class="pdf-header">
          <div class="bank-logo">
            <div class="logo-circle">${checklist?.bankInitials || "NCBA"}</div>
            <div>
              <div class="bank-name">${checklist?.bankName || "NCBA BANK KENYA PLC"
        }</div>
              <div class="bank-tagline">DOCUMENT CHECKLIST REVIEW</div>
            </div>
          </div>
         
          <!-- Document Info and Status Section -->
          <div class="header-content">
            <div class="document-info">
              <div class="document-title">RM Checklist Review Report</div>
              <div class="document-subtitle">
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.primary
        }"></span>
                  DCL: <strong>${checklist?.dclNo || "N/A"}</strong>
                </span>
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.secondary
        }"></span>
                  Customer: <strong>${checklist?.customerNumber || "N/A"}</strong>
                </span>
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.accent
        }"></span>
                  Generated: ${dayjs().format("DD MMM YYYY, HH:mm")}
                </span>
                <span class="document-badge">
                  <span class="badge-dot" style="background: ${bankColors.success
        }"></span>
                  Documents: <strong>${total}</strong>
                </span>
              </div>
            </div>
           
            <!-- Current Status Display -->
            <div class="current-status-section">
              <div class="status-label">Current Status</div>
              <div class="status-display" style="
                background: ${checklist?.status === "rm_review" ? "#fef3c7" : "#d1fae5"
        };
                color: ${checklist?.status === "rm_review" ? "#92400e" : "#065f46"
        };
                border-color: ${checklist?.status === "rm_review" ? "#f59e0b" : "#10b981"
        };
              ">
                ${(checklist?.status || "UNKNOWN").toUpperCase()}
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
              <div class="info-value">${checklist?.customerNumber || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DCL Number</div>
              <div class="info-value">${checklist?.dclNo || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">IBPS Number</div>
              <div class="info-value">${checklist?.ibpsNo || "—"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Loan Type</div>
              <div class="info-value">${checklist?.loanType || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Created By</div>
              <div class="info-value">${checklist?.createdBy?.name || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Relationship Manager</div>
              <div class="info-value">${checklist?.assignedToRM?.name || "N/A"
        }</div>
            </div>
            <div class="info-item">
              <div class="info-label">Co-Checker</div>
              <div class="info-value">${checklist?.assignedToCoChecker?.name || "Pending"
        }</div>
            </div>
            <!-- Current Status removed from here -->
          </div>
        </div>

        <!-- Document Summary -->
        <div class="section-card">
          <div class="section-title">Document Summary</div>
         
          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-label">Total</div>
              <div class="summary-number">${total}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Submitted</div>
              <div class="summary-number" style="color: ${bankColors.success};">
                ${submitted}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Pending RM</div>
              <div class="summary-number" style="color: ${bankColors.warning};">
                ${pendingFromRM}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Pending Co</div>
              <div class="summary-number" style="color: #8b5cf6;">
                ${pendingFromCo}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Deferred</div>
              <div class="summary-number" style="color: ${bankColors.danger};">
                ${deferred}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Sighted</div>
              <div class="summary-number" style="color: #3b82f6;">
                ${sighted}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Waived</div>
              <div class="summary-number" style="color: ${bankColors.warning};">
                ${waived}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">TBO</div>
              <div class="summary-number" style="color: #06b6d4;">
                ${tbo}
              </div>
            </div>
          </div>
         
          <div class="progress-text">
            <span>Completion Progress</span>
            <span>${progressPercent}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>
        </div>

        <!-- Document Details - ALL COLUMNS -->
        <div class="section-card">
          <div class="section-title">Document Details (${total} documents)</div>
          <div class="table-container">
            <table class="document-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Document Name</th>
                  <th>CO Status</th>
                  <th>CO Comment</th>
                  <th>Expiry Date</th>
                  <th>Expiry Status</th>
                  <th>RM Status</th>
                  <th>Deferral No</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                ${docs
          .map((doc, index) => {
            const statusColor = getStatusColor(doc.status);
            const rmStatusColor = getStatusColor(doc.rmStatus);

            // Format CO Status
            let coStatusLabel = "N/A";
            if (doc.status) {
              if (doc.status === "deferred" && doc.deferralNumber) {
                coStatusLabel = `DEFERRED (${doc.deferralNumber})`;
              } else {
                coStatusLabel = doc.status.toUpperCase();
              }
            }

            // Format RM Status
            let rmStatusLabel = "PENDING";
            if (doc.rmStatus) {
              if (
                doc.rmStatus === "Deferral Requested" &&
                doc.deferralNumber
              ) {
                rmStatusLabel = `DEFERRED (${doc.deferralNumber})`;
              } else {
                rmStatusLabel = doc.rmStatus.toUpperCase();
              }
            }

            // Format Expiry Status
            const expiryStatus = getExpiryStatus(doc.expiryDate);
            const expiryDate = doc.expiryDate
              ? dayjs(doc.expiryDate).format("DD/MM/YYYY")
              : "—";

            // Helper function for truncation
            const truncate = (text, max = 40) => {
              if (!text || text === "—") return "—";
              return text.length > max
                ? text.substring(0, max) + "..."
                : text;
            };

            const docName = truncate(doc.name || "—", 35);
            const docComment = truncate(doc.comment || "—", 30);
            const docCategory = truncate(doc.category || "—", 20);

            const hasFile = doc.fileUrl ? "✓" : "—";

            return `
                    <tr>
                      <td title="${doc.category || "—"}">
                        ${docCategory}
                      </td>
                      <td title="${doc.name || "—"}">
                        ${docName}
                      </td>
                      <td>
                        <span class="status-badge" style="
                          background: ${statusColor.bg};
                          color: ${statusColor.color};
                          border-color: ${statusColor.border};
                        ">
                          ${coStatusLabel.substring(0, 15)}
                        </span>
                      </td>
                      <td title="${doc.comment || "—"}">
                        ${docComment}
                      </td>
                      <td style="font-family: monospace; font-weight: 500;">
                        ${expiryDate}
                      </td>
                      <td>
                        ${!expiryStatus
                ? "—"
                : `<span class="status-badge ${expiryStatus === "current"
                  ? "current-tag"
                  : "expired-tag"
                }">
                                ${expiryStatus === "current" ? "CURRENT" : "EXPIRED"}
                              </span>`
              }
                      </td>
                      <td>
                        <span class="status-badge" style="
                          background: ${rmStatusColor.bg};
                          color: ${rmStatusColor.color};
                          border-color: ${rmStatusColor.border};
                        ">
                          ${rmStatusLabel.substring(0, 15)}
                        </span>
                      </td>
                      <td style="font-family: monospace; font-weight: 600;">
                        ${doc.deferralNumber || "—"}
                      </td>
                      <td style="text-align: center; font-weight: bold; color: ${hasFile === "✓"
                ? bankColors.success
                : bankColors.textLight
              };">
                        ${hasFile}
                      </td>
                    </tr>
                  `;
          })
          .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- RM General Comment -->
        ${rmGeneralComment
          ? `
          <div class="section-card">
            <div class="section-title">RM General Comment</div>
            <div class="comment-box">
              <div class="comment-header">
                <span class="comment-author">${checklist?.assignedToRM?.name || "Relationship Manager"
          }</span>
                <span class="comment-date">${dayjs().format("DD MMM YYYY, HH:mm")}</span>
              </div>
              <div>${rmGeneralComment}</div>
            </div>
          </div>
        `
          : ""
        }

        <!-- Comment History -->
        ${comments && comments.length > 0
          ? `
          <div class="section-card">
            <div class="section-title">Comment History (Last ${Math.min(comments.length, 3)})</div>
            ${comments
            .slice(0, 3)
            .map(
              (comment) => `
              <div class="comment-box" style="margin-bottom: 6px;">
                <div class="comment-header">
                  <span class="comment-author">${comment.userId?.name || "System User"
                }</span>
                  <span class="comment-date">
                    ${dayjs(comment.createdAt || comment.timestamp).format("DD MMM, HH:mm")}
                  </span>
                </div>
                <div>${comment.message || ""}</div>
              </div>
            `,
            )
            .join("")}
          </div>
        `
          : ""
        }

        <!-- Footer -->
        <div class="footer">
          <div>
            <strong>${checklist?.bankName || "NCBA BANK KENYA PLC"}</strong> •
            Document Checklist Review System •
            Generated by: ${checklist?.assignedToRM?.name || "System"}
          </div>
          <div class="disclaimer">
            This is a system-generated document. For official purposes only.
            Any unauthorized reproduction or distribution is strictly prohibited.
            Generated on ${dayjs().format("DD MMM YYYY, HH:mm:ss")}
          </div>
        </div>
      </div>
    `;

      document.body.appendChild(pdfContainer);

      // Wait for DOM to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Convert to canvas then to PDF
      const canvas = await html2canvas.default(pdfContainer, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        windowWidth: pdfContainer.scrollWidth,
        windowHeight: pdfContainer.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 280; // Slightly less than full A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Single page PDF - no pagination needed
      pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight, "", "FAST");

      // Save the PDF
      const fileName = `RM_Checklist_${checklist?.customerNumber || checklist?.dclNo || "export"
        }_${dayjs().format("YYYYMMDD_HHmm")}.pdf`;
      pdf.save(fileName);

      // Clean up
      document.body.removeChild(pdfContainer);

      message.success("Checklist downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ------------------------------ STATUS TAG
  const renderrStatusTag = (key) => {
    const map = {
      sighted: { color: PRIMARY_BLUE, text: "Sighted", icon: <EyeOutlined /> },
      pending: {
        color: "#fadb14",
        text: "Pending",
        icon: <ClockCircleOutlined />,
      },
      submitted: {
        color: "#52c41a",
        text: "Submitted",
        icon: <CheckCircleOutlined />,
      },
      deferred: {
        color: "#ff4d4f",
        text: "Deferred",
        icon: <CloseCircleOutlined />,
      },
      waived: {
        color: "#ff4d4f",
        text: "Waived",
        icon: <CloseCircleOutlined />,
      },
    };

    const s = map[key?.toLowerCase()] || {
      color: "gray",
      text: key || "Unknown",
      icon: <SyncOutlined spin />,
    };

    return (
      <Tag
        className="status-tag"
        style={{
          color: s.color,
          backgroundColor: s.color + "22",
          borderColor: s.color + "55",
        }}
      >
        {s.icon} {s.text}
      </Tag>
    );
  };

  const handleDownloadChecklist = () => {
    if (!checklist?._id) {
      message.error("Checklist not available");
      return;
    }

    window.open(`/api/checklists/${checklist._id}/download`, "_blank");
  };

  const handleUploadAdditionalDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);
      console.log("📤 Uploading supporting document:", file.name);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklist._id);
      formData.append("documentId", `support_${Date.now()}`);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting");

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

  // // can act on doc
  // const canActOnDoc = (doc) => isActionAllowed && doc.status === "pendingrm";

  const canActOnDoc = (doc) => {
    const restrictedStatuses = [
      "submitted",
      "tbo",
      "waived",
      "sighted",
      "deferred",
      "pendingco",
    ];

    const isRestrictedStatus = restrictedStatuses.includes(
      (doc.status || "").toLowerCase(),
    );

    // RM can only act on documents that are NOT in restricted statuses
    // AND the checklist is in rm_review status
    return isActionAllowed && !isRestrictedStatus;
  };

  const handleFileUpload = async (docIdx, file) => {
    const document = docs[docIdx];

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Please upload only images, PDFs, Word, or Excel files");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("File size exceeds 10MB limit");
      return false;
    }

    setUploadingDocs((prev) => ({ ...prev, [docIdx]: true }));

    try {
      const uploadResult = await uploadFileToBackend(
        file,
        checklist._id,
        document._id,
        document.name,
        document.category,
      );

      setDocs((prev) =>
        prev.map((d, idx) =>
          idx === docIdx
            ? {
              ...d,
              uploadData: uploadResult,
              fileUrl: `${API_BASE_URL}${uploadResult.fileUrl}`,
              isUploading: false,
            }
            : d,
        ),
      );

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docIdx]: false }));
    }

    return false;
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    try {
      message.loading({ content: "Saving draft...", key: "saveDraft" });
      await saveDraft({
        checklistId: checklist._id,
        draftData: {
          documents: docs.map((doc) => ({
            _id: doc._id,
            name: doc.name,
            category: doc.category,
            status: doc.status,
            action: doc.action,
            rmStatus: doc.rmStatus,
            comment: doc.comment,
            fileUrl: doc.fileUrl,
            expiryDate: doc.expiryDate,
            deferralNo: doc.deferralNo || doc.deferralNumber,
          })),
          creatorComment: rmGeneralComment,
          supportingDocs: supportingDocs,
        },
      }).unwrap();
      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({ content: "Failed to save draft", key: "saveDraft" });
    }
  };

  // Handle Add New Document
  const handleAddNewDocument = () => {
    if (!newDocName.trim()) {
      message.error("Please enter a document name");
      return;
    }
    if (!selectedCategory) {
      message.error("Please select a category");
      return;
    }

    const newDoc = {
      _id: `new_${Date.now()}`,
      docIdx: docs.length,
      name: newDocName.trim(),
      category: selectedCategory,
      status: "pendingrm",
      rmStatus: "pending_from_customer",
      comment: "",
      fileUrl: null,
      deferralNo: null,
      uploadData: null,
      isNew: true, // Mark as newly added
    };

    setDocs((prev) => [...prev, newDoc]);
    message.success(`Document "${newDocName.trim()}" added successfully!`);

    // Reset modal state
    setNewDocName("");
    setSelectedCategory("");
    setShowAddDocModal(false);
  };

  // Get unique categories from existing docs
  const getCategories = () => {
    const categories = [
      ...new Set(docs.map((d) => d.category).filter(Boolean)),
    ];
    if (categories.length === 0) {
      return ["Core Documents", "Compliance Documents", "Supporting Documents"];
    }
    return categories;
  };

  const submitRM = async () => {
    try {
      if (!checklist?._id) throw new Error("Checklist ID missing");

      const missingDeferral = docs.find(
        (doc) =>
          doc.rmStatus === "defferal_requested" && !doc.deferralNumber?.trim(),
      );

      if (missingDeferral) {
        Modal.warning({
          title: "Deferral Number Required",
          content:
            "Please enter a deferral number for all documents marked as Deferral Requested.",
          okText: "OK",
          centered: true,
        });
        return;
      }

      const payload = {
        checklistId: checklist._id,
        documents: docs.map((doc) => ({
          _id: doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          action: doc.action,
          comment: doc.comment,
          fileUrl: doc.uploadData?.fileUrl || null,
          uploadData: doc.uploadData || null,
          deferralReason: doc.deferralReason,
          rmStatus: doc.rmStatus,
          deferralNumber: doc.deferralNumber,
          deferralNo: doc.deferralNumber || doc.deferralNo, // ✅ Sync for backend compatibility
        })),
        rmGeneralComment,
      };

      await submitRmChecklistToCoCreator(payload).unwrap();
      if (refetch) refetch();

      message.success("Checklist submitted to CO-Checker!");
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.error || "Failed to submit checklist");
    }
  };

  // ------------------------------ COLUMNS
  const columns = [
    {
      title: "Category",
      dataIndex: "category",
      width: 100,
      render: (text) => (
        <Input size="small" value={text} disabled style={{ opacity: 0.6 }} />
      ),
    },
    {
      title: "Document Name",
      dataIndex: "name",
      width: 150,
      render: (text) => (
        <Input size="small" value={text} disabled style={{ opacity: 0.6 }} />
      ),
    },
    {
      title: "Status from CO",
      width: 140,
      render: (_, record) => {
        const label =
          record.status === "deferred" && record.deferralNumber
            ? `Deferred (${record.deferralNumber})`
            : record.status;

        return <div style={{ opacity: 0.6 }}>{renderrStatusTag(label)}</div>;
      },
    },

    {
      title: "Comment from CO",
      dataIndex: "comment",
      width: 150,
      render: (text) => (
        <Input.TextArea
          rows={1}
          size="small"
          value={text}
          disabled
          style={{ opacity: 0.6 }}
        />
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      width: 120,
      render: (text, record) =>
        record.expiryDate ? dayjs(record.expiryDate).format("YYYY-MM-DD") : "-",
    },

    {
      title: "Expiry Status",
      width: 120,
      render: (_, record) => {
        const status = getExpiryStatus(record.expiryDate);

        if (!status) return "-";

        return (
          <Tag
            color={status === "current" ? "green" : "red"}
            style={{ fontWeight: 600 }}
          >
            {status === "current" ? "Current" : "Expired"}
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
      title: "Actions",
      width: 250,
      render: (_, record) => {
        // Check if document is in restricted CO status
        const isRestrictedCOStatus = [
          "submitted",
          "tbo",
          "waived",
          "sighted",
          "deferred",
          "pendingco",
        ].includes((record.status || "").toLowerCase());

        return (
          <Space size={4}>
            {!readOnly && (
              <Upload
                showUploadList={false}
                beforeUpload={(f) => handleFileUpload(record.docIdx, f)}
                disabled={!isActionAllowed || isRestrictedCOStatus} // Disable when CO status is restricted
              >
                <Button
                  size="small"
                  icon={<UploadOutlined />}
                  style={{
                    borderRadius: 6,
                    opacity: !isActionAllowed || isRestrictedCOStatus ? 0.5 : 1,
                  }}
                  disabled={!isActionAllowed || isRestrictedCOStatus}
                >
                  Upload
                </Button>
              </Upload>
            )}

            {record.fileUrl && (
              <>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    window.open(
                      getFullUrl(record.fileUrl || record.uploadData?.fileUrl),
                      "_blank",
                    )
                  }
                  style={{ borderRadius: 6 }}
                >
                  View
                </Button>
                {!readOnly && (
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      setDocs((p) =>
                        p.map((d, i) =>
                          i === record.docIdx ? { ...d, fileUrl: null } : d,
                        ),
                      )
                    }
                    disabled={!canActOnDoc(record)} // Use canActOnDoc for delete button too
                  >
                    Delete
                  </Button>
                )}
              </>
            )}

            <Select
              size="small"
              value={record.rmStatus}
              style={{ width: 180 }}
              onChange={(value) =>
                setDocs((prev) =>
                  prev.map((d, idx) =>
                    idx === record.docIdx ? { ...d, rmStatus: value } : d,
                  ),
                )
              }
              options={[
                {
                  label: "Pending from Customer",
                  value: "pending_from_customer",
                },
                {
                  label: "Submitted for Review",
                  value: "submitted_for_review",
                },
                { label: "Deferral Requested", value: "defferal_requested" },
              ]}
              disabled={!canActOnDoc(record)} // Use canActOnDoc for select too
            />

            {showDeferralModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg w-[360px] p-5">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Deferral Number
                  </h3>

                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter deferral number"
                    value={deferralNumber}
                    onChange={(e) => setDeferralNumber(e.target.value)}
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 text-sm rounded bg-gray-200 hover:bg-gray-300"
                      onClick={() => {
                        setShowDeferralModal(false);
                        setDeferralDocIdx(null);
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => {
                        if (!deferralNumber.trim()) {
                          message.error("Deferral number is required");
                          return;
                        }

                        const updated = [...docs];
                        updated[deferralDocIdx].action = "deferred";
                        updated[deferralDocIdx].status = "deferred";
                        updated[deferralDocIdx].deferralReason = deferralNumber;

                        setDocs(updated);
                        setShowDeferralModal(false);
                        setDeferralDocIdx(null);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
            {record.rmStatus === "defferal_requested" && (
              <Input
                size="small"
                placeholder="Deferral number"
                value={record.deferralNumber}
                style={{ width: "100%", marginTop: 6 }}
                onChange={(e) =>
                  setDocs((prev) =>
                    prev.map((d, idx) =>
                      idx === record.docIdx
                        ? { ...d, deferralNumber: e.target.value }
                        : d,
                    ),
                  )
                }
                disabled={!canActOnDoc(record)} // Use canActOnDoc for deferral input too
              />
            )}
          </Space>
        );
      },
    },

    {
      title: "RM Status",
      width: 120,
      render: (_, record) => (
        <div style={{ opacity: 0.6 }}>{renderStatusTag(record)}</div>
      ),
    },
  ];

  return (
    <>
      <style>{customStyles}</style>

      <Modal
        title={`Review Checklist — ${checklist?.customerNumber || ""}`}
        open={open}
        onCancel={onClose}
        width={1100}
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
              onClick={handleSaveDraft}
              loading={isSavingDraft}
              disabled={!isActionAllowed}
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
              disabled={!isActionAllowed || uploadingSupportingDoc}
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
              loading={isLoading}
              onClick={submitRM}
              disabled={!isActionAllowed}
              style={{ backgroundColor: PRIMARY_BLUE, borderRadius: '6px', fontWeight: 600 }}
            >
              Submit to CO
            </Button>
          ),
        ]}
      >
        {/* 🔹 VIEW DOCUMENTS BUTTON (ADDED) */}
        <div style={{ position: "absolute", top: 16, right: 90, zIndex: 10 }}>
          <Button
            icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
            onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
          >
            View Documents
            {docs.filter((d) => d.fileUrl).length > 0 && (
              <Tag color="green" style={{ marginLeft: 6 }}>
                {docs.filter((d) => d.fileUrl).length}
              </Tag>
            )}
          </Button>
        </div>

        {/* 🔹 DOCUMENT SIDEBAR (ADDED) */}
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
              title="Checklist Details"
              style={{ marginBottom: 18, marginTop: 24 }}
            >
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="Customer Number">
                  {checklist.customerNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Loan Type">
                  {checklist.loanType}
                </Descriptions.Item>
                <Descriptions.Item label="DCL NO">
                  {checklist.dclNo}
                </Descriptions.Item>
                <Descriptions.Item label="IBPS No">
                  {" "}
                  {/* ✅ Added IBPS No */}
                  {checklist.ibpsNo || "Not provided"}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {checklist.createdBy?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {checklist.createdAt}
                </Descriptions.Item>
                <Descriptions.Item label="RM">
                  {checklist.assignedToRM?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Co-Checker">
                  {checklist.assignedToCoChecker?.name || "Pending"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Enhanced Progress Section - Applied the same concept with pending RM and pending CO */}
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
                <div style={{ fontWeight: "700", color: "#f59e0b" }}>
                  Pending RM: {pendingFromRM}
                </div>
                <div style={{ fontWeight: "700", color: "#8b5cf6" }}>
                  Pending CO: {pendingFromCo}
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

              {/* REMOVED: Status Breakdown Bar and Legend */}
            </div>

            <h3 style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
              Required Documents
            </h3>
            <Table
              className="doc-table"
              rowKey="docIdx"
              size="middle"
              pagination={false}
              dataSource={docs}
              columns={columns}
              scroll={{ x: "max-content" }}
            />

            <h3 style={{ marginTop: 24, color: PRIMARY_BLUE }}>
              Comment & Review History
            </h3>
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Comment Trail
              </h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>

            <h3
              style={{ marginTop: 24, color: PRIMARY_BLUE, fontWeight: "bold" }}
            >
              RM General Comment
            </h3>
            <Input.TextArea
              rows={3}
              value={rmGeneralComment}
              onChange={(e) => setRmGeneralComment(e.target.value)}
              placeholder="Enter RM general remarks..."
              style={{ borderRadius: 8, marginTop: 8 }}
              disabled={!isActionAllowed}
            />

            <div
              style={{
                marginTop: 20
              }}
            >
              {/* Also show supporting docs in a list below */}
              {supportingDocs.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <h4
                    style={{
                      color: PRIMARY_BLUE,
                      fontSize: 14,
                      marginBottom: 8,
                    }}
                  >
                    📎 Supporting Documents ({supportingDocs.length})
                  </h4>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {supportingDocs.map((doc) => (
                      <Card
                        size="small"
                        key={doc.id}
                        style={{ borderRadius: 6 }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 13 }}>{doc.name}</strong>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#666",
                                marginTop: 2,
                              }}
                            >
                              Uploaded:{" "}
                              {dayjs(doc.uploadedAt).format(
                                "DD MMM YYYY HH:mm",
                              )}
                            </div>
                          </div>
                          <Space>
                            <Button
                              size="small"
                              icon={<EyeOutlined />}
                              onClick={() =>
                                window.open(
                                  getFullUrl(
                                    doc.fileUrl || doc.uploadData?.fileUrl,
                                  ),
                                  "_blank",
                                )
                              }
                            >
                              View
                            </Button>
                            {!readOnly && (
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() =>
                                  handleDeleteSupportingDoc(
                                    doc.uploadData._id || doc.id,
                                    doc.name,
                                  )
                                }
                                disabled={!isActionAllowed}
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
          </>
        )}
      </Modal>
    </>
  );
};

export default RmReviewChecklistModal;
