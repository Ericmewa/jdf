// export default CommentHistory;
import React from "react";
import { Avatar, Tag, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";

const getRoleTag = (role) => {
  switch ((role || "").toLowerCase()) {
    case "rm":
      return <Tag color="blue">RM</Tag>;
    case "cochecker":
      return <Tag color="green">CO</Tag>;
    case "cocreator":
      return <Tag color="purple">CREATOR</Tag>;
    case "system":
      return <Tag color="default">SYSTEM</Tag>;
    default:
      return <Tag>{role || "UNKNOWN"}</Tag>;
  }
};

const CommentHistory = ({ comments, isLoading }) => {
  if (isLoading) {
    return (
      <div style={{ padding: 12, display: "flex", justifyContent: "center" }}>
        <Spin size="small" />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div style={{ padding: 8, fontSize: 12, color: "#9ca3af" }}>
        No comments yet.
      </div>
    );
  }

  return (
    <div
      style={{
        maxHeight: "220px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "6px 4px",
      }}
    >
      {comments.map((item, index) => (
        <div
          key={item._id || index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#374151",
            padding: "4px 6px",
            borderRadius: "6px",
            background: "#f9fafb",
            whiteSpace: "nowrap",
          }}
        >
          {/* Avatar */}
          <Avatar
            size={18}
            icon={<UserOutlined />}
            style={{ backgroundColor: "#164679", flexShrink: 0 }}
          />

          {/* Name */}
          <span style={{ fontWeight: 600 }}>
            {item.userId?.name || item.user || "System"}
          </span>

          {/* Role */}
          {getRoleTag(item.userId?.role || item.role || "system")}

          {/* Comment */}
          <span
            style={{
              color: "#4b5563",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
            title={item.message || item.comment}
          >
            {item.message || item.comment}
          </span>

          {/* Time */}
          <span style={{ fontSize: "10px", color: "#9ca3af", flexShrink: 0 }}>
            {new Date(item.createdAt || item.timestamp).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CommentHistory;
