import React, { useEffect, useRef } from "react";
import { Modal } from "antd";
import { useDispatch } from "react-redux";
// import { logout } from "../../redux/slices/authSlice"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

const SessionTimeout = ({ timeoutDuration = 15 * 60 * 1000 }) => {
    // 15 minutes default
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const timeoutRef = useRef(null);

    const resetTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(handleLogout, timeoutDuration);
    };

    const handleLogout = () => {
        Modal.warning({
            title: "Session Expired",
            content: "You have been logged out due to inactivity.",
            onOk: () => {
                // Perform logout logic
                localStorage.removeItem("token");
                localStorage.removeItem("userId");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userName");

                // If you have a redux action: dispatch(logout());
                // For now, manual clear and redirect

                navigate("/login");
                window.location.reload(); // Ensure clean state
            },
        });
    };

    useEffect(() => {
        const events = [
            "load",
            "mousemove",
            "mousedown",
            "click",
            "scroll",
            "keypress",
        ];

        const handleActivity = () => {
            resetTimer();
        };

        // Initial start
        resetTimer();

        // Add listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, []);

    return null; // This component doesn't render anything visible
};

export default SessionTimeout;
