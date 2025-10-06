import React from "react";

export default function AvatarGenerator({ name = "", size = 40, userId = "" }) {
  // Xác định nguồn khách hàng
  const isFromFacebook = userId?.toString().startsWith("fb:");
  
  // Tạo chữ cái đầu tiên của tên
  const getInitials = () => {
    if (!name || typeof name !== "string") return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return "?";
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Tạo màu dựa trên userId hoặc name
  const getColor = () => {
    const colorPalette = [
      "#FE6B8B", "#FF8E53", "#2196F3", "#00BCD4", "#4CAF50", 
      "#8BC34A", "#CDDC39", "#FFC107", "#FF9800", "#FF5722",
      "#673AB7", "#3F51B5", "#009688", "#795548", "#607D8B"
    ];

    // Hash function đơn giản để lấy màu ổn định
    const stringToHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };

    const seed = userId || name || "default";
    const colorIndex = stringToHash(seed) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    backgroundColor: getColor(),
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: `${size / 2.5}px`,
    position: "relative",
    marginRight: "10px",
  };
  
  const sourceIconStyle = {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    backgroundColor: "white",
    borderRadius: "50%",
    padding: "2px",
    width: `${size / 3}px`,
    height: `${size / 3}px`,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={avatarStyle}>
      {getInitials()}
      
      {/* Icon nguồn khách hàng */}
      <div style={sourceIconStyle}>
        {isFromFacebook ? (
          <svg viewBox="0 0 36 36" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
            <path d="M36 18C36 8.059 27.941 0 18 0S0 8.059 0 18c0 8.984 6.582 16.437 15.188 17.774V23.223h-4.572V18h4.572v-3.968c0-4.516 2.691-7.012 6.813-7.012 1.969 0 4.028.352 4.028.352v4.432h-2.266c-2.235 0-2.93 1.387-2.93 2.809V18h4.988l-.797 5.223h-4.191v12.551C29.418 34.437 36 26.984 36 18z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="#009688" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
          </svg>
        )}
      </div>
    </div>
  );
}