import React, { useState } from "react";
import { Modal, Select, Form, message, Space, Typography, Alert } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Text } = Typography;

const ReassignModal = ({
    visible,
    onClose,
    onConfirm,
    currentUser,
    availableUsers,
    loading
}) => {
    const [form] = Form.useForm();
    const [selectedUserId, setSelectedUserId] = useState(null);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await onConfirm(currentUser._id, values.newUserId);
            form.resetFields();
            setSelectedUserId(null);
            onClose();
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedUserId(null);
        onClose();
    };

    // Filter out the current user and inactive users from available users
    const filteredUsers = availableUsers?.filter(
        (user) => user._id !== currentUser?._id && user.active
    ) || [];

    return (
        <Modal
            title={
                <Space>
                    <UserOutlined />
                    <span>Reassign User Tasks</span>
                </Space>
            }
            open={visible}
            onOk={handleOk}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Reassign"
            okButtonProps={{ danger: true }}
            width={600}
        >
            <div style={{ marginBottom: 16 }}>
                <Alert
                    message="Warning"
                    description={
                        <div>
                            <p>This will reassign all pending tasks from:</p>
                            <Text strong>{currentUser?.name}</Text> ({currentUser?.email})
                            <p style={{ marginTop: 8 }}>
                                Including all deferrals, extensions, and checklists currently assigned to this user.
                            </p>
                        </div>
                    }
                    type="warning"
                    showIcon
                />
            </div>

            <Form form={form} layout="vertical">
                <Form.Item
                    name="newUserId"
                    label="Select New Assignee"
                    rules={[
                        { required: true, message: "Please select a user to reassign tasks to" }
                    ]}
                >
                    <Select
                        placeholder="Select a user"
                        showSearch
                        filterOption={(input, option) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                        }
                        onChange={setSelectedUserId}
                    >
                        {filteredUsers.map((user) => (
                            <Option key={user._id} value={user._id}>
                                {user.name} ({user.email}) - {user.role}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedUserId && (
                    <Alert
                        message="Confirmation"
                        description={
                            <div>
                                All tasks will be transferred to:{" "}
                                <Text strong>
                                    {filteredUsers.find((u) => u._id === selectedUserId)?.name}
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                )}
            </Form>
        </Modal>
    );
};

export default ReassignModal;
