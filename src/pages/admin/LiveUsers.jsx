import React, { useEffect } from "react";
import { Card, Table, Tag, Space, Typography, Button, Badge, Tooltip } from "antd";
import {
    ReloadOutlined,
    UserOutlined,
    ClockCircleOutlined,
    WifiOutlined,
} from "@ant-design/icons";
import { useGetOnlineUsersQuery } from "../../api/userApi";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const LiveUsers = () => {
    const { data, isLoading, refetch } = useGetOnlineUsersQuery(undefined, {
        pollingInterval: 10000, // Refresh every 10 seconds
    });

    const onlineUsers = data?.users || [];
    const onlineCount = data?.count || 0;

    useEffect(() => {
        // Auto-refresh on mount
        refetch();
    }, [refetch]);

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

    const columns = [
        {
            title: <Space><UserOutlined /> Name</Space>,
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name) => (
                <Space>
                    <Badge status="success" />
                    <Text strong>{name}</Text>
                </Space>
            ),
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            render: (email) => <Text type="secondary">{email}</Text>,
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            filters: [
                { text: "Admin", value: "admin" },
                { text: "CO Creator", value: "cocreator" },
                { text: "CO Checker", value: "cochecker" },
                { text: "Customer", value: "customer" },
                { text: "RM", value: "rm" },
            ],
            onFilter: (value, record) => record.role === value,
            render: (role) => (
                <Tag color={getRoleColor(role)} className="capitalize">
                    {role}
                </Tag>
            ),
        },
        {
            title: <Space><ClockCircleOutlined /> Login Time</Space>,
            dataIndex: "loginTime",
            key: "loginTime",
            sorter: (a, b) => new Date(a.loginTime) - new Date(b.loginTime),
            render: (loginTime) => (
                <Tooltip title={dayjs(loginTime).format("YYYY-MM-DD HH:mm:ss")}>
                    <Text>{dayjs(loginTime).fromNow()}</Text>
                </Tooltip>
            ),
        },
        {
            title: "Last Activity",
            dataIndex: "lastSeen",
            key: "lastSeen",
            sorter: (a, b) => new Date(a.lastSeen) - new Date(b.lastSeen),
            render: (lastSeen) => (
                <Tooltip title={dayjs(lastSeen).format("YYYY-MM-DD HH:mm:ss")}>
                    <Text type="secondary">{dayjs(lastSeen).fromNow()}</Text>
                </Tooltip>
            ),
        },
        {
            title: "Status",
            key: "status",
            render: () => (
                <Tag icon={<WifiOutlined />} color="success">
                    Online
                </Tag>
            ),
        },
        {
            title: "Active Sessions",
            dataIndex: "socketCount",
            key: "socketCount",
            render: (count) => (
                <Badge
                    count={count}
                    showZero
                    style={{ backgroundColor: "#52c41a" }}
                />
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
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Title level={3} style={{ margin: 0 }}>
                                Live Users
                            </Title>
                            <Text type="secondary">
                                Real-time monitoring of online users in the system
                            </Text>
                        </Space>

                        <Space>
                            <Badge count={onlineCount} showZero style={{ backgroundColor: "#52c41a" }}>
                                <Button
                                    type="primary"
                                    icon={<ReloadOutlined />}
                                    onClick={() => refetch()}
                                    loading={isLoading}
                                >
                                    Refresh
                                </Button>
                            </Badge>
                        </Space>
                    </div>

                    <Card
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            border: "none",
                        }}
                    >
                        <Space size="large">
                            <div style={{ textAlign: "center" }}>
                                <Text style={{ color: "white", fontSize: 36, fontWeight: "bold" }}>
                                    {onlineCount}
                                </Text>
                                <br />
                                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                                    Users Online
                                </Text>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <Text style={{ color: "white", fontSize: 24 }}>
                                    🟢
                                </Text>
                                <br />
                                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                                    Active Now
                                </Text>
                            </div>
                        </Space>
                    </Card>

                    <Table
                        columns={columns}
                        dataSource={onlineUsers}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} online users`,
                        }}
                        bordered
                        style={{ marginTop: 16 }}
                    />
                </Space>
            </Card>
        </div>
    );
};

export default LiveUsers;