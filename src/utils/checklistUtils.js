/**
 * Shared utility functions for checklist modals
 * Follows DRY principle by centralizing common logic
 */
import dayjs from "dayjs";

// API Base URL constant
export const API_BASE_URL = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

// Theme colors
export const THEME = {
    PRIMARY_BLUE: "#164679",
    ACCENT_LIME: "#b5d334",
    SECONDARY_PURPLE: "#7e6496",
    GREEN: "#52c41a",
    RED: "#f5222d",
    ORANGE: "#fa8c16",
    GOLD: "#faad14",
};

/**
 * Constructs full URL from partial path
 * @param {string} url - The URL or path to process
 * @returns {string} Full URL
 */
export const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

/**
 * Calculate expiry status for a document
 * @param {string|Date} expiryDate - The document's expiry date
 * @returns {{ status: string, color: string, isExpired: boolean }}
 */
export const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: "N/A", color: "default", isExpired: false };
    const isExpired = dayjs(expiryDate).isBefore(dayjs());
    return isExpired
        ? { status: "Expired", color: "red", isExpired: true }
        : { status: "Current", color: "green", isExpired: false };
};

/**
 * Get color configuration for a given status
 * @param {string} status - Document status
 * @returns {{ color: string, bgColor: string, label: string }}
 */
export const getStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase().replace(/\s+/g, "_");

    const configs = {
        approved: { color: "green", bgColor: "#f6ffed", label: "Approved" },
        submitted: { color: "blue", bgColor: "#e6f7ff", label: "Submitted" },
        submitted_for_review: { color: "blue", bgColor: "#e6f7ff", label: "Submitted for Review" },
        pending: { color: "orange", bgColor: "#fff7e6", label: "Pending" },
        pending_from_customer: { color: "gold", bgColor: "#fffbe6", label: "Pending from Customer" },
        pendingrm: { color: "orange", bgColor: "#fff7e6", label: "Pending RM" },
        pendingco: { color: "purple", bgColor: "#f9f0ff", label: "Pending Co" },
        rejected: { color: "red", bgColor: "#fff2f0", label: "Rejected" },
        tbo: { color: "cyan", bgColor: "#e6fffb", label: "TBO" },
        sighted: { color: "lime", bgColor: "#fcffe6", label: "Sighted" },
        waived: { color: "magenta", bgColor: "#fff0f6", label: "Waived" },
        deferred: { color: "volcano", bgColor: "#fff2e8", label: "Deferred" },
        defferal_requested: { color: "volcano", bgColor: "#fff2e8", label: "Deferral Requested" },
        expired: { color: "red", bgColor: "#fff2f0", label: "Expired" },
        current: { color: "green", bgColor: "#f6ffed", label: "Current" },
        co_review: { color: "geekblue", bgColor: "#f0f5ff", label: "Co Review" },
        rm_review: { color: "blue", bgColor: "#e6f7ff", label: "RM Review" },
        co_checker_review: { color: "purple", bgColor: "#f9f0ff", label: "Co-Checker Review" },
        completed: { color: "green", bgColor: "#f6ffed", label: "Completed" },
        draft: { color: "default", bgColor: "#fafafa", label: "Draft" },
    };

    return configs[statusLower] || { color: "default", bgColor: "#fafafa", label: status || "Unknown" };
};

/**
 * Calculate document statistics from a flat document array
 * @param {Array} docs - Flat array of documents
 * @returns {{ total: number, submitted: number, pending: number, approved: number, rejected: number, deferred: number, waived: number, tbo: number, sighted: number }}
 */
