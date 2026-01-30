import React, { useState } from "react";
import { Table, Tag, Empty, Spin } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import ExtensionApplicationModal from "./modals/ExtensionApplicationModal";
import dayjs from "dayjs";

const PRIMARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";
const SECONDARY_PURPLE = "#7e6496";

const ExtensionApplicationsTab = ({ extensions, loading }) => {
    const [extensionModalOpen, setExtensionModalOpen] = useState(false);
    const [selectedExtension, setSelectedExtension] = useState(null);
    const columns = [
        {
            title: "Deferral No",
            dataIndex: "deferralNumber",
            key: "deferralNumber",
            width: 140,
            render: (text) => (
                <div style={{ fontWeight: "bold", color: PRIMARY_BLUE, display: "flex", alignItems: "center", gap: 8 }}>
                    <FileTextOutlined style={{ color: SECONDARY_PURPLE }} />
                    {text}
                </div>
            )
        },
        {
            title: "DCL No",
            dataIndex: "dclNumber",
            key: "dclNumber",
            width: 120,
            render: (text, record) => {
                const value = record.dclNumber || record.dclNo;
                return value ? (
                    <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>{value}</div>
                ) : (
                    <Tag color="warning" style={{ fontWeight: 700 }}>Missing DCL</Tag>
                );
            }
        },
        {
            title: "Customer Name",
            dataIndex: "customerName",
            key: "customerName",
            width: 160,
            render: (text) => (
                <div style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
                    {text}
                </div>
            )
        },
        {
            title: "Loan Type",
            dataIndex: "loanType",
            key: "loanType",
            width: 140,
            render: (text, record) => (
                <div style={{ fontSize: 12, fontWeight: 500, color: PRIMARY_BLUE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {record?.deferral?.loanType || text || "Not Specified"}
                </div>
            )
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            width: 120,
            render: (status) => {
                const s = (status || '').toLowerCase();
                if (s === 'pending_approval') return (<div style={{ fontSize: 11, fontWeight: 'bold', color: WARNING_ORANGE }}>Pending</div>);
                if (s === 'approved') return (<div style={{ fontSize: 11, fontWeight: 'bold', color: SUCCESS_GREEN }}>Approved</div>);
                if (s === 'rejected') return (<div style={{ fontSize: 11, fontWeight: 'bold', color: ERROR_RED }}>Rejected</div>);
                if (s === 'returned_for_rework') return (<div style={{ fontSize: 11, fontWeight: 'bold', color: WARNING_ORANGE }}>Re-work</div>);
                if (s === 'in_review') return (<div style={{ fontSize: 11, fontWeight: 'bold', color: PRIMARY_BLUE }}>In Review</div>);
                return (<div style={{ fontSize: 11, fontWeight: 'bold', color: '#666' }}>{status}</div>);
            }
        },
        {
            title: "Days Sought",
            dataIndex: "requestedDaysSought",
            key: "requestedDaysSought",
            width: 100,
            align: "center",
            render: (days) => (
                <div style={{
                    fontWeight: "bold",
                    color: days > 45 ? ERROR_RED : days > 30 ? WARNING_ORANGE : PRIMARY_BLUE,
                    fontSize: 14,
                    backgroundColor: days > 45 ? "#fff2f0" : days > 30 ? "#fff7e6" : "#f0f7ff",
                    padding: "4px 8px",
                    borderRadius: 4,
                    display: "inline-block"
                }}>
                    {days || 0} days
                </div>
            )
        },
        {
            title: "SLA",
            dataIndex: "slaExpiry",
            key: "slaExpiry",
            width: 100,
            fixed: "right",
            render: (date, record) => {
                const slaDate = record?.deferral?.slaExpiry || date;
                if (!slaDate) {
                    return (
                        <Tag
                            color="#d9d9d9"
                            style={{
                                fontWeight: "bold",
                                fontSize: 11,
                                minWidth: 50,
                                textAlign: "center",
                                color: "#666"
                            }}
                        >
                            N/A
                        </Tag>
                    );
                }

                const daysLeft = dayjs(slaDate).diff(dayjs(), 'days');
                const hoursLeft = dayjs(slaDate).diff(dayjs(), 'hours');

                let color = SUCCESS_GREEN;
                let text = `${daysLeft}d`;

                if (daysLeft <= 0 && hoursLeft <= 0) {
                    color = ERROR_RED;
                    text = 'Expired';
                } else if (daysLeft <= 0) {
                    color = ERROR_RED;
                    text = `${hoursLeft}h`;
                } else if (daysLeft <= 1) {
                    color = ERROR_RED;
                    text = `${daysLeft}d`;
                } else if (daysLeft <= 3) {
                    color = WARNING_ORANGE;
                    text = `${daysLeft}d`;
                }

                return (
                    <Tag
                        color={color}
                        style={{
                            fontWeight: "bold",
                            fontSize: 11,
                            minWidth: 50,
                            textAlign: "center"
                        }}
                    >
                        {text}
                    </Tag>
                );
            }
        }
    ];

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Spin tip="Loading extension applications..." />
            </div>
        );
    }

    if (!extensions || extensions.length === 0) {
        return (
            <Empty
                description="No extension applications yet"
                style={{ padding: "40px 20px" }}
            />
        );
    }

    return (
        <>
            <div className="deferral-pending-table">
                <Table
                    columns={columns}
                    dataSource={extensions}
                    rowKey="_id"
                    size="middle"
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50"],
                        position: ["bottomCenter"],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} extension requests`
                    }}
                    scroll={{ x: 1000 }}
                    onRow={(record) => ({
                        onClick: () => {
                            setSelectedExtension(record);
                            setExtensionModalOpen(true);
                        }
                    })}
                />
            </div>

            <ExtensionApplicationModal
                open={extensionModalOpen}
                onClose={() => {
                    setExtensionModalOpen(false);
                    setSelectedExtension(null);
                }}
                deferral={{
                    ...(selectedExtension?.deferral || {}),
                    deferralNumber: selectedExtension?.deferralNumber,
                    customerName: selectedExtension?.customerName,
                    daysSought: selectedExtension?.currentDaysSought,
                    nextDueDate: selectedExtension?.deferral?.nextDueDate,
                    nextDocumentDueDate: selectedExtension?.deferral?.nextDocumentDueDate
                }}
                extension={selectedExtension}
                onSubmit={() => {}}
                loading={false}
                readOnly
                initialDaysToExtendBy={
                    typeof selectedExtension?.requestedDaysSought === 'number'
                        ? selectedExtension.requestedDaysSought
                        : 30
                }
                initialExtensionReason={selectedExtension?.extensionReason}
                initialAdditionalFiles={selectedExtension?.additionalFiles || selectedExtension?.supportingDocuments || []}
            />
        </>
    );
};

export default ExtensionApplicationsTab;
