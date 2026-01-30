// // Resilient socket module used by admin dashboards.
// // Attempts to dynamically load `socket.io-client`. If not available,
// // exports a proxy object with no-op handlers so the app can build.

// const socketProxy = {
//   _socket: null,
//   connected: false,
//   on(event, handler) {
//     if (this._socket && typeof this._socket.on === "function")
//       return this._socket.on(event, handler);
//   },
//   off(event, handler) {
//     if (this._socket && typeof this._socket.off === "function")
//       return this._socket.off(event, handler);
//   },
//   emit(event, ...args) {
//     if (this._socket && typeof this._socket.emit === "function")
//       return this._socket.emit(event, ...args);
//   },
//   connect() {
//     if (this._socket && typeof this._socket.connect === "function")
//       return this._socket.connect();
//   },
//   disconnect() {
//     if (this._socket && typeof this._socket.disconnect === "function")
//       return this._socket.disconnect();
//   },
// };

// // Try to dynamically import socket.io-client. If present, initialize.
// (async () => {
//   try {
//     const mod = await import("socket.io-client");
//     const io = mod.io || mod.default || mod;
//     const SOCKET_URL =
//       import.meta.env.VITE_SOCKET_URL || window.location.origin;
//     const realSocket = io(SOCKET_URL, { autoConnect: true });
//     // Mirror methods onto proxy
//     socketProxy._socket = realSocket;
//     socketProxy.connected = realSocket.connected || false;
//     // update connected flag on connect/disconnect
//     if (realSocket && typeof realSocket.on === "function") {
//       realSocket.on("connect", () => (socketProxy.connected = true));
//       realSocket.on("disconnect", () => (socketProxy.connected = false));
//     }
//   } catch (err) {
//     // socket.io-client not installed or failed to initialize — keep proxy no-ops
//     // This avoids build/runtime crashes; install `socket.io-client` for real-time features.
//     // To enable real socket behavior run: `npm install socket.io-client`
//     // and ensure VITE_SOCKET_URL is set if backend is on a separate host.
//     // console.info("socket.io-client not available, using stub socket.");
//   }
// })();

// export default socketProxy;
// import { io } from "socket.io-client";

// // 🔹 Backend URL
// const SOCKET_URL = "http://localhost:5000";

// // ⚠️ Create socket but DO NOT auto-connect
// export const socket = io(SOCKET_URL, {
//   autoConnect: false,
//   transports: ["websocket", "polling"],
//   reconnection: true,
//   reconnectionAttempts: 5,
//   reconnectionDelay: 1000,
// });

// /* ===========================
//    CONNECTION DEBUG LOGS
// =========================== */
// socket.on("connect", () => {
//   console.log("🟢 WebSocket connected:", socket.id);
// });

// socket.on("disconnect", (reason) => {
//   console.log("🔴 WebSocket disconnected:", reason);
// });

// socket.on("connect_error", (err) => {
//   console.error("⚠️ WebSocket error:", err.message);
// });

// /* ===========================
//    HELPER: EMIT USER ONLINE
//    Call this after login
//    user = { _id, name, email, role }
// =========================== */
// export const emitUserOnline = (user) => {
//   if (!user?._id) return; // ✅ MUST be _id

//   // Ensure socket is connected
//   if (!socket.connected) {
//     socket.connect();
//   }

//   socket.emit("userOnline", {
//     _id: user._id,
//     name: user.name,
//     email: user.email,
//     role: user.role,
//   });
// };
// socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false, // IMPORTANT
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/* ===========================
   DEBUG LOGS
=========================== */
socket.on("connect", () => {
  console.log("🟢 WebSocket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 WebSocket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("⚠️ WebSocket error:", err.message);
});

/* ===========================
   HELPERS
=========================== */
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export const emitUserOnline = (user) => {
  if (!user?._id) return;

  connectSocket();

  socket.emit("userOnline", {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

export default socket;
