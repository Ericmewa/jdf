import React, { useState } from "react";
import {
    Card,
    Table,
    Tag,
    Space,
    Typography,
    Button,
    Badge,
    Statistic,
    Row,
    Col,
    Select,
    message,
} from "antd";
import {
    DownloadOutlined,
    UserOutlined,
    FileTextOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { useGetUsersQuery } from "../../api/userApi";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const AuditLogsPage = () => {
    const { data: users = [], isLoading, refetch } = useGetUsersQuery();
    const [selectedRole, setSelectedRole] = useState("all");

    // Count users by role
    const usersByRole = {
        all: users.length,
        admin: users.filter((u) => u.role === "admin").length,
        cocreator: users.filter((u) => u.role === "cocreator").length,
        cochecker: users.filter((u) => u.role === "cochecker").length,
        customer: users.filter((u) => u.role === "customer").length,
        rm: users.filter((u) => u.role === "rm").length,
    };

    // Filter users by selected role
    const filteredUsers =
        selectedRole === "all"
            ? users
            : users.filter((u) => u.role === selectedRole);

    const getRoleColor = (role) => {
        const colors = {
            admin: "red",
            cocreator: "green",
            cochecker: "purple",
            customer: "blue",
            rm: "orange",
        };
        return colors[role] || "default";
    };

    const generateUserActivityPDF = async (user) => {
        try {
            console.log("📄 Starting PDF generation for user:", user.name);
            message.loading({ content: "Generating PDF...", key: "pdf" });

            // Fetch real activity data from API
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const token = storedUser?.token;

            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

            const response = await axios.get(`${baseURL}/api/users/${user._id}/activity`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const userActivities = response.data.activities || [];
            console.log("📊 Fetched activities:", userActivities.length);

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header
            doc.setFillColor(43, 28, 103);
            doc.rect(0, 0, pageWidth, 40, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text("User Activity Report", pageWidth / 2, 20, { align: "center" });

            doc.setFontSize(10);
            doc.text(`Generated: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`, pageWidth / 2, 30, {
                align: "center",
            });

            // User Information
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text("User Information", 14, 55);

            const userInfo = [
                ["Name", user.name || "N/A"],
                ["Email", user.email || "N/A"],
                ["Role", (user.role || "").toUpperCase()],
                ["Status", user.active ? "Active" : "Inactive"],
                ["Customer Number", user.customerNumber || "N/A"],
                ["RM ID", user.rmId || "N/A"],
                ["Account Created", user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss") : "N/A"],
                ["Last Updated", user.updatedAt ? dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "N/A"],
            ];

            autoTable(doc, {
                startY: 60,
                head: [["Field", "Value"]],
                body: userInfo,
                theme: "striped",
                headStyles: { fillColor: [43, 28, 103] },
            });

            // Activity Log Section
            let finalY = doc.lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.text(`Recent Activity (${userActivities.length} records)`, 14, finalY);

            if (userActivities.length > 0) {
                // Use real activity data
                const activityData = userActivities.slice(0, 50).map(activity => [
                    dayjs(activity.date).format("YYYY-MM-DD HH:mm:ss"),
                    activity.action.replace(/_/g, ' '),
                    activity.details || "No details available",
                    activity.status || "Success"
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [["Date", "Action", "Details", "Status"]],
                    body: activityData,
                    theme: "grid",
                    headStyles: { fillColor: [43, 28, 103] },
                    styles: { fontSize: 8 },
                    columnStyles: {
                        0: { cellWidth: 40 },
                        1: { cellWidth: 35 },
                        2: { cellWidth: 80 },
                        3: { cellWidth: 25 }
                    }
                });
            } else {
                // No activity found
                doc.setFontSize(10);
                doc.setTextColor(128, 128, 128);
                doc.text("No activity records found for this user.", 14, finalY + 10);
            }

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Page ${i} of ${pageCount}`,
                    pageWidth / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: "center" }
                );
            }

            // Save PDF
            const filename = `${user.name.replace(/[^a-z0-9]/gi, '_')}_Activity_Report_${dayjs().format("YYYY-MM-DD")}.pdf`;
            console.log("💾 Saving PDF as:", filename);
            doc.save(filename);

            console.log("✅ PDF generated successfully");
            message.success({ content: "PDF downloaded successfully!", key: "pdf", duration: 3 });
        } catch (error) {
            console.error("❌ Error generating PDF:", error);
            message.error({ content: `Failed to generate PDF: ${error.message}`, key: "pdf", duration: 5 });
        }
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, record) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div>
                            <Text strong>{name}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.email}
                            </Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={getRoleColor(role)} className="capitalize">
                    {role}
                </Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "active",
            key: "active",
            render: (active) => (
                <Tag color={active ? "success" : "default"}>
                    {active ? "Active" : "Inactive"}
                </Tag>
            ),
        },
        {
            title: "Customer No.",
            dataIndex: "customerNumber",
            key: "customerNumber",
            render: (num) => <Text>{num || "—"}</Text>,
        },
        {
            title: "Joined",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => dayjs(date).format("YYYY-MM-DD"),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => generateUserActivityPDF(record)}
                    size="small"
                >
                    Download Activity
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                style={{
                    borderRadius: 10,
                    boxShadow: "0 3px 15px rgba(0,0,0,0.1)",
                }}
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Title level={3} style={{ margin: 0 }}>
                                <FileTextOutlined /> Audit Logs
                            </Title>
                            <Text type="secondary">
                                User activity tracking and report generation
                            </Text>
                        </Space>

                        <Space>
                            <Select
                                value={selectedRole}
                                onChange={setSelectedRole}
                                style={{ width: 150 }}
                            >
                                <Option value="all">All Roles ({usersByRole.all})</Option>
                                <Option value="admin">Admin ({usersByRole.admin})</Option>
                                <Option value="cocreator">CO Creator ({usersByRole.cocreator})</Option>
                                <Option value="cochecker">CO Checker ({usersByRole.cochecker})</Option>
                                <Option value="customer">Customer ({usersByRole.customer})</Option>
                                <Option value="rm">RM ({usersByRole.rm})</Option>
                            </Select>

                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isLoading}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </div>

                    {/* Statistics Cards */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Total Users"
                                    value={usersByRole.all}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: "#3f8600" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Admins"
                                    value={usersByRole.admin}
                                    valueStyle={{ color: "#cf1322" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="CO Creators"
                                    value={usersByRole.cocreator}
                                    valueStyle={{ color: "#52c41a" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="CO Checkers"
                                    value={usersByRole.cochecker}
                                    valueStyle={{ color: "#722ed1" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Customers"
                                    value={usersByRole.customer}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="RMs"
                                    value={usersByRole.rm}
                                    valueStyle={{ color: "#fa8c16" }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Users Table */}
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} users`,
                        }}
                        bordered
                    />
                </Space>
            </Card>
        </div>
    );
};

export default AuditLogsPage;