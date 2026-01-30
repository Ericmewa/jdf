import React, { useState } from "react";
import { Button, message, Card, Space, Typography, Row, Col } from "antd";
import UserTable from "./UserTable";
import CreateUserDrawer from "./CreateUserModal";
import ReassignModal from "./ReassignModal";
// import StatsCards from "./StatsCards";
// import ActivityLog from "./ActivityLog";
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useToggleActiveMutation,
  useChangeRoleMutation,
  useReassignTasksMutation,
  // useGetAdminStatsQuery,
  // useGetUserLogsQuery,
  // useDeleteUserMutation,
} from "../../api/userApi";


const { Title } = Typography;

const AdminDashboard = () => {
  const { data: users = [], isLoading, refetch } = useGetUsersQuery();
  // const { data: stats = {}, isFetching: statsLoading } =
  //   useGetAdminStatsQuery();
  // const { data: logs = [] } = useGetUserLogsQuery(); // recent logss
  const [createUser] = useCreateUserMutation();
  const [toggleActive] = useToggleActiveMutation();
  const [changeRole] = useChangeRoleMutation();
  const [reassignTasks, { isLoading: isReassigning }] = useReassignTasksMutation();
  // const [deleteUser] = useDeleteUserMutation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer",
  });

  const handleCreateUser = async () => {
    try {
      await createUser(formData).unwrap();
      message.success("User created successfully!");
      setDrawerOpen(false);
      setFormData({ name: "", email: "", password: "", role: "customer" });
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to create user");
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await toggleActive(id).unwrap();
      message.success("User status updated");
      refetch();
    } catch (err) {
      message.error("Failed to update status", err);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await changeRole({ id, role }).unwrap();
      message.success("User role updated");
      refetch();
    } catch (err) {
      message.error("Failed to update role", err);
    }
  };

  const handleReassign = async (userId) => {
    // Find the user and open the reassignment modal
    const user = users.find(u => u._id === userId);
    if (user) {
      setSelectedUser(user);
      setReassignModalOpen(true);
    }
  };

  const handleConfirmReassign = async (fromUserId, toUserId) => {
    try {
      await reassignTasks({ fromUserId, toUserId }).unwrap();
      message.success("Tasks reassigned successfully!");
      refetch();
    } catch (err) {
      message.error(err?.data?.message || "Failed to reassign tasks");
    }
  };

  // const handleDelete = async (id) => {
  //   try {
  //     await deleteUser({ id }).unwrap();
  //     message.success("User deleted (soft) successfully");
  //     refetch();
  //   } catch (err) {
  //     message.error("Failed to delete user");
  //   }
  // };

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 10,
          boxShadow: "0 3px 15px rgba(0,0,0,0.1)",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Title level={3}>Admin Dashboard</Title>
          <Row gutter={16}>
            <Col flex="auto">
              <Button type="primary" onClick={() => setDrawerOpen(true)}>
                Create New User
              </Button>
            </Col>
            <Col>
              <Button
                onClick={() => {
                  refetch();
                  message.success("Refreshed");
                }}
              >
                Refresh
              </Button>
            </Col>
          </Row>

          {/* Stats (cards) */}
          {/* <StatsCards stats={stats} loading={statsLoading} /> */}
        </Space>
      </Card>

      <Card style={{ marginBottom: 24, borderRadius: 10 }}>
        <UserTable
          users={users}
          onToggleActive={handleToggleActive}
          onReassign={handleReassign}
          loading={isLoading}
        />
      </Card>

      {/* <Card style={{ borderRadius: 10 }}>
        <ActivityLog logs={logs} />
      </Card> */}

      <CreateUserDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onCreate={handleCreateUser}
      />

      <ReassignModal
        visible={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        onConfirm={handleConfirmReassign}
        currentUser={selectedUser}
        availableUsers={users}
        loading={isReassigning}
      />
    </div>
  );
};

export default AdminDashboard;