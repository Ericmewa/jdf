import { Badge, Drawer, List, Tag, Button } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useState } from "react";
import dayjs from "dayjs";

const getTag = (type) => {
  switch (type) {
    case "ACTION_REQUIRED":
      return <Tag color="red">Action Required</Tag>;
    case "IN_PROGRESS":
      return <Tag color="orange">In Progress</Tag>;
    case "APPROVED":
      return <Tag color="green">Completed</Tag>;
    default:
      return <Tag color="blue">Info</Tag>;
  }
};

const NotificationBell = ({ notifications = [], onOpenChecklist }) => {
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Badge count={unreadCount} offset={[ -2, 2 ]}>
        <BellOutlined
          style={{ fontSize: 20, cursor: "pointer" }}
          onClick={() => setOpen(true)}
        />
      </Badge>

      <Drawer
        title="Notifications"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={420}
      >
        <List
          dataSource={notifications}
          itemLayout="vertical"
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  size="small"
                  type="link"
                  onClick={() => onOpenChecklist(item.checklistId)}
                >
                  View Checklist
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{item.title}</span>
                    {getTag(item.type)}
                  </div>
                }
                description={
                  <>
                    <div>{item.message}</div>
                    <small style={{ color: "#888" }}>
                      {dayjs(item.createdAt).fromNow()}
                    </small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
};

export default NotificationBell;
