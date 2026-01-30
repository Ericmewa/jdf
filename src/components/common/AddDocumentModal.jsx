/**
 * Shared modal component for adding new documents to a checklist
 * Used by RmReviewChecklistModal, ReviewChecklistModal, and CheckerReviewChecklistModal
 */
import React, { useState } from "react";
import { Modal, Input, Select, Button, Space, Upload, message } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { THEME } from "../../utils/checklistUtils";

const { Option } = Select;

/**
 * AddDocumentModal - Modal for adding new documents to a checklist
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onAdd - Callback when document is added
 * @param {Array<string>} props.categories - Available categories
 * @param {boolean} props.showFileUpload - Whether to show file upload option (default: false)
 * @param {Function} props.onFileUpload - Callback for file upload
 * @param {string} props.title - Modal title (default: "Add New Document")
 */
const AddDocumentModal = ({
    open,
    onClose,
    onAdd,
    categories = [],
    showFileUpload = false,
    onFileUpload,
    title = "Add New Document",
}) => {
    const [docName, setDocName] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [fileList, setFileList] = useState([]);

    const handleSubmit = () => {
        if (!docName.trim()) {
            return message.error("Please enter a document name");
        }
        if (!selectedCategory) {
            return message.error("Please select a category");
        }

        const newDoc = {
            name: docName.trim(),
            category: selectedCategory,
            status: "pending",
            comment: "",
            fileUrl: null,
            isNew: true,
        };

        // If file was selected, include it
        if (fileList.length > 0) {
            const file = fileList[0].originFileObj || fileList[0];
            newDoc.file = file;
            newDoc.localPreviewUrl = URL.createObjectURL(file);
        }

        onAdd(newDoc);
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setDocName("");
        setSelectedCategory(null);
        setFileList([]);
    };

    const handleCancel = () => {
        handleReset();
        onClose();
    };

    const uploadProps = {
        beforeUpload: (file) => {
            // Check file type
            const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
            if (!allowedTypes.includes(file.type)) {
                message.error("You can only upload PDF, JPEG, or PNG files!");
                return Upload.LIST_IGNORE;
            }
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                message.error("File must be smaller than 10MB!");
                return Upload.LIST_IGNORE;
            }
            return false; // Prevent auto-upload
        },
        onChange: ({ fileList: newFileList }) => {
            setFileList(newFileList.slice(-1)); // Only keep latest file
        },
        fileList,
        maxCount: 1,
    };

    return (
        <Modal
            title={
                <span style={{ color: THEME.PRIMARY_BLUE, fontWeight: 600 }}>
                    <PlusOutlined style={{ marginRight: 8 }} />
                    {title}
                </span>
            }
            open={open}
            onCancel={handleCancel}
            footer={
                <Space>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        icon={<PlusOutlined />}
                        style={{ backgroundColor: THEME.PRIMARY_BLUE }}
                    >
                        Add Document
                    </Button>
                </Space>
            }
            width={480}
            destroyOnClose
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                {/* Document Name */}
                <div>
                    <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
                        Document Name <span style={{ color: "red" }}>*</span>
                    </label>
                    <Input
                        placeholder="Enter document name"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        maxLength={100}
                    />
                </div>

                {/* Category Selection */}
                <div>
                    <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
                        Category <span style={{ color: "red" }}>*</span>
                    </label>
                    <Select
                        placeholder="Select a category"
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        style={{ width: "100%" }}
                        allowClear
                    >
                        {categories.map((cat) => (
                            <Option key={cat} value={cat}>
                                {cat}
                            </Option>
                        ))}
                        <Option value="Other">Other</Option>
                    </Select>
                </div>

                {/* File Upload (optional) */}
                {showFileUpload && (
                    <div>
                        <label style={{ fontWeight: 500, marginBottom: 4, display: "block" }}>
                            Upload File (Optional)
                        </label>
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                            Max 10MB. Allowed: PDF, JPEG, PNG
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AddDocumentModal;
