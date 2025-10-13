import React from "react";

const getStrength = (password) => {
  let score = 0;
  if (!password) return { label: "", color: "" };
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 0:
      return { label: "Too short", color: "bg-red-400" };
    case 1:
      return { label: "Weak", color: "bg-orange-400" };
    case 2:
      return { label: "Fair", color: "bg-yellow-400" };
    case 3:
      return { label: "Good", color: "bg-blue-400" };
    case 4:
      return { label: "Strong", color: "bg-green-500" };
    default:
      return { label: "", color: "" };
  }
};

const PasswordStrengthIndicator = ({ password }) => {
  const { label, color } = getStrength(password);
  if (!label) return null;
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className={`h-2 w-24 rounded ${color}`}></div>
      <span className="text-xs text-zinc-600">{label}</span>
    </div>
  );
};

export default PasswordStrengthIndicator;
