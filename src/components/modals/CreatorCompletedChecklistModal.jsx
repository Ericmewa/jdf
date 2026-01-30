import React, { useState, useEffect } from "react";
import CommentHistory from "../common/CommentHistory";
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
  Row,
  Col,
} from "antd";
import {
  EyeOutlined,
  UserOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  RedoOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useGetChecklistCommentsQuery } from "../../api/checklistApi";
import { getFullUrl as getFullUrlUtil } from "../../utils/checklistUtils.js";

const { Title, Text } = Typography;

// Theme Colors
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SUCCESS_GREEN = "#52c41a";
const SECONDARY_PURPLE = "#7e6496";
const WARNING_ORANGE = "#faad14";
const ERROR_RED = "#ff4d4f";

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
      color: "success",
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
        color: "success",
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

// ENHANCED PROGRESS CALCULATION FUNCTION (from first code)
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

  const progressPercent =
    total === 0
      ? 0
      : docs.filter(
        (d) =>
          d.action?.toLowerCase() === "pendingco" ||
          d.status?.toLowerCase() === "pendingco",
      ).length === 0
        ? 100
        : Math.round((submitted / total) * 100);

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

const CreatorCompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  onRevive,
  onRefreshData,
  readOnly = false,
}) => {
  console.log(
    "🔍 [Modal] CreatorCompletedChecklistModal rendered with props:",
    {
      checklist: checklist?._id,
      open,
      hasOnRevive: !!onRevive,
      hasOnRefreshData: !!onRefreshData,
    },
  );

  const [docs, setDocs] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isReviving, setIsReviving] = useState(false);
  const [showReviveConfirm, setShowReviveConfirm] = useState(false);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    console.log("Checklist status:", checklist.status); // Debug log
    console.log("Checklist documents:", checklist.documents); // Debug log

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          checkerStatus:
            doc.checkerStatus ||
            doc.coCheckerStatus ||
            doc.co_checker_status ||
            null,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category)
        return acc.concat({
          ...item,
          checkerStatus:
            item.checkerStatus ||
            item.coCheckerStatus ||
            item.co_checker_status ||
            null,
        });
      return acc;
    }, []);

    const preparedDocs = flatDocs.map((doc, idx) => {
      // Determine final checker status based on overall checklist status
      let finalCheckerStatus = doc.checkerStatus || null;

      // CRITICAL FIX: If checklist is approved/completed, all documents should show as approved
      if (checklist.status === "approved" || checklist.status === "completed") {
        finalCheckerStatus = "approved";
        console.log(
          `Document ${idx} - ${doc.name || doc.documentName
          } - Setting to 'approved' because checklist is ${checklist.status}`,
        );
      } else if (checklist.status === "rejected") {
        finalCheckerStatus = "rejected";
        console.log(
          `Document ${idx} - ${doc.name || doc.documentName
          } - Setting to 'rejected' because checklist is ${checklist.status}`,
        );
      } else {
        // For other statuses, use the individual document status
        finalCheckerStatus = doc.checkerStatus || "pending";
        console.log(
          `Document ${idx} - ${doc.name || doc.documentName
          } - Using original checker status: ${doc.checkerStatus}`,
        );
      }

      return {
        ...doc,
        docIdx: idx,
        status: doc.status || "pending",
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
      "Prepared docs with finalCheckerStatus:",
      preparedDocs.map((d) => ({
        name: d.name,
        checkerStatus: d.checkerStatus,
        finalCheckerStatus: d.finalCheckerStatus,
      })),
    ); // Debug log

    setDocs(preparedDocs);
  }, [checklist]);

  // Calculate document stats using the enhanced function (from first code)
  const documentStats = calculateDocumentStats(docs);

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
    progressPercent,
  } = documentStats;

  // Check if checklist is completed/approved
  const isChecklistCompleted =
    checklist?.status === "approved" ||
    checklist?.status === "completed" ||
    checklist?.status === "rejected";

  // Function to generate and download PDF (KEEP ORIGINAL VERSION)
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
      pdfContainer.style.width = "800px";
      pdfContainer.style.padding = "20px";
      pdfContainer.style.backgroundColor = "white";
      pdfContainer.style.fontFamily = "Arial, sans-serif";

      // Format date for display
      const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return dayjs(dateString).format("DD MMM YYYY HH:mm:ss");
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

      // Calculate document stats - EXACT COUNTS for PDF
      const totalDocs = docs.length;
      const submittedCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "submitted",
      ).length;
      const waivedCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "waived",
      ).length;
      const tboCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "tbo",
      ).length;
      const sightedCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "sighted",
      ).length;
      const deferredCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "deferred",
      ).length;
      const pendingRmCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "pendingrm",
      ).length;
      const pendingCoCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "pendingco",
      ).length;
      const approvedCountPDF = docs.filter(
        (d) => (d.status || "").toLowerCase() === "approved",
      ).length;

      // Calculate checker status stats - based on overall checklist status
      let checkerApproved = 0;
      let checkerRejected = 0;
      let checkerPending = 0;
      let checkerReviewed = 0;

      if (status === "approved" || status === "completed") {
        checkerApproved = totalDocs;
      } else if (status === "rejected") {
        checkerRejected = totalDocs;
      } else {
        // For in-progress checklists, use individual document statuses
        checkerApproved = docs.filter(
          (d) => d.checkerStatus === "approved",
        ).length;
        checkerRejected = docs.filter(
          (d) => d.checkerStatus === "rejected",
        ).length;
        checkerPending = docs.filter(
          (d) => d.checkerStatus === "pending" || !d.checkerStatus,
        ).length;
        checkerReviewed = docs.filter(
          (d) => d.checkerStatus === "reviewed",
        ).length;
      }

      // Build the PDF content
      pdfContainer.innerHTML = `
        <div class="pdf-export-container" style="font-family: Arial, sans-serif; color: #333;">
          <!-- Header Section -->
          <div style="margin-bottom: 30px; border-bottom: 2px solid #164679; padding-bottom: 15px;">
            <h1 style="color: #164679; font-size: 28px; font-weight: bold; margin-bottom: 5px;">
              Completed Checklist - ${customerNumber}
            </h1>
            <p style="color: #666; font-size: 14px; margin: 0;">
              DCL No: ${dclNo} | Completed on: ${completedAt ? formatDate(completedAt) : formatDate(new Date())
        }
            </p>
          </div>
         
          <!-- Checklist Information Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #164679; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #b5d334; padding-left: 10px;">
              Checklist Information
            </h2>
           
            <!-- First row of info boxes -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  Customer Number
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${customerNumber}
                </div>
              </div>
             
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  DCL No
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${dclNo}
                </div>
              </div>
             
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  IBPS No
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${ibpsNo}
                </div>
              </div>
            </div>
           
            <!-- Second row of info boxes -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 15px;">
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  Loan Type
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${loanType}
                </div>
              </div>
             
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  Created By
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${createdBy}
                </div>
              </div>
             
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  RM
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${rm}
                </div>
              </div>
            </div>
           
            <!-- Third row of info boxes -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  Co-Checker
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  ${coChecker}
                </div>
              </div>
             
              <div style="border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; background: #f9f9f9;">
                <div style="font-size: 12px; color: #7e6496; font-weight: 600; margin-bottom: 5px;">
                  Overall Status
                </div>
                <div style="font-size: 16px; color: #164679; font-weight: bold;">
                  <span style="
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    background: ${status === "completed"
          ? "#d4edda"
          : status === "approved"
            ? "#d4edda"
            : status === "rejected"
              ? "#f8d7da"
              : status === "co_checker_review"
                ? "#cce5ff"
                : "#fff3cd"
        };
                    color: ${status === "completed"
          ? "#155724"
          : status === "approved"
            ? "#155724"
            : status === "rejected"
              ? "#721c24"
              : status === "co_checker_review"
                ? "#004085"
                : "#856404"
        };
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: capitalize;
                  ">
                    ${status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
         
          <!-- Document Summary Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #164679; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #b5d334; padding-left: 10px;">
              Document Summary
            </h2>
           
            <!-- Detailed Status Breakdown -->
            <div style="background: #f7f9fc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
              <h3 style="color: #164679; font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center;">
                Document Status Breakdown
              </h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
                <div style="background: #d4edda; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #155724;">${submittedCountPDF}</div>
                  <div style="font-size: 11px; color: #155724;">Submitted</div>
                </div>
                <div style="background: #e2e3e5; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: "#383d41;">${waivedCountPDF}</div>
                  <div style="font-size: 11px; color: "#383d41;">Waived</div>
                </div>
                <div style="background: #d1ecf1; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #0c5460;">${tboCountPDF}</div>
                  <div style="font-size: 11px; color: #0c5460;">TBO</div>
                </div>
                <div style="background: #cce5ff; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #004085;">${sightedCountPDF}</div>
                  <div style="font-size: 11px; color: #004085;">Sighted</div>
                </div>
                <div style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #856404;">${deferredCountPDF}</div>
                  <div style="font-size: 11px; color: #856404;">Deferred</div>
                </div>
                <div style="background: #f8d7da; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #721c24;">${pendingRmCountPDF}</div>
                  <div style="font-size: 11px; color: #721c24;">Pending RM</div>
                </div>
                <div style="background: #f5c6cb; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #721c24;">${pendingCoCountPDF}</div>
                  <div style="font-size: 11px; color: #721c24;">Pending CO</div>
                </div>
                <div style="background: #d4edda; padding: 8px; border-radius: 4px;">
                  <div style="font-size: 18px; font-weight: bold; color: #155724;">${approvedCountPDF}</div>
                  <div style="font-size: 11px; color: #155724;">Approved</div>
                </div>
              </div>
              <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
                Total Documents: <strong style="color: #164679;">${totalDocs}</strong>
              </div>
            </div>
           
            <!-- Progress Bar -->
            <div style="background: #f7f9fc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-top: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="font-size: 14px; font-weight: bold; color: #164679;">
                  Overall Progress
                </span>
                <span style="font-size: 14px; font-weight: bold; color: #164679;">
                  ${status === "approved" ||
          status === "completed" ||
          status === "rejected"
          ? "100%"
          : totalDocs === 0
            ? "0%"
            : Math.round(
              ((submittedCountPDF +
                waivedCountPDF +
                sightedCountPDF +
                approvedCountPDF +
                (deferredCountPDF + tboCountPDF) * 0.5) /
                totalDocs) *
              100,
            ) + "%"
        }
                </span>
              </div>
             
              <div style="width: 100%; height: 10px; background: #e0e0e0; border-radius: 5px; overflow: hidden; margin-bottom: 5px;">
                <div style="
                  width: ${status === "approved" ||
          status === "completed" ||
          status === "rejected"
          ? "100%"
          : totalDocs === 0
            ? "0%"
            : Math.round(
              ((submittedCountPDF +
                waivedCountPDF +
                sightedCountPDF +
                approvedCountPDF +
                (deferredCountPDF + tboCountPDF) * 0.5) /
                totalDocs) *
              100,
            ) + "%"
        };
                  height: 100%;
                  background: ${status === "approved" || status === "completed"
          ? "linear-gradient(90deg, #52c41a, #87d068)"
          : status === "rejected"
            ? "linear-gradient(90deg, #f5222d, #ff7875)"
            : "linear-gradient(90deg, #52c41a, #87d068)"
        };
                "></div>
              </div>
             
              <div style="text-align: right; font-size: 12px; color: #666; margin-top: 5px;">
                ${status === "approved" ||
          status === "completed" ||
          status === "rejected"
          ? "✓ Checklist Completed"
          : "Weighted progress calculation"
        }
              </div>
            </div>
           
            <!-- Checker Status Summary -->
            <div style="background: #f7f9fc; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-top: 20px;">
              <h3 style="color: #164679; font-size: 16px; font-weight: bold; margin-bottom: 15px; text-align: center;">
                Co-Checker Review Status
              </h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center;">
                  <div style="font-size: 28px; color: #52c41a; font-weight: bold; margin-bottom: 5px;">
                    ${checkerApproved}
                  </div>
                  <div style="font-size: 12px; color: #7e6496; font-weight: 600;">
                    Approved by Checker
                  </div>
                </div>
               
                <div style="text-align: center;">
                  <div style="font-size: 28px; color: #f5222d; font-weight: bold; margin-bottom: 5px;">
                    ${checkerRejected}
                  </div>
                  <div style="font-size: 12px; color: #7e6496; font-weight: 600;">
                    Rejected by Checker
                  </div>
                </div>
               
                <div style="text-align: center;">
                  <div style="font-size: 28px; color: #fa8c16; font-weight: bold; margin-bottom: 5px;">
                    ${checkerPending}
                  </div>
                  <div style="font-size: 12px; color: #7e6496; font-weight: 600;">
                    Pending Review
                  </div>
                </div>
               
                <div style="text-align: center;">
                  <div style="font-size: 28px; color: #1890ff; font-weight: bold; margin-bottom: 5px;">
                    ${checkerReviewed}
                  </div>
                  <div style="font-size: 12px; color: #7e6496; font-weight: 600;">
                    Reviewed
                  </div>
                </div>
              </div>
              ${status === "approved" || status === "completed"
          ? `
                <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 4px; margin-top: 10px;">
                  <span style="color: #155724; font-weight: bold;">✓ All documents have been approved by the co-checker</span>
                </div>
              `
          : status === "rejected"
            ? `
                <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 4px; margin-top: 10px;">
                  <span style="color: #721c24; font-weight: bold;">✗ All documents have been rejected by the co-checker</span>
                </div>
              `
            : ""
        }
            </div>
          </div>
         
          <!-- Document Details Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #164679; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #b5d334; padding-left: 10px;">
              Document Details
            </h2>
           
            ${docs.length > 0
          ? `
              <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background: #f7f9fc;">
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Category
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Document Name
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Co Status
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Checker Status
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Co Comment
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Expiry Date
                    </th>
                    <th style="padding: 12px 15px; text-align: left; font-size: 12px; font-weight: bold; color: #164679; border-bottom: 2px solid #b5d334;">
                      Expiry Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${docs
            .map((doc, index) => {
              const status = doc.status || doc.action || "pending";
              const statusLower = status.toLowerCase();

              // Determine the checker status to display based on overall checklist status
              let displayCheckerStatus = doc.finalCheckerStatus;
              let displayCheckerText = displayCheckerStatus || "";

              // Get checker status colors
              const getCheckerStatusColorForPDF = (
                checkerStatus,
                checklistStatus,
              ) => {
                // If checklist is approved/completed, all documents are approved by checker
                if (
                  checklistStatus === "approved" ||
                  checklistStatus === "completed"
                ) {
                  return { bg: "#d4edda", color: "#155724" };
                }

                // If checklist is rejected, all documents are rejected by checker
                if (checklistStatus === "rejected") {
                  return { bg: "#f8d7da", color: "#721c24" };
                }

                if (!checkerStatus)
                  return { bg: "#f5f5f5", color: "#666" };

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

              const checkerColors = getCheckerStatusColorForPDF(
                displayCheckerStatus,
                checklist.status,
              );

              // Determine status color
              let statusColor = "#666";
              let statusBg = "#f5f5f5";

              if (
                statusLower.includes("submitted") ||
                statusLower.includes("approved")
              ) {
                statusColor = "#155724";
                statusBg = "#d4edda";
              } else if (statusLower.includes("pending")) {
                statusColor = "#721c24";
                statusBg = "#f8d7da";
              } else if (statusLower.includes("deferred")) {
                statusColor = "#856404";
                statusBg = "#fff3cd";
              } else if (statusLower.includes("sighted")) {
                statusColor = "#004085";
                statusBg = "#cce5ff";
              } else if (statusLower.includes("waived")) {
                statusColor = "#383d41";
                statusBg = "#e2e3e5";
              } else if (statusLower.includes("tbo")) {
                statusColor = "#0c5460";
                statusBg = "#d1ecf1";
              }

              // Format status display text
              let statusText = status;
              if (statusLower === "deferred" && doc.deferralNo) {
                statusText = `Deferred (${doc.deferralNo})`;
              }

              // Check expiry status for compliance documents
              const isCompliance = (doc.category || "")
                .toLowerCase()
                .includes("compliance");
              const expiryStatus = isCompliance
                ? getExpiryStatus(doc.expiryDate)
                : null;

              return `
                      <tr style="${index % 2 === 0
                  ? "background: #fafafa;"
                  : "background: white;"
                }">
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 12px; color: #7e6496;">
                          ${doc.category || "N/A"}
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 12px; font-weight: 500;">
                          ${doc.name || "N/A"}
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                          <span style="
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 12px;
                            background: ${statusBg};
                            color: ${statusColor};
                            font-size: 11px;
                            font-weight: bold;
                            text-align: center;
                            min-width: 80px;
                          ">
                            ${statusText}
                          </span>
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                          <span style="
                            display: inline-block;
                            padding: 4px 10px;
                            border-radius: 12px;
                            background: ${checkerColors.bg};
                            color: ${checkerColors.color};
                            font-size: 11px;
                            font-weight: bold;
                            text-align: center;
                            min-width: 80px;
                          ">
                            ${displayCheckerText || "-"}
                          </span>
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #666;">
                          ${doc.comment || "-"}
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0; font-size: 12px;">
                          ${doc.expiryDate
                  ? dayjs(doc.expiryDate).format("DD/MM/YYYY")
                  : "-"
                }
                        </td>
                        <td style="padding: 10px 15px; border-bottom: 1px solid #e0e0e0;">
                          ${(() => {
                  if (!expiryStatus) return "-";
                  return `
                              <span style="
                                display: inline-block;
                                padding: 4px 10px;
                                border-radius: 4px;
                                background: ${expiryStatus === "current"
                      ? "#d4edda"
                      : "#f8d7da"
                    };
                                color: ${expiryStatus === "current"
                      ? "#155724"
                      : "#721c24"
                    };
                                font-size: 11px;
                                font-weight: bold;
                              ">
                                ${expiryStatus === "current"
                      ? "Current"
                      : "Expired"
                    }
                              </span>
                            `;
                })()}
                        </td>
                      </tr>
                    `;
            })
            .join("")}
                </tbody>
              </table>
            `
          : `
              <div style="text-align: center; padding: 40px; color: #999; font-size: 14px; border: 1px dashed #e0e0e0; border-radius: 6px;">
                No documents found in this checklist
              </div>
            `
        }
          </div>
         
          <!-- Comment Trail Section -->
          ${comments && comments.length > 0
          ? `
            <div style="margin-bottom: 30px;">
              <h2 style="color: #164679; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #b5d334; padding-left: 10px;">
                Comment Trail & History (${comments.length} comments)
              </h2>
              <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px;">
                ${comments
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt || b.timestamp) -
                new Date(a.createdAt || a.timestamp),
            )
            .map((comment, index) => {
              const userName = comment.userId?.name || "System";
              const userRole = comment.userId?.role || "system";
              const message = comment.message || "";
              const timestamp = comment.createdAt || comment.timestamp;
              const formattedTime = formatDate(timestamp);

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
                  roleColor = "volcano";
                  break;
                case "checker":
                  roleColor = "volcano";
                  break;
                case "system":
                  roleColor = "default";
                  break;
                default:
                  roleColor = "blue";
              }

              return `
                    <div style="margin-bottom: ${index < comments.length - 1 ? "15px" : "0"
                }; padding-bottom: ${index < comments.length - 1 ? "15px" : "0"
                }; border-bottom: ${index < comments.length - 1 ? "1px solid #f0f0f0" : "none"
                };">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: #164679; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                            ${userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style="font-weight: bold; color: #164679; font-size: 14px;">
                              ${userName}
                            </div>
                            <span style="
                              display: inline-block;
                              padding: 2px 8px;
                              border-radius: 10px;
                              background: ${roleColor === "purple"
                  ? "#d6c1ff"
                  : roleColor === "green"
                    ? "#d4edda"
                    : roleColor === "volcano"
                      ? "#ffccc7"
                      : roleColor === "default"
                        ? "#f0f0f0"
                        : "#d0e8ff"
                };
                              color: ${roleColor === "purple"
                  ? "#7e6496"
                  : roleColor === "green"
                    ? "#155724"
                    : roleColor === "volcano"
                      ? "#721c24"
                      : roleColor === "default"
                        ? "#666"
                        : "#004085"
                };
                              font-size: 10px;
                              font-weight: bold;
                              text-transform: uppercase;
                              margin-top: 2px;
                            ">
                              ${roleLower.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                          ${formattedTime}
                        </div>
                      </div>
                      <div style="margin-left: 40px; font-size: 13px; line-height: 1.5; color: #333; word-break: break-word;">
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
            <div style="margin-bottom: 30px;">
              <h2 style="color: #164679; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #b5d334; padding-left: 10px;">
                Comment Trail & History
              </h2>
              <div style="text-align: center; padding: 30px; color: #999; font-size: 14px; border: 1px dashed #e0e0e0; border-radius: 6px; font-style: italic;">
                No historical comments yet.
              </div>
            </div>
          `
        }
         
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 11px;">
            <div style="margin-bottom: 5px;">
              Generated on ${dayjs().format("DD MMM YYYY HH:mm:ss")}
            </div>
            <div>
              Document Control: ${dclNo} • Customer: ${customerNumber} • Status: ${status.replace(
          /_/g,
          " ",
        )} • Total Comments: ${comments?.length || 0}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Convert to canvas then to PDF
      const canvas = await html2canvas.default(pdfContainer, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(
        `Completed_Checklist_${dclNo}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`,
      );

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

  // Handle revive checklist - KEEP ORIGINAL FUNCTION
  const handleReviveChecklist = () => {
    console.log("🎯 Revive button clicked!");
    console.log("📋 Checklist data:", checklist);
    console.log("🆔 Checklist ID:", checklist?._id);
    console.log("🔗 onRevive prop exists:", !!onRevive);
    console.log("🔗 onRevive is function:", typeof onRevive === "function");

    if (!checklist?._id) {
      console.error("❌ No checklist ID found!");
      message.error("Cannot revive: Checklist ID is missing");
      return;
    }

    if (!onRevive || typeof onRevive !== "function") {
      console.error("❌ onRevive prop is not a function or not provided!");
      message.error("Cannot revive: Missing revive function");
      return;
    }

    console.log("🔄 Setting showReviveConfirm to true...");
    setShowReviveConfirm(true);
  };

  // KEEP ORIGINAL handleConfirmRevive
  const handleConfirmRevive = async () => {
    console.log("✅ User confirmed revival for checklist ID:", checklist._id);
    setShowReviveConfirm(false);
    setIsReviving(true);

    try {
      message.loading({
        content: "Creating new checklist from template...",
        duration: 0,
        key: "revive",
      });

      console.log("📞 Calling onRevive with ID:", checklist._id);
      const result = await onRevive(checklist._id);
      console.log("✅ onRevive result:", result);

      message.success({
        content:
          result?.message ||
          "New checklist created successfully! It will appear in Created Checklists For Review section.",
        duration: 4,
        key: "revive",
      });

      // Refresh data to ensure UI is updated
      onRefreshData?.();

      // Close modal after a short delay to ensure refresh happens
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("❌ Error in revival process:", error);
      console.error("❌ Error status:", error?.status);
      console.error("❌ Error data:", error?.data);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));

      let errorMessage = "Failed to revive checklist. Please try again.";

      if (error?.status === 500) {
        // Check for specific notification validation errors
        if (
          error?.data?.error?.includes("REVIVED") &&
          error?.data?.error?.includes("not a valid enum value")
        ) {
          errorMessage =
            "Notification system error: 'REVIVED' is not configured as a valid notification type. Please contact the development team to update the notification schema.";
        } else {
          errorMessage =
            "Server error occurred while reviving checklist. This might be a temporary issue. Please try again later or contact support.";
        }
      } else if (
        error?.status === 400 &&
        error?.data?.message?.includes("revived")
      ) {
        errorMessage =
          "This checklist has already been revived. Please refresh the page to see the updated status.";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error({
        content: errorMessage,
        duration: 5,
        key: "revive",
      });

      // Refresh data even on error to ensure UI is up to date
      onRefreshData?.();

      // Close the modal if checklist was already revived
      if (error?.status === 400 && error?.data?.message?.includes("revived")) {
        setTimeout(() => onClose(), 100);
      }
    } finally {
      setIsReviving(false);
    }
  };

  // KEEP ORIGINAL handleCancelRevive
  const handleCancelRevive = () => {
    console.log("❌ User cancelled revival");
    setShowReviveConfirm(false);
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

  return (
    <>
      {console.log("🎨 [Modal] Rendering Modal component, open:", open)}
      <Modal
        title={
          <span
            style={{
              color: "white",
              fontSize: "1.15rem",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            Completed Checklist - {checklist?.title || ""}
          </span>
        }
        open={open}
        onCancel={onClose}
        width={1100}
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
            }}
          >
            Download as PDF
          </Button>,
          !readOnly && (
            <Button
              key="revive"
              icon={<RedoOutlined />}
              loading={isReviving}
              disabled={isReviving}
              onClick={() => {
                console.log("🔥 [Modal] Revive button clicked directly!");
                console.log("🔥 [Modal] Modal is open:", open);
                console.log("🔥 [Modal] Checklist exists:", !!checklist);
                console.log("🔥 [Modal] Button is not disabled:", !isReviving);
                handleReviveChecklist();
              }}
              style={{
                background: ACCENT_LIME,
                borderColor: ACCENT_LIME,
                color: PRIMARY_BLUE,
                fontWeight: 600,
              }}
            >
              Revive Checklist
            </Button>
          ),
          <Button key="close" onClick={onClose}>
            Close
          </Button>,
        ]}
        // Add these styles for the blue header (from first code)
        styles={{
          header: {
            background: PRIMARY_BLUE,
            padding: "18px 24px",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
          body: {
            padding: 24,
          },
          footer: {
            padding: "16px 24px",
            borderTop: "1px solid #f0f0f0",
          },
        }}
      >
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
                <Descriptions.Item label="Customer number">
                  {checklist.customerNumber || "Not provided"}
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

            {/* ENHANCED Progress Section - Matching the first code style */}
            <div
              style={{
                padding: "16px",
                background: "#f7f9fc",
                borderRadius: 8,
                border: "1px solid #e0e0e0",
                marginBottom: 18,
              }}
            >
              {/* Stats Row - counts of each status (from first code) */}
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

              {/* Progress Bar (from first code) */}
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

            <div style={{ marginTop: 24 }}>
              <h4>Comment Trail & History</h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>
          </>
        )}
      </Modal>

      {/* Revive Confirmation Dialog - KEEP ORIGINAL */}
      <Modal
        title="Revive Checklist"
        open={showReviveConfirm}
        onCancel={handleCancelRevive}
        centered
        footer={[
          <Button key="cancel" onClick={handleCancelRevive}>
            Cancel
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={isReviving}
            onClick={handleConfirmRevive}
            style={{
              background: ACCENT_LIME,
              borderColor: ACCENT_LIME,
              color: PRIMARY_BLUE,
              fontWeight: 600,
            }}
          >
            Revive Checklist
          </Button>,
        ]}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
            Are you sure you want to revive this checklist?
          </p>
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: "rgba(181, 211, 52, 0.1)",
              borderRadius: 8,
              borderLeft: `4px solid ${ACCENT_LIME}`,
            }}
          >
            <Text
              strong
              style={{
                color: PRIMARY_BLUE,
                display: "block",
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              ✨ This action will:
            </Text>
            <ul
              style={{
                margin: "8px 0 12px",
                paddingLeft: 20,
                fontSize: 12,
                lineHeight: 1.8,
              }}
            >
              <li>Create a new checklist based on this completed one</li>
              <li>Copy customer information and loan details</li>
              <li>Preserve document templates and categories</li>
              <li>Generate a new DCL number for the revived checklist</li>
              <li>Set status to "Revived" for tracking</li>
              <li>Add it to "Created Checklists For Review" section</li>
            </ul>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                display: "block",
                marginTop: 8,
                color: "#555",
                fontStyle: "italic",
              }}
            >
              💡 Ideal for: Revolving facilities, follow-up loans, or similar
              transactions.
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CreatorCompletedChecklistModal;