export const calculateDocumentStats = (docs = []) => {
    const stats = {
        total: docs.length,
        submitted: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        deferred: 0,
        waived: 0,
        tbo: 0,
        sighted: 0,
        pendingRm: 0,
        pendingCo: 0,
    };

    docs.forEach((doc) => {
        const status = (doc.action || doc.status || "pending").toLowerCase();
        switch (status) {
            case "submitted":
            case "submitted_for_review":
                stats.submitted++;
                break;
            case "approved":
                stats.approved++;
                break;
            case "pending":
                stats.pending++;
                break;
            case "pendingrm":
            case "pending_from_customer":
                stats.pendingRm++;
                break;
            case "pendingco":
                stats.pendingCo++;
                break;
            case "rejected":
                stats.rejected++;
                break;
            case "deferred":
            case "defferal_requested":
                stats.deferred++;
                break;
            case "waived":
                stats.waived++;
                break;
            case "tbo":
                stats.tbo++;
                break;
            case "sighted":
                stats.sighted++;
                break;
            default:
                stats.pending++;
        }
    });

    return stats;
};

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Flatten nested documents structure to flat array
 * @param {Array} documents - Nested documents array [{ category, docList: [...] }]
 * @returns {Array} Flat array of documents with category property
 */
export const flattenDocuments = (documents = []) => {
    const flatDocs = [];
    documents.forEach((cat) => {
        (cat.docList || []).forEach((doc, idx) => {
            flatDocs.push({
                ...doc,
                category: cat.category,
                docIdx: flatDocs.length,
                originalStatus: doc.status,
                action: doc.action || doc.status || "pending",
                comment: doc.comment || "",
            });
        });
    });
    return flatDocs;
};

/**
 * Convert flat documents array back to nested structure
 * @param {Array} flatDocs - Flat array of documents
 * @returns {Array} Nested documents array [{ category, docList: [...] }]
 */
export const nestDocuments = (flatDocs = []) => {
    return flatDocs.reduce((acc, doc) => {
        let categoryGroup = acc.find((c) => c.category === doc.category);
        if (!categoryGroup) {
            categoryGroup = { category: doc.category, docList: [] };
            acc.push(categoryGroup);
        }
        const { category, docIdx, originalStatus, ...docData } = doc;
        categoryGroup.docList.push(docData);
        return acc;
    }, []);
};

/**
 * Custom styles for checklist modals
 * @returns {string} CSS styles
 */
export const getModalStyles = () => `
  .ant-modal-header {
      background-color: ${THEME.PRIMARY_BLUE} !important;
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
    border-bottom: 2px solid ${THEME.ACCENT_LIME} !important;
  }
  .checklist-info-card .ant-descriptions-item-label {
      font-weight: 600 !important;
      color: ${THEME.SECONDARY_PURPLE} !important;
  }
  .checklist-info-card .ant-descriptions-item-content {
      color: ${THEME.PRIMARY_BLUE} !important;
      font-weight: 700 !important;
  }

  .doc-table.ant-table-wrapper table {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }
  .doc-table .ant-table-thead > tr > th {
      background-color: #f7f9fc !important;
      color: ${THEME.PRIMARY_BLUE} !important;
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
    justify-content: center;
    min-width: 80px;
  }
`;

/**
 * Get unique categories from documents
 * @param {Array} docs - Flat array of documents
 * @returns {Array<string>} Unique category names
 */
export const getUniqueCategories = (docs = []) => {
    return [...new Set(docs.map((d) => d.category).filter(Boolean))];
};

/**
 * Validate file type for upload
 * @param {File} file - File object
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {boolean} Whether file type is valid
 */
export const isValidFileType = (file, allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]) => {
    return allowedTypes.includes(file.type);
};

/**
 * Validate file size for upload
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {boolean} Whether file size is valid
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
    return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Check if RM actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canRmActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const allowedStatuses = ["pendingrm", "submitted", "pending", "pending_from_customer"];
    return allowedStatuses.includes(status);
};

/**
 * Check if Co-Creator actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canCoCreatorActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const allowedStatuses = ["pendingco", "pending", "submitted", "pendingrm"];
    return allowedStatuses.includes(status);
};

/**
 * Check if Checker actions are allowed for a document
 * @param {Object} doc - Document object
 * @returns {boolean} Whether actions are allowed
 */
export const canCheckerActOnDoc = (doc) => {
    const status = (doc?.status || "").toLowerCase();
    const checkerStatus = (doc?.checkerStatus || "").toLowerCase();
    // Checker can act if document is submitted and not yet approved/rejected by checker
    return status === "submitted" && checkerStatus !== "approved" && checkerStatus !== "rejected";
};
