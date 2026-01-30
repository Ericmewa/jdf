import { io } from "socket.io-client";

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(userData = null) {
        if (userData) this.lastUserData = userData;

        if (!this.socket) {
            const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";
            console.log("🔌 Connecting to socket server:", baseURL);
            this.socket = io(baseURL, {
                transports: ["websocket", "polling"],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 20,
            });

            this.socket.on("connect", () => {
                console.log("✅ Socket connected successfully:", this.socket.id);
                // Automatically re-emit online status on (re)connection
                if (this.lastUserData) {
                    this.emitUserOnline(this.lastUserData);
                }
            });

            this.socket.on("connect_error", (error) => {
                console.error("❌ Socket connection error:", error);
            });

            this.socket.on("disconnect", (reason) => {
                console.log("❌ Socket disconnected:", reason);
            });

            this.socket.on("online-users-updated", (data) => {
                console.log("👥 Online users updated:", data.count, "users");
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    emitUserOnline(userData) {
        if (!userData) return;

        // Save for reconnection attempts
        this.lastUserData = userData;

        if (this.socket?.connected) {
            const userPayload = {
                _id: userData.id || userData._id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
            };
            console.log("📤 Emitting user-online:", userPayload);
            this.socket.emit("user-online", userPayload);
        } else {
            console.warn("⚠️ Socket not connected, will emit user-online when connected");
        }
    }

    emitUserActivity(userId) {
        if (this.socket && userId) {
            this.socket.emit("user-activity", userId);
        }
    }

    getSocket() {
        return this.socket;
    }
}

export default new SocketService();
