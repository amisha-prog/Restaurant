import React from "react";

export function ChefLogoIcon({ size = 44, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <defs>
        <linearGradient id="chefBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="hatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F1F5F9" />
        </linearGradient>
      </defs>

      {/* Circular Badge Background */}
      <circle cx="100" cy="100" r="90" fill="url(#chefBgGrad)" stroke="#FFFFFF" strokeWidth="6" />

      {/* --- CHEF TOQUE (HAT) --- */}
      {/* Hat Top Puffs */}
      <path
        d="M60 76C50 68 52 50 68 44C74 32 94 28 106 36C118 28 138 32 144 44C160 50 162 68 152 76C156 86 148 94 140 94H72C64 94 56 86 60 76Z"
        fill="url(#hatGrad)"
        stroke="#CBD5E1"
        strokeWidth="2.5"
      />
      {/* Hat Base Band */}
      <rect x="70" y="90" width="72" height="18" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
      <line x1="78" y1="90" x2="78" y2="108" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="90" y1="90" x2="90" y2="108" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="102" y1="90" x2="102" y2="108" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="114" y1="90" x2="114" y2="108" stroke="#E2E8F0" strokeWidth="2" />
      <line x1="126" y1="90" x2="126" y2="108" stroke="#E2E8F0" strokeWidth="2" />

      {/* --- CHEF FACE & MUSTACHE --- */}
      {/* Face Base */}
      <path d="M78 108C78 108 78 136 100 136C122 136 122 108 122 108H78Z" fill="#FED7AA" />
      {/* Friendly Eyes */}
      <circle cx="89" cy="116" r="2.5" fill="#431407" />
      <circle cx="111" cy="116" r="2.5" fill="#431407" />
      {/* Cheeks */}
      <circle cx="84" cy="120" r="3" fill="#FDBA74" opacity="0.6" />
      <circle cx="116" cy="120" r="3" fill="#FDBA74" opacity="0.6" />
      {/* Mustache */}
      <path
        d="M86 125C90 123 96 125 100 127C104 125 110 123 114 125C118 127 116 130 110 128C104 126 101 130 100 130C99 130 96 126 90 128C84 130 82 127 86 125Z"
        fill="#431407"
      />

      {/* --- CHEF UNIFORM & RED SCARF --- */}
      {/* Red Neckerchief / Scarf */}
      <path d="M86 135L100 148L114 135L124 138L100 156L76 138L86 135Z" fill="#DC2626" />

      {/* White Chef Double-Breasted Coat */}
      <path
        d="M62 142C62 142 78 136 100 136C122 136 138 142 138 142L148 184H52L62 142Z"
        fill="#FFFFFF"
      />
      {/* Double Breasted Coat Buttons */}
      <circle cx="88" cy="154" r="3" fill="#94A3B8" />
      <circle cx="112" cy="154" r="3" fill="#94A3B8" />
      <circle cx="88" cy="168" r="3" fill="#94A3B8" />
      <circle cx="112" cy="168" r="3" fill="#94A3B8" />
      {/* Coat Center Seam */}
      <line x1="100" y1="146" x2="100" y2="184" stroke="#CBD5E1" strokeWidth="2" />
    </svg>
  );
}

export default ChefLogoIcon;
