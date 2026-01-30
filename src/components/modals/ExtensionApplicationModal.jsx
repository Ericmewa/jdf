import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Button,
    message,
    Space,
    Descriptions,
    Tag,
    Upload,
    List,
    Typography,
    Card,
    Avatar,
    Badge,
} from "antd";
import { ExclamationCircleOutlined, UploadOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined, DeleteOutlined, EyeOutlined, UserOutlined, CheckCircleOutlined, CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";

const PRIMARY_BLUE = "#164679";
const ERROR_RED = "#ff4d4f";
const ACCENT_LIME = "#b5d334";
const SUCCESS_GREEN = "#52c41a";
const WARNING_ORANGE = "#faad14";

const getFileIcon = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    switch (ext) {
        case 'pdf': return <FilePdfOutlined />;
        case 'doc':
        case 'docx': return <FileWordOutlined />;
        case 'xls':
        case 'xlsx': return <FileExcelOutlined />;
        case 'png':
        case 'jpg':
        case 'jpeg': return <FileImageOutlined />;
        default: return <FilePdfOutlined />;
    }
};

const ExtensionApplicationModal = ({ open, onClose, deferral, onSubmit, loading, readOnly = false, initialDaysToExtendBy, initialExtensionReason, initialAdditionalFiles, extension }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [additionalFiles, setAdditionalFiles] = useState([]);
    const [nextDueDate, setNextDueDate] = useState(null);

    // Calculate next due date when days to extend changes
    const handleDaysChange = (value) => {
        if (value && value > 0 && (deferral?.nextDueDate || deferral?.nextDocumentDueDate)) {
            const currentDueDate = dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate);
            const newDueDate = currentDueDate.add(value, 'days');
            setNextDueDate(newDueDate.format('DD MMM YYYY'));
        } else {
            setNextDueDate(null);
        }
    };

    // Reset when modal closes, initialize when it opens
    useEffect(() => {
        if (!open) {
            setNextDueDate(null);
        } else if (deferral?.nextDueDate || deferral?.nextDocumentDueDate) {
            // Initialize with default 30 days
            const currentDueDate = dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate);
            const initialNextDueDate = currentDueDate.add(30, 'days');
            setNextDueDate(initialNextDueDate.format('DD MMM YYYY'));
        }
    }, [open, deferral]);

    useEffect(() => {
        if (open) {
            const daysValue = typeof initialDaysToExtendBy === 'number' ? initialDaysToExtendBy : 30;
            form.setFieldsValue({
                daysToExtendBy: daysValue,
                extensionReason: initialExtensionReason || ""
            });
            setAdditionalFiles(initialAdditionalFiles || []);
            handleDaysChange(daysValue);
        }
    }, [open, initialDaysToExtendBy, initialExtensionReason, initialAdditionalFiles, form, deferral]);

    const handleSubmit = async (values) => {
        if (readOnly) {
            return;
        }
        setSubmitting(true);
        try {
            // Add additional files to the submission
            const submissionData = {
                ...values,
                additionalFiles: additionalFiles,
            };
            await onSubmit(submissionData);
            
            // Show success notification
            message.success({
                content: 'Extension Request Submitted Successfully',
                duration: 3,
            });
            
            // Close modal and reset form
            form.resetFields();
            setAdditionalFiles([]);
            onClose();
        } catch (error) {
            console.error("Error submitting extension:", error);
            message.error('Failed to submit extension request');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileUpload = (file) => {
        setAdditionalFiles([...additionalFiles, file]);
        return false; // Prevent auto-upload
    };

    const handleRemoveFile = (index) => {
        const newFiles = additionalFiles.filter((_, i) => i !== index);
        setAdditionalFiles(newFiles);
    };

    return (
        <>
            <style>{`
                .extension-modal-header .ant-modal-title {
                    color: white !important;
                    font-size: 18px !important;
                    font-weight: 600 !important;
                }
                .extension-modal-header .ant-modal-close-x {
                    color: white !important;
                }
            `}</style>
            <Modal
                title="Extension Application"
                open={open}
                onCancel={() => {
                    form.resetFields();
                    setAdditionalFiles([]);
                    onClose();
                }}
                footer={null}
                width={700}
                zIndex={1001}
                styles={{
                    header: { 
                        backgroundColor: PRIMARY_BLUE,
                        padding: "24px 24px",
                        borderRadius: "8px 8px 0 0"
                    }
                }}
                classNames={{
                    header: "extension-modal-header"
                }}
            >
            <div style={{ marginBottom: 24 }}>
                {/* Deferral Details */}
                <Descriptions size="small" bordered style={{ marginBottom: 20 }}>
                    <Descriptions.Item label="Deferral Number" span={3}>
                        <strong>{deferral?.deferralNumber}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer" span={3}>
                        {deferral?.customerName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Days Sought" span={3}>
                        <Tag color="blue">{deferral?.daysSought || 0} days</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Due Date" span={3}>
                        <strong>{(deferral?.nextDueDate || deferral?.nextDocumentDueDate) ? dayjs(deferral.nextDueDate || deferral.nextDocumentDueDate).format('DD MMM YYYY') : 'N/A'}</strong>
                    </Descriptions.Item>
                </Descriptions>

                {/* Approval Flow Section */}
                <Card size="small" title={<span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Approval Flow</span>} style={{ marginBottom: 20 }}>
                    {(function renderApprovalFlow() {
                        // Get approvers from extension or deferral
                        const approversData = extension?.approvers || deferral?.approvers || deferral?.approverFlow || [];
                        
                        if (!approversData || approversData.length === 0) {
                            return (
                                <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>
                                    <UserOutlined style={{ fontSize: 24, marginBottom: 8, color: '#d9d9d9' }} />
                                    <div>No approvers specified</div>
                                </div>
                            );
                        }

                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {approversData.map((approver, index) => {
                                    const approverName = typeof approver === 'object' ?
                                        (approver.name || approver.user?.name || approver.userId?.name || approver.email || approver.role || String(approver)) :
                                        approver;

                                    const isApproved = approver.approvalStatus === 'approved' || approver.approved === true || approver.approved === 'true';
                                    const isRejected = approver.approvalStatus === 'rejected' || approver.rejected === true;
                                    const isCurrent = approver.isCurrent === true || (index === extension?.currentApproverIndex && !isApproved && !isRejected);

                                    return (
                                        <div key={index} style={{
                                            padding: '14px 16px',
                                            backgroundColor: isApproved ? '#f6ffed' :
                                                isRejected ? `${ERROR_RED}10` :
                                                    isCurrent ? '#e6f7ff' : '#fafafa',
                                            borderRadius: 8,
                                            border: isApproved ? `2px solid ${SUCCESS_GREEN}` :
                                                isRejected ? `2px solid ${ERROR_RED}` :
                                                    isCurrent ? `2px solid ${PRIMARY_BLUE}` : '1px solid #e8e8e8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14
                                        }}>
                                            <Badge count={index + 1} style={{
                                                backgroundColor: isApproved ? SUCCESS_GREEN :
                                                    isRejected ? ERROR_RED :
                                                        isCurrent ? PRIMARY_BLUE : '#bfbfbf',
                                                fontSize: 13,
                                                height: 30,
                                                minWidth: 30,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                                borderRadius: '50%'
                                            }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                    <Typography.Text strong style={{ fontSize: 14, color: '#262626' }}>
                                                        {approver.role || 'Approver'}
                                                    </Typography.Text>
                                                    {isApproved && (
                                                        <Tag
                                                            icon={<CheckCircleOutlined />}
                                                            color="success"
                                                            style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4, fontWeight: 500 }}
                                                        >
                                                            Approved
                                                        </Tag>
                                                    )}
                                                    {isCurrent && !isApproved && !isRejected && (
                                                        <Tag color="processing" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4 }}>
                                                            Current
                                                        </Tag>
                                                    )}
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Avatar
                                                        size={24}
                                                        icon={<UserOutlined />}
                                                        style={{
                                                            backgroundColor: isApproved ? SUCCESS_GREEN :
                                                                isCurrent ? PRIMARY_BLUE : '#8c8c8c'
                                                        }}
                                                    />
                                                    <Typography.Text style={{ fontSize: 14, color: '#595959' }}>
                                                        {approverName}
                                                    </Typography.Text>
                                                </div>

                                                {isApproved && (approver.approvalDate || approver.approvedAt) && (
                                                    <div style={{ fontSize: 12, color: SUCCESS_GREEN, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <CalendarOutlined style={{ fontSize: 11 }} />
                                                        Approved: {dayjs(approver.approvalDate || approver.approvedAt).format('DD MMM YYYY HH:mm')}
                                                    </div>
                                                )}

                                                {isCurrent && !isApproved && !isRejected && (
                                                    <div style={{ fontSize: 12, color: PRIMARY_BLUE, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <ClockCircleOutlined style={{ fontSize: 11 }} />
                                                        Pending Approval
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </Card>

                {/* Creator Approval Status */}
                {extension && extension.allApproversApproved && (
                    <Card size="small" title={<span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Creator Approval</span>} style={{ marginBottom: 20 }}>
                        <div style={{
                            padding: '14px 16px',
                            backgroundColor: extension.creatorApprovalStatus === 'approved' ? '#f6ffed' :
                                extension.creatorApprovalStatus === 'rejected' ? `${ERROR_RED}10` : '#fafafa',
                            borderRadius: 8,
                            border: extension.creatorApprovalStatus === 'approved' ? `2px solid ${SUCCESS_GREEN}` :
                                extension.creatorApprovalStatus === 'rejected' ? `2px solid ${ERROR_RED}` : '1px solid #e8e8e8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14
                        }}>
                            <Avatar
                                size={32}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: extension.creatorApprovalStatus === 'approved' ? SUCCESS_GREEN :
                                        extension.creatorApprovalStatus === 'rejected' ? ERROR_RED : '#8c8c8c'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Typography.Text strong style={{ fontSize: 14, color: '#262626' }}>
                                        Creator (CO)
                                    </Typography.Text>
                                    {extension.creatorApprovalStatus === 'approved' && (
                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4, fontWeight: 500 }}>
                                            Approved
                                        </Tag>
                                    )}
                                    {extension.creatorApprovalStatus === 'pending' && (
                                        <Tag color="processing" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4 }}>
                                            Pending
                                        </Tag>
                                    )}
                                    {extension.creatorApprovalStatus === 'rejected' && (
                                        <Tag color="error" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4 }}>
                                            Rejected
                                        </Tag>
                                    )}
                                </div>
                                {extension.creatorApprovalDate && (
                                    <div style={{ fontSize: 12, color: SUCCESS_GREEN, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CalendarOutlined style={{ fontSize: 11 }} />
                                        {dayjs(extension.creatorApprovalDate).format('DD MMM YYYY HH:mm')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Checker Approval Status */}
                {extension && extension.creatorApprovalStatus === 'approved' && (
                    <Card size="small" title={<span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>Checker Approval</span>} style={{ marginBottom: 20 }}>
                        <div style={{
                            padding: '14px 16px',
                            backgroundColor: extension.checkerApprovalStatus === 'approved' ? '#f6ffed' :
                                extension.checkerApprovalStatus === 'rejected' ? `${ERROR_RED}10` : '#fafafa',
                            borderRadius: 8,
                            border: extension.checkerApprovalStatus === 'approved' ? `2px solid ${SUCCESS_GREEN}` :
                                extension.checkerApprovalStatus === 'rejected' ? `2px solid ${ERROR_RED}` : '1px solid #e8e8e8',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14
                        }}>
                            <Avatar
                                size={32}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: extension.checkerApprovalStatus === 'approved' ? SUCCESS_GREEN :
                                        extension.checkerApprovalStatus === 'rejected' ? ERROR_RED : '#8c8c8c'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <Typography.Text strong style={{ fontSize: 14, color: '#262626' }}>
                                        Checker (CO Checker)
                                    </Typography.Text>
                                    {extension.checkerApprovalStatus === 'approved' && (
                                        <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4, fontWeight: 500 }}>
                                            Approved
                                        </Tag>
                                    )}
                                    {extension.checkerApprovalStatus === 'pending' && (
                                        <Tag color="processing" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4 }}>
                                            Pending
                                        </Tag>
                                    )}
                                    {extension.checkerApprovalStatus === 'rejected' && (
                                        <Tag color="error" style={{ fontSize: 11, padding: '2px 10px', borderRadius: 4 }}>
                                            Rejected
                                        </Tag>
                                    )}
                                </div>
                                {extension.checkerApprovalDate && (
                                    <div style={{ fontSize: 12, color: SUCCESS_GREEN, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CalendarOutlined style={{ fontSize: 11 }} />
                                        {dayjs(extension.checkerApprovalDate).format('DD MMM YYYY HH:mm')}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                )}

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        daysToExtendBy: typeof initialDaysToExtendBy === 'number' ? initialDaysToExtendBy : 30,
                        extensionReason: "",
                    }}
                >
                    {/* Days to Extend By */}
                    <Form.Item
                        label="Days to Extend By"
                        name="daysToExtendBy"
                        rules={[
                            { required: true, message: "Please enter number of days" },
                            {
                                validator: (_, value) => {
                                    if (!value) return Promise.resolve();
                                    if (value <= 0) {
                                        return Promise.reject(new Error("Must be greater than 0"));
                                    }
                                    if (value > 90) {
                                        return Promise.reject(new Error("Cannot extend by more than 90 days"));
                                    }
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={90}
                            style={{ width: "100%" }}
                            placeholder="Enter number of days (e.g., 30)"
                            onChange={handleDaysChange}
                            disabled={readOnly}
                        />
                    </Form.Item>

                    {/* Calculated Next Due Date */}
                    {nextDueDate && (
                        <div style={{ 
                            marginTop: -8,
                            marginBottom: 16, 
                            padding: 14, 
                            backgroundColor: 'transparent', 
                            borderRadius: 6, 
                            border: `2px solid ${PRIMARY_BLUE}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Typography.Text style={{ fontSize: 14, color: 'black' }}>
                                <strong>Next Due Date (After Extension):</strong>
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}>
                                {nextDueDate}
                            </Typography.Text>
                        </div>
                    )}
                    {/* Extension Reason/Comment */}
                    <Form.Item
                        label="Reason for Extension"
                        name="extensionReason"
                        rules={[
                            { required: true, message: "Please provide a reason" },
                            { min: 10, message: "Reason must be at least 10 characters" },
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Explain why this extension is needed..."
                            maxLength={500}
                            showCount
                            disabled={readOnly}
                        />
                    </Form.Item>

                    {/* Additional Supporting Documents */}
                    <Form.Item
                        label="Additional Supporting Documents"
                    >
                        {!readOnly && (
                            <Upload
                                accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                beforeUpload={handleFileUpload}
                                fileList={[]}
                                multiple
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Upload Documents
                                </Button>
                            </Upload>
                        )}

                        {additionalFiles.length > 0 && (
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 }}>
                                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                                    Attached Documents ({additionalFiles.length})
                                </Typography.Text>
                                <List
                                    size="small"
                                    dataSource={additionalFiles}
                                    renderItem={(file, index) => (
                                        <List.Item
                                            key={index}
                                            actions={[
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EyeOutlined />}
                                                    onClick={() => {
                                                        const url = file?.url || URL.createObjectURL(file);
                                                        window.open(url, '_blank');
                                                    }}
                                                    title="View"
                                                />,
                                                !readOnly && (
                                                    <Button
                                                        type="text"
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveFile(index)}
                                                        title="Remove"
                                                    />
                                                )
                                            ].filter(Boolean)}
                                        >
                                            <List.Item.Meta
                                                avatar={getFileIcon(file.name)}
                                                title={file.name}
                                                description={file?.size ? `${(file.size / 1024).toFixed(2)} KB` : ''}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        )}
                    </Form.Item>

                    {/* Buttons */}
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>{readOnly ? "Close" : "Cancel"}</Button>
                        {!readOnly && (
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting || loading}
                                style={{ backgroundColor: PRIMARY_BLUE }}
                            >
                                Submit Extension Request
                            </Button>
                        )}
                    </Space>
                </Form>
            </div>
            </Modal>
        </>
    );
};

export default ExtensionApplicationModal;

