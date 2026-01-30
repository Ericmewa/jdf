import React from "react";
import { Drawer, Tag, Collapse, Card, Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Panel } = Collapse;
const API_BASE_URL = import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

const DocumentSidebar = ({ documents, open, onClose, supportingDocs = [] }) => {
    // Include ALL documents - those with uploads, fileUrl, OR newly added ones
    const uploadedDocs = documents.filter(
        (d) => (d.uploadData && d.uploadData.status !== "deleted") || d.fileUrl || d.isNew
    );

    // Combine with supporting docs
    const allDocs = [...uploadedDocs, ...supportingDocs];

    const groupedDocs = allDocs.reduce((acc, doc) => {
        const group = doc.category || "Main Documents";
        if (!acc[group]) acc[group] = [];
        acc[group].push(doc);
        return acc;
    }, {});


    const getFullUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http") || url.startsWith("blob:")) return url;
        return `${API_BASE_URL}${url}`;
    };

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
                >
                    <Panel
                        header={<b style={{ color: "#164679" }}>{category} ({docs.length})</b>}
                        key={category}
                    >
                        {docs.map((doc, idx) => {
                            const uploadData = doc.uploadData || doc; // Handle both structures
                            const fileUrl = uploadData.fileUrl || doc.fileUrl;
                            const hasFile = fileUrl || (doc.uploadData && doc.uploadData.status !== "deleted");

                            return (
                                <Card
                                    key={idx}
                                    size="small"
                                    style={{
                                        borderRadius: 10,
                                        marginBottom: 12,
                                        border: doc.isNew ? "2px solid #b5d334" : "1px solid #e5e7eb",
                                    }}
                                >
                                    {/* HEADER */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <b>{uploadData.fileName || doc.name}</b>
                                        <div>
                                            {doc.isNew && <Tag color="lime">New</Tag>}
                                            {!hasFile && <Tag color="orange">No File</Tag>}
                                        </div>
                                    </div>


                                    {/* META */}
                                    <div style={{ fontSize: 12, color: "#374151" }}>
                                        🕒{" "}
                                        {uploadData.createdAt || uploadData.uploadDate
                                            ? dayjs(uploadData.createdAt || uploadData.uploadDate).format(
                                                "DD MMM YYYY HH:mm:ss"
                                            )
                                            : "N/A"}
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
                                            👤 By: <b>{uploadData.uploadedBy || "Unknown"}</b>
                                        </div>

                                        {fileUrl && (
                                            <Button
                                                type="link"
                                                icon={<DownloadOutlined />}
                                                onClick={() => window.open(getFullUrl(fileUrl), "_blank")}
                                            >
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </Panel>
                </Collapse>
            ))}
        </Drawer>
    );
};

export default DocumentSidebar;
