import React from "react";

export function WaiterLogoIcon({ size = 44, className = "" }) {
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        maxWidth: `${size}px`,
        minHeight: `${size}px`,
        maxHeight: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0b192c",
        boxShadow: "0 2px 8px rgba(0, 82, 204, 0.3)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      <img
        src="/waiter_logo.png"
        alt="Waiter Logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scale(1.18)",
          display: "block",
        }}
      />
    </div>
  );
}

export default WaiterLogoIcon;

