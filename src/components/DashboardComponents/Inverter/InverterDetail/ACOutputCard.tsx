// ACOutputCard.tsx

import React, { useEffect, useState, useRef } from "react";
import { useColorMode } from "@chakra-ui/react";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";

interface Props {
  deviceId?: string;
}

const ACOutputCard = ({ deviceId }: Props) => {
  const { colorMode } = useColorMode();
  const { data, fetchData } = useTimeseriesData();

  const isDark = colorMode === "dark";
  const textColor = isDark ? "#dbeafe" : "#0f172a";
  const subText = isDark ? "#cbd5e1" : "#475569";

  const green = "#84cc16";
  const red = "#ef4444";
  const orange = "#f97316";
  const purple = "#f0abfc";

  /* ================= API HIT ================= */
  useEffect(() => {
    if (!deviceId) return;

    const fetchMPPTData = () => {
      fetchData({
        devices: {
          patterns: [],
          ids: [deviceId],
        },

        keys: [
          ...Array.from({ length: 12 }, (_, i) => ({
            key: `mppt_${i + 1}_current`,
            alias: `mppt_${i + 1}_current`,
            keyType: "common",
          })),

          ...Array.from({ length: 12 }, (_, i) => ({
            key: `mppt_${i + 1}_voltage`,
            alias: `mppt_${i + 1}_voltage`,
            keyType: "common",
          })),

          // AC measurements
          {
            key: "volt_ab",
            alias: "ac_voltage_ry",
            keyType: "common",
          },
          {
            key: "volt_bc",
            alias: "ac_voltage_yb",
            keyType: "common",
          },
          {
            key: "volt_ca",
            alias: "ac_voltage_br",
            keyType: "common",
          },

          {
            key: "phase_a_current",
            alias: "ac_current_r",
            keyType: "common",
          },
          {
            key: "phase_b_current",
            alias: "ac_current_y",
            keyType: "common",
          },
          {
            key: "phase_c_current",
            alias: "ac_current_b",
            keyType: "common",
          },

          {
            key: "frequency",
            alias: "frequency",
            keyType: "common",
          },

          {
            key: "power_factor",
            alias: "power_factor",
            keyType: "common",
          },
        ],

        aggregation: {
          func: "last",
          interval: 1,
          intervalType: "minute",
        },

        timeRange: {
          type: "relative",
          relativeType: "currentDaySoFar",
        },

        orderBy: "ASC",
      } as any);
    };

    fetchMPPTData();
    const interval = setInterval(fetchMPPTData, 60000);
    return () => clearInterval(interval);
  }, [deviceId]);

  /* ================= MPPT STATUS ================= */
  const getMPPTColor = (index: number) => {
    const key = `mppt_${index}_current`;
    const deviceKey = Object.keys(data || {})[0];

    const value = Number(
      data?.[deviceKey]?.[key]?.[data?.[deviceKey]?.[key]?.length - 1]?.value || 0
    );

    return value > 0 ? green : red;
  };

  const getMPPTVoltage = (index: number) => {
    const key = `mppt_${index}_voltage`;
    const deviceKey = Object.keys(data || {})[0];

    const value = Number(
      data?.[deviceKey]?.[key]?.[data?.[deviceKey]?.[key]?.length - 1]?.value || 0
    );

    return value.toFixed(1);
  };

  // Controlled dragging for LOAD BRANCH and two vertical lines
  const [branchPos, setBranchPos] = useState({ x: 225, y: 72 });
  const [vLine1Pos, setVLine1Pos] = useState({ x: 263, y: 26 });
  const [vLine2Pos] = useState({ x: 265, y: 130 });
  // Group position for left panel (fixed)
  const [groupPos] = useState({ x: 51, y: 23 });

  const currentDragTargetRef = useRef<string | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const onPointerMove = (clientX: number, clientY: number) => {
    const target = currentDragTargetRef.current;
    if (!target) return;

    const localX = clientX - groupPos.x;
    const localY = clientY - groupPos.y;

    if (target === "v1") {
      setVLine1Pos({
        x: localX - offsetRef.current.x,
        y: localY - offsetRef.current.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX, e.clientY);
  const handleTouchMove = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) onPointerMove(t.clientX, t.clientY);
  };

  const stopDrag = () => {
    const prev = currentDragTargetRef.current;
    if (prev === "branch") console.log("LOAD BRANCH POSITION =>", { x: branchPos.x, y: branchPos.y });
    if (prev === "v1") console.log("VLINE1 POSITION =>", { x: vLine1Pos.x, y: vLine1Pos.y });
    if (prev === "v2") console.log("VLINE2 POSITION =>", { x: vLine2Pos.x, y: vLine2Pos.y });
    if (prev === "group") console.log("LEFT GROUP POSITION =>", { x: groupPos.x, y: groupPos.y });

    currentDragTargetRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", stopDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", stopDrag);
    };
  }, [branchPos, vLine1Pos, vLine2Pos]);

  const deviceKey = Object.keys(data || {})[0];

  const getValue = (key: string, unit = "") => {
    const value =
      data?.[deviceKey]?.[key]?.[
        data?.[deviceKey]?.[key]?.length - 1
      ]?.value;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "---";
    }

    const numericValue = Number(value);

    return `${Number.isFinite(numericValue) ? numericValue.toFixed(2) : value} ${unit}`.trim();
  };

  const rightSectionData = [
    ["AC Voltage (R-Y)", getValue("ac_voltage_ry", "V")],
    ["AC Voltage (Y-B)", getValue("ac_voltage_yb", "V")],
    ["AC Voltage (B-R)", getValue("ac_voltage_br", "V")],

    ["AC Current (R)", getValue("ac_current_r", "A")],
    ["AC Current (Y)", getValue("ac_current_y", "A")],
    ["AC Current (B)", getValue("ac_current_b", "A")],

    ["Frequency", getValue("frequency", "Hz")],
    ["Power Factor", getValue("power_factor")],
  ];

  return (
    <>
      <div
        style={{
          background: isDark
            ? "linear-gradient(135deg,#0a2744 0%, #081f37 45%, #06172d 100%)"
            : "linear-gradient(135deg,#ffffff 0%, #f7fafc 50%, #edf4fb 100%)",
          border: isDark ? "1px solid #16395c" : "1px solid #dbe7f3",
          borderRadius: "10px",
          padding: "16px",
          height: "100%",
          overflow: "hidden",
          boxShadow: isDark
            ? "inset 0 0 35px rgba(0,0,0,0.18)"
            : "0 2px 10px rgba(15,23,42,0.05)",
        }}
      >
        {/* TITLE */}
        <h3
          style={{
            margin: 0,
            marginBottom: "14px",
            color: textColor,
            fontSize: "15px",
            fontWeight: 700,
          }}
        >
          AC Output
        </h3>

        {/* TOP BORDER */}
        <div
          style={{
            height: "1px",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
            marginBottom: "16px",
          }}
        />

        {/* MAIN */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "18px",
            height: "calc(100% - 55px)",
          }}
        >
          {/* LEFT SIDE (draggable group) */}
          <div
            style={{
              position: "relative",
              height: "240px",
              transform: `translate(${groupPos.x}px, ${groupPos.y}px)`,
              transformOrigin: "0 0",
            }}
          >
            {/* MAIN VERTICAL */}
            <div
              style={{
                position: "absolute",
                left: "78px",
                top: "12px",
                width: "2px",
                height: "228px",
                background: green,
              }}
            />

            {/* 12 MPPT */}
            {Array.from({ length: 12 }, (_, i) => {
              const start = 12;
              const totalHeight = 228;
              const gap = totalHeight / 11;
              const top = start + i * gap;
              const currentColor = getMPPTColor(i + 1);

              return (
                <div key={i}>
                  {/* LABEL */}
                  <div
                    style={{
                      position: "absolute",
                      left: "0px",
                      top: `${top - 6}px`,
                      color: textColor,
                      fontSize: "10px",
                      fontWeight: 700,
                    }}
                  >
                    MPPT{i + 1}
                  </div>

                  {/* DOT */}
                  <div
                    style={{
                      position: "absolute",
                      left: "42px",
                      top: `${top}px`,
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: currentColor,
                      boxShadow: `0 0 8px ${currentColor}`,
                    }}
                  />

                  {/* HORIZONTAL */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50px",
                      top: `${top + 3}px`,
                      width: "28px",
                      height: "2px",
                      background: currentColor,
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      left: "40px",
                      top: `${top - 11}px`,
                      fontSize: "8px",
                      fontWeight: 700,
                      color: "#000000",
                      minWidth: "52px",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getMPPTVoltage(i + 1)} V
                  </div>
                </div>
              );
            })}

            {/* MODULE 1 CONNECT */}
            <div
              style={{
                position: "absolute",
                left: "78px",
                top: "36px",
                width: "24px",
                height: "2px",
                background: green,
              }}
            />

            {/* MODULE 2 CONNECT */}
            <div
              style={{
                position: "absolute",
                left: "78px",
                top: "198px",
                width: "24px",
                height: "2px",
                background: green,
              }}
            />

            {/* MODULE 1 */}
            <div
              style={{
                position: "absolute",

                top: "12px",
                left: "102px",

                width: "92px",
                height: "46px",

                borderRadius: "3px",

                border: "1px solid #6b7f99",

                background:
                  "linear-gradient(180deg,#17314d 0%, #11253d 100%)",

                boxShadow:
                  "inset 0 0 12px rgba(0,0,0,0.35)",

                overflow: "hidden",
              }}
            >

              {/* INNER GLOW */}

              <div
                style={{
                  position: "absolute",
                  inset: 0,

                  background:
                    "linear-gradient(180deg,rgba(255,255,255,0.04),transparent)",

                  pointerEvents: "none",
                }}
              />

              <svg
                width="58"
                height="26"
                viewBox="0 0 58 26"
                style={{
                  position: "absolute",

                  top: "5px",
                  left: "17px",
                }}
              >

                {/* SIDE LINES */}

                <line
                  x1="2"
                  y1="13"
                  x2="18"
                  y2="13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

                <line
                  x1="40"
                  y1="13"
                  x2="56"
                  y2="13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

                {/* TOP SHAPE */}

                <path
                  d="M18 13V7H40V13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                />

                {/* TOP ARROWS */}

                <line
                  x1="29"
                  y1="1"
                  x2="29"
                  y2="7"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <line
                  x1="29"
                  y1="1"
                  x2="25"
                  y2="5"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <line
                  x1="29"
                  y1="1"
                  x2="33"
                  y2="5"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* CENTER NODE */}

                <circle
                  cx="29"
                  cy="18"
                  r="4"
                  fill="#f0abfc"
                />

                {/* BOTTOM LINE */}

                <line
                  x1="22"
                  y1="18"
                  x2="36"
                  y2="18"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

              </svg>

              {/* LABEL */}

              <div
                style={{
                  position: "absolute",

                  bottom: "3px",

                  width: "100%",

                  textAlign: "center",

                  color: "#ffffff",

                  fontSize: "9px",

                  fontWeight: 700,

                  letterSpacing: "0.4px",
                }}
              >
                MODULE 1
              </div>

            </div>

            {/* MODULE 2 */}
            <div
              style={{
                position: "absolute",

                top: "176px",
                left: "102px",

                width: "92px",
                height: "46px",

                borderRadius: "3px",

                border: "1px solid #6b7f99",

                background:
                  "linear-gradient(180deg,#17314d 0%, #11253d 100%)",

                boxShadow:
                  "inset 0 0 12px rgba(0,0,0,0.35)",

                overflow: "hidden",
              }}
            >

              {/* INNER GLOW */}

              <div
                style={{
                  position: "absolute",
                  inset: 0,

                  background:
                    "linear-gradient(180deg,rgba(255,255,255,0.04),transparent)",

                  pointerEvents: "none",
                }}
              />

              <svg
                width="58"
                height="26"
                viewBox="0 0 58 26"
                style={{
                  position: "absolute",

                  top: "5px",
                  left: "17px",
                }}
              >

                {/* SIDE LINES */}

                <line
                  x1="2"
                  y1="13"
                  x2="18"
                  y2="13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

                <line
                  x1="40"
                  y1="13"
                  x2="56"
                  y2="13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

                {/* TOP SHAPE */}

                <path
                  d="M18 13V7H40V13"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                />

                {/* TOP ARROWS */}

                <line
                  x1="29"
                  y1="1"
                  x2="29"
                  y2="7"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <line
                  x1="29"
                  y1="1"
                  x2="25"
                  y2="5"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <line
                  x1="29"
                  y1="1"
                  x2="33"
                  y2="5"
                  stroke="#f0abfc"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* CENTER NODE */}

                <circle
                  cx="29"
                  cy="18"
                  r="4"
                  fill="#f0abfc"
                />

                {/* BOTTOM LINE */}

                <line
                  x1="22"
                  y1="18"
                  x2="36"
                  y2="18"
                  stroke="#f0abfc"
                  strokeWidth="2"
                />

              </svg>

              {/* LABEL */}

              <div
                style={{
                  position: "absolute",

                  bottom: "3px",

                  width: "100%",

                  textAlign: "center",

                  color: "#ffffff",

                  fontSize: "9px",

                  fontWeight: 700,

                  letterSpacing: "0.4px",
                }}
              >
                MODULE 2
              </div>

            </div>

            {/* AC1 TOP LINE */}
            <div style={{ position: "absolute", left: "194px", top: "36px", width: "70px", height: "2px", background: orange }} />

            {/* AC2 BOTTOM LINE */}
            <div style={{ position: "absolute", left: "194px", top: "198px", width: "70px", height: "2px", background: orange }} />

            {/* ================= VERTICAL LINE 1 ================= */}
            <div
              style={{
                position: "absolute",
                left: `${vLine1Pos.x}px`,
                top: `${vLine1Pos.y}px`,
                width: "18px",
                height: "60px",
                transform: "translateX(-7px)",
                cursor: "default",
                zIndex: 2000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "3px",
                  height: "40px",
                  background: orange,
                  borderRadius: "4px",
                  boxShadow: `0 0 8px ${orange}`,
                }}
              />
            </div>

            {/* ================= VERTICAL LINE 2 ================= */}
            {/* ================= VERTICAL LINE 2 ================= */}
