import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import CustomerChatWindow from "../Chat/CustomerChatWindow"; // Import component chat
import styles from "../../assets/styles/components/Button/IconAI.module.css";

const IconAI = () => {
    const [isChatOpen, setIsChatOpen] = useState(false); // Trạng thái mở/đóng frame chat
    const navigate = useNavigate(); // Hook để điều hướng

    // Hàm toggle mở/đóng frame chat
    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    // Hàm điều hướng đến trang /chatuser
    const goToChatPage = () => {
        navigate("/chatuser");
    };

    return (
        <div className={styles.container}>
            {/* Button để mở/đóng frame chat */}
            <button className={styles.button} onClick={toggleChat}>
                <div className={styles.icon}>🤖</div>
            </button>

            {/* Frame chat */}
            {isChatOpen && (
                <div className={styles.chatFrame}>
                    <div className={styles.chatHeader}>
                        <span>Chat với AI</span>
                        <div>
                            {/* Button để điều hướng đến trang /chatuser */}
                            <button className={styles.navigateButton} onClick={goToChatPage}>
                                ↗
                            </button>
                            <button className={styles.closeButton} onClick={toggleChat}>
                                ✖
                            </button>
                        </div>
                    </div>
                    <div className={styles.chatContent}>
                        <CustomerChatWindow frameBool={isChatOpen} /> {/* Nhúng trực tiếp component chat */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default IconAI;