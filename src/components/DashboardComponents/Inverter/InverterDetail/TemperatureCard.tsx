// TemperatureCard.tsx

import React, {
  useEffect,
  useMemo,
} from "react";

import {
  useColorMode,
} from "@chakra-ui/react";

import useTimeseriesData from "../../../../hooks/useTimeseriesData";

const TemperatureCard = ({
  deviceId,
}: any) => {

  const { colorMode } =
    useColorMode();

  const isDark =
    colorMode === "dark";

  const {
    data,
    fetchData,
  } = useTimeseriesData();

  /* ================= API HIT ================= */

  useEffect(() => {

    if (!deviceId) return;

    fetchData({

      devices: {
        patterns: [],
        ids: [deviceId],
      },

      keys: [

        {
          key:
            "temperature",

          alias:
            "cabinet_temperature",

          keyType:
            "common",
        },

        {
          key:
            "igbt_temperature_1",

          alias:
            "igbt_temperature_1",

          keyType:
            "common",
        },

        {
          key:
            "igbt_temperature_2",

          alias:
            "igbt_temperature_2",

          keyType:
            "common",
        },

        {
          key:
            "igbt_temperature_3",

          alias:
            "igbt_temperature_3",

          keyType:
            "common",
        },

      ],

      aggregation: {

        func: "last",

        interval: 1,

        intervalType:
          "minute",
      },

      timeRange: {

        type: "relative",

        relativeType:
          "currentDaySoFar",
      },

      orderBy: "ASC",

    } as any);

  }, [deviceId]);

  /* ================= DEVICE DATA ================= */

  const deviceData =
    (data as any)?.[
      deviceId
    ] || {};

  /* ================= MAP ================= */

  const tempData =
    useMemo(() => {

      const getValue = (
        key: string
      ) => {

        const val =
          deviceData?.[
            key
          ]?.[0]?.value;

        return Number(
          val || 0
        );
      };

      return [

        {
          title:
            "Cabinet Temp.",

          value:
            getValue(
              "cabinet_temperature"
            ),
        },

        {
          title:
            "IGBT Temp. 1",

          value:
            getValue(
              "igbt_temperature_1"
            ),
        },

        {
          title:
            "IGBT Temp. 2",

          value:
            getValue(
              "igbt_temperature_2"
            ),
        },

        {
          title:
            "IGBT Temp. 3",

          value:
            getValue(
              "igbt_temperature_3"
            ),
        },

      ];

    }, [deviceData]);

  return (

    <div
      style={{
        background: isDark
          ? "linear-gradient(135deg,#0a2744 0%, #081f37 45%, #06172d 100%)"
          : "linear-gradient(135deg,#ffffff 0%, #f7fafc 50%, #edf4fb 100%)",

        border: isDark
          ? "1px solid #16395c"
          : "1px solid #dbe7f3",

        borderRadius: "10px",

        padding: "14px",

        height: "344px",

        maxWidth: "590px",

        alignSelf: "start",

        boxShadow: isDark
          ? "inset 0 0 35px rgba(0,0,0,0.18)"
          : "0 2px 10px rgba(15,23,42,0.05)",

        overflow: "hidden",
      }}
    >

      {/* TITLE */}

      <h3
        style={{
          margin: 0,

          marginBottom: "14px",

          color: isDark
            ? "#ffffff"
            : "#0f172a",

          fontSize: "15px",

          fontWeight: 700,
        }}
      >
        Temperature
      </h3>

      {/* ROW */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(4,1fr)",

          height: "calc(100% - 40px)",
        }}
      >

        {tempData.map(
          (
            item,
            index
          ) => {

            const safeValue =
              item.value > 100
                ? 100
                : item.value;

            return (

              <div
                key={index}
                style={{
                  display: "flex",

                  flexDirection:
                    "column",

                  alignItems:
                    "center",

                  borderRight:
                    index !== 3
                      ? isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(15,23,42,0.08)"
                      : "none",

                  padding:
                    "0 12px",
                }}
              >

                {/* TITLE */}

                <div
                  style={{
                    color: isDark
                      ? "#dbeafe"
                      : "#334155",

                    fontSize: "12px",

                    fontWeight: 500,

                    marginBottom:
                      "8px",

                    textAlign:
                      "center",
                  }}
                >
                  {item.title}
                </div>

                {/* VALUE */}

                <div
                  style={{
                    color: isDark
                      ? "#ffffff"
                      : "#0f172a",

                    fontSize: "28px",

                    fontWeight: 700,

                    lineHeight: 1,

                    marginBottom:
                      "12px",
                  }}
                >

                  {item.value > 0
                    ? item.value.toFixed(2)
                    : "---"}

                  {
                    item.value > 0 && (

                      <span
                        style={{
                          fontSize:
                            "14px",

                          marginLeft:
                            "2px",

                          fontWeight: 600,
                        }}
                      >
                        °C
                      </span>

                    )
                  }

                </div>

                {/* METER AREA */}

                <div
                  style={{
                    display: "flex",

                    alignItems:
                      "flex-end",

                    gap: "8px",
                  }}
                >

                  {/* SCALE */}

                  <div
                    style={{
                      display: "flex",

                      flexDirection:
                        "column",

                      justifyContent:
                        "space-between",

                      height: "170px",

                      alignItems:
                        "flex-end",
                    }}
                  >

                    <span
                      style={{
                        color: isDark
                          ? "#dbeafe"
                          : "#475569",

                        fontSize:
                          "10px",

                        fontWeight: 600,
                      }}
                    >
                      100 %
                    </span>

                    <span
                      style={{
                        color: isDark
                          ? "#dbeafe"
                          : "#475569",

                        fontSize:
                          "10px",

                        fontWeight: 600,
                      }}
                    >
                      50 %
                    </span>

                    <span
                      style={{
                        color: isDark
                          ? "#dbeafe"
                          : "#475569",

                        fontSize:
                          "10px",

                        fontWeight: 600,
                      }}
                    >
                      0 %
                    </span>

                  </div>

                  {/* BAR */}

                  <div
                    style={{
                      position:
                        "relative",

                      width: "28px",

                      height: "170px",

                      borderRadius:
                        "4px",

                      overflow:
                        "hidden",

                      background: isDark
                        ? "linear-gradient(180deg,#111827,#050b14)"
                        : "linear-gradient(180deg,#dbeafe,#cbd5e1)",

                      border: isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(15,23,42,0.08)",

                      boxShadow:
                        isDark
                          ? "inset 0 0 18px rgba(0,0,0,0.45)"
                          : "inset 0 0 10px rgba(0,0,0,0.08)",
                    }}
                  >

                    {/* GRID */}

                    {[
                      10,
                      20,
                      30,
                      40,
                      50,
                      60,
                      70,
                      80,
                      90,
                    ].map(
                      (
                        line,
                        idx
                      ) => (

                        <div
                          key={idx}
                          style={{
                            position:
                              "absolute",

                            top: `${line}%`,

                            left: 0,

                            right: 0,

                            borderTop:
                              isDark
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(15,23,42,0.08)",
                          }}
                        />

                      )
                    )}

                    {/* FILL */}

                    <div
                      style={{
                        position:
                          "absolute",

                        bottom: 0,

                        left: 0,

                        right: 0,

                        height:
                          `${safeValue}%`,

                        background:
                          "linear-gradient(180deg,#7dd3fc 0%, #4f46e5 45%, #2563eb 100%)",

                        boxShadow:
                          "0 0 18px rgba(59,130,246,0.55)",

                        animation:
                          "tempPulse 2s ease-in-out infinite",
                      }}
                    />

                  </div>

                </div>

              </div>

            );

          }
        )}

      </div>

      {/* ANIMATION */}

      <style>
        {`
          @keyframes tempPulse {

            0% {
              opacity: 0.88;
              transform: scaleY(1);
            }

            50% {
              opacity: 1;
              transform: scaleY(1.03);
            }

            100% {
              opacity: 0.88;
              transform: scaleY(1);
            }

          }
        `}
      </style>

    </div>
  );
};

export default TemperatureCard;