<div
  style={{
    position: "absolute",
    left: `${vLine2Pos.x}px`,
    top: `${vLine2Pos.y}px`,
    width: "18px",
    height: "80px",
    transform: "translateX(-7px)",
    cursor: "grab",
    zIndex: 2000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();

    currentDragTargetRef.current = "v2";

    offsetRef.current = {
      x: e.clientX - vLine2Pos.x,
      y: e.clientY - vLine2Pos.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrag);
  }}
  onTouchStart={(e) => {
    const t = e.touches[0];
    if (!t) return;

    currentDragTargetRef.current = "v2";

    offsetRef.current = {
      x: t.clientX - vLine2Pos.x,
      y: t.clientY - vLine2Pos.y,
    };

    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    window.addEventListener("touchend", stopDrag);
  }}
>
  <div
    style={{
      width: "3px",
      height: "65px",
      background: orange,
      borderRadius: "4px",
      boxShadow: `0 0 8px ${orange}`,
    }}
  />
</div>
            {/* LOAD BRANCH (static) */}
            <div
              style={{
                position: "absolute",
                left: `${branchPos.x}px`,
                top: `${branchPos.y}px`,
                width: "80px",
                height: "80px",
                cursor: "default",
                zIndex: 999,
                pointerEvents: "none",
              }}
            >
              <svg width="80" height="80" viewBox="0 0 120 120">
                <circle cx="60" cy="30" r="24" fill="transparent" stroke={orange} strokeWidth="2.5" />
                <line x1="60" y1="30" x2="60" y2="18" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="60" y1="30" x2="48" y2="20" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="60" y1="30" x2="72" y2="20" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="42" cy="74" r="24" fill="transparent" stroke={orange} strokeWidth="2.5" />
                <line x1="42" y1="74" x2="42" y2="88" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="42" y1="74" x2="30" y2="64" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="42" y1="74" x2="54" y2="64" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="78" cy="74" r="24" fill="transparent" stroke={orange} strokeWidth="2.5" />
                <line x1="78" y1="74" x2="78" y2="88" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="78" y1="74" x2="66" y2="64" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="78" y1="74" x2="90" y2="64" stroke={orange} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M39 41L32 48" stroke={orange} strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M55 41L62 48" stroke={orange} strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </div>

          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "12px" }}>
            {rightSectionData.map((row) => (
              <div key={row[0]} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px" }}>
                <span style={{ color: subText, fontSize: "13px" }}>{row[0]}</span>
                <span style={{ color: textColor, fontSize: "13px", fontWeight: 700 }}>{row[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ACOutputCard;
