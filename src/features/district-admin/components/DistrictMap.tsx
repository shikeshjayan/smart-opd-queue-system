import React from "react";

export interface DistrictMapPinProps {
  hospitalId: string;
  x: number;
  y: number;
  label: string;
}

export const DistrictMapPin: React.FC<DistrictMapPinProps> = ({
  hospitalId,
  x,
  y,
  label,
}) => {
  const onClick = () => {
    const event = new MouseEvent("click", { bubbles: true });
    window.dispatchEvent(event);
  };

  return (
    <g
      transform={`translate(${x},${y})`}
      onClick={onClick}
      className="cursor-pointer"
    >
      <circle r={8} fill="#3b82f6" />
      <text
        x={0}
        y={5}
        textAnchor="middle"
        fontSize="10"
        fill="white"
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
};

export const DistrictMap: React.FC = () => {
  const hospitals = [
    { id: "hos_001", x: 100, y: 100, label: "General Hospital" },
    { id: "hos_002", x: 200, y: 150, label: "Coimbatore Medical" },
    { id: "hos_003", x: 300, y: 100, label: "District Hospital" },
    { id: "hos_004", x: 150, y: 300, label: "Taluk Hospital" },
    { id: "hos_005", x: 250, y: 300, label: "Women & Children" },
    { id: "hos_006", x: 350, y: 150, label: "City Hospital" },
    { id: "hos_007", x: 400, y: 100, label: "Rural Hospital" },
  ];

  return (
    <svg
      width="500"
      height="400"
      viewBox="0 0 500 400"
      className="border rounded p-4"
    >
      <g fill="none" stroke="#64748b" stroke-width={1}>
        <line x1={0} y1={0} x2={500} y2={0} />
        <line x1={0} y1={0} x2={0} y2={400} />
      </g>
      {hospitals.map((h) => (
        <DistrictMapPin
          key={h.id}
          hospitalId={h.id}
          x={h.x}
          y={h.y}
          label={h.label}
        />
      ))}
    </svg>
  );
};