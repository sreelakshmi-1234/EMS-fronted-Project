// TrendChartCard.tsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  useTimeHandle,
} from "../../../../Services/TimeWindowSetting";

import SplineGraph from "../../../Graphs/RevampCharts/SplineGraph";

import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";

import useTimeseriesData from "../../../../hooks/useTimeseriesData";

import useDateFormatterMargin from "../../../DateFormatter";

import type {
  ExportFunctions,
} from "../../../../types/graphExport/export";

const hour =
  60 * 60 * 1000;

const TrendChartCard = ({
  deviceId,
}: any) => {

  const {
    config:
      timeWindowTrend,
    handleTimeWindowChange,
    handleReset,
  } = useTimeHandle(
    12,
    "hour",
    "none",
    [1, "minute"],
    60000,
    {
      timeRange: {
        type: "relative",
        relativeType:
          "currentDaySoFar",
        interval: 1,
        intervalType:
          "minute",
      },
    }
  );

  const [
    exportFunctions,
    setExportFunctions,
  ] =
    useState<ExportFunctions | null>(
      null
    );

  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    new Date()
  );

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "AC vs DC Power"
  );

  const formattedDate =
    useMemo(() => {

      const y =
        currentDate.getFullYear();

      const m = String(
        currentDate.getMonth() +
          1
      ).padStart(2, "0");

      const d = String(
        currentDate.getDate()
      ).padStart(2, "0");

      return `${y}/${m}/${d}`;

    }, [currentDate]);

  const isToday =
    useMemo(() => {

      const t =
        new Date();

      return (
        currentDate.getFullYear() ===
          t.getFullYear() &&
        currentDate.getMonth() ===
          t.getMonth() &&
        currentDate.getDate() ===
          t.getDate()
      );

    }, [currentDate]);

  const applyAbsoluteDay = (
    date: Date
  ) => {

    const start =
      new Date(date);

    start.setHours(
      0,
      0,
      0,
      0
    );

    const end =
      new Date(date);

    end.setHours(
      23,
      59,
      59,
      999
    );

    handleTimeWindowChange(
      {
        aggregation:
          timeWindowTrend.aggregation,

        orderBy:
          timeWindowTrend.orderBy,

        timeRange: {
          type:
            "absolute",

          startTs:
            start.getTime(),

          endTs:
            end.getTime(),
        },
      }
    );

  };

  const goPrevDay =
    () => {

      setCurrentDate(
        (prev) => {

          const d =
            new Date(prev);

          d.setDate(
            d.getDate() - 1
          );

          applyAbsoluteDay(
            d
          );

          return d;

        }
      );

    };

  const goNextDay =
    () => {

      if (isToday)
        return;

      setCurrentDate(
        (prev) => {

          const d =
            new Date(prev);

          d.setDate(
            d.getDate() + 1
          );

          const today =
            new Date();

          const reachedToday =
            d.getFullYear() ===
              today.getFullYear() &&
            d.getMonth() ===
              today.getMonth() &&
            d.getDate() ===
              today.getDate();

          if (
            reachedToday
          ) {

            handleReset();

          } else {

            applyAbsoluteDay(
              d
            );

          }

          return d;

        }
      );

    };

  /* ================= API ================= */

  const {
    data,
    fetchData,
  } =
    useTimeseriesData();

  useEffect(() => {

    if (!deviceId) return;

    fetchData({
      devices: { patterns: [], ids: [deviceId] },

      keys: [
        {
          key: "active_power",
          alias: "AC Power (kW)",
          keyType: "common",
        },
        {
          key: "total_dc_power",
          alias: "DC Power (kW)",
          keyType: "common",
        },
        {
          key: "temperature",
          alias: "IGBT Temp (°C)",
          keyType: "common",
        },
        ...Array.from(
          { length: 30 },
          (_, i) => ({
            key: `string_${i + 1}_current`,

            alias: `string_${i + 1}_current`,

            keyType: "common",
          })
        ),
        
      ],

      aggregation: timeWindowTrend.aggregation,
      timeRange: timeWindowTrend.timeRange,
      orderBy: "ASC",
    } as any);

  }, [timeWindowTrend, deviceId]);

  /* ================= SERIES ================= */

  const seriesForChart =
    useMemo(() => {
      if (!data || !deviceId || !(data as any)[deviceId]) return [];

      const d = (data as any)[deviceId];

      if (activeTab === "AC vs DC Power") {
        return [
          {
            type: "spline",
            name: "AC Power (kW)",
            color: "#3b82f6",
            data: d["AC Power (kW)" ]?.map((p: any) => [p.ts, Number(p.value)]) || [],
            marker: { enabled: false },
          },
          {
            type: "spline",
            name: "DC Power (kW)",
            color: "#84cc16",
            data: d["DC Power (kW)"]?.map((p: any) => [p.ts, Number(p.value)]) || [],
            marker: { enabled: false },
          },
        ];
      }

      if (activeTab === "IGBT Temperature") {
        return [
          {
            type: "spline",
            name: "IGBT Temp (°C)",
            color: "#f59e0b",
            data: d["IGBT Temp (°C)"]?.map((p: any) => [p.ts, Number(p.value)]) || [],
            marker: { enabled: false },
          },
        ];
      }

      const stringKeys =
        Object.keys(d).filter(
          (key) =>
            key
              .toLowerCase()
              .includes("_current")
        );

      return stringKeys.map(
        (key: string, index: number) => {
          const colors = [
            "#a855f7",
            "#3b82f6",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#06b6d4",
            "#84cc16",
            "#ec4899",
            "#14b8a6",
            "#f97316",
          ];

          return {
            type: "spline",

            name: key
              .replaceAll("_", " ")
              .toUpperCase(),

            color: colors[index % colors.length],

            data: d[key]?.map((p: any) => [p.ts, Number(p.value)]) || [],

            marker: {
              enabled: false,
            },
          };
        }
      );
    }, [data, activeTab, deviceId]);

  /* ================= COLORS ================= */

  const textColor =
    useColorModeValue(
      "#1A202C",
      "#E6E6E6"
    );

  const subTextColor =
    useColorModeValue(
      "#4A5568",
      "#B9B9B9"
    );

  const gridColor =
    useColorModeValue(
      "rgba(0,0,0,0.10)",
      "rgba(255,255,255,0.08)"
    );

  const axisLineColor =
    useColorModeValue(
      "rgba(0,0,0,0.16)",
      "rgba(255,255,255,0.06)"
    );

  const dateFormatterMargin =
    useDateFormatterMargin(
      {
        fullScreenMargin:
          "900",

        normalMargin:
          "28",
      }
    );

  /* ================= RENDER ================= */

  return (
    <GraphLayout
      title={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          w="100%"
        >

          {/* TABS */}

          <Box
            display="flex"
            alignItems="center"
            border={
              useColorModeValue(
                "1px solid #dbe7f3",
                "1px solid rgba(255,255,255,0.08)"
              )
            }
            borderRadius="4px"
            overflow="hidden"
            h="26px"
          >

            {[
              "AC vs DC Power",
              "IGBT Temperature",
              "Current",
            ].map((tab) => (

              <Box
                key={tab}
                px={4}
                h="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                fontSize="12px"
                fontWeight="500"
                transition="0.2s"

                bg={
                  activeTab === tab
                    ? useColorModeValue(
                        "#e2e8f0",
                        "rgba(255,255,255,0.08)"
                      )
                    : "transparent"
                }

                color={
                  activeTab === tab
                    ? useColorModeValue(
                        "#0f172a",
                        "#ffffff"
                      )
                    : useColorModeValue(
                        "#64748b",
                        "#cbd5e1"
                      )
                }

                borderRight={
                  tab !== "Current"
                    ? useColorModeValue(
                        "1px solid #dbe7f3",
                        "1px solid rgba(255,255,255,0.08)"
                      )
                    : "none"
                }

                onClick={() =>
                  setActiveTab(tab)
                }
              >
                {tab}
              </Box>

            ))}

          </Box>

          {/* DATE */}

          <Box
            ml={
              dateFormatterMargin
            }
            display="flex"
            alignItems="center"
            bg={useColorModeValue(
              "gray.100",
              "gray.700"
            )}
            borderRadius="6px"
            px={2}
            height="22px"
            gap={2}
          >

            <Box
              cursor="pointer"
              fontSize="12px"
              onClick={
                goPrevDay
              }
            >
              ‹
            </Box>

            <Box
              fontSize="11px"
              fontWeight="600"
              minW="78px"
              textAlign="center"
            >
              {
                formattedDate
              }
            </Box>

            <Box
              cursor={
                isToday
                  ? "not-allowed"
                  : "pointer"
              }
              opacity={
                isToday
                  ? 0.35
                  : 1
              }
              fontSize="12px"
              onClick={
                goNextDay
              }
            >
              ›
            </Box>

          </Box>

        </Box>
      }

      width={["100%"]}

      height="344px"

      WidgetProps={{ mt: 0 }}

      fullScreen

      timeWindow

      onTimeWindowChange={
        handleTimeWindowChange
      }

      onReset={
        handleReset
      }

      onExport={
        exportFunctions
      }
    >

      <SplineGraph
        apiData={
          seriesForChart
        }

        height={280}

        onExportReady={
          setExportFunctions
        }

        props={{
          chart: {
            backgroundColor:
              "transparent",

            events: {
              mouseOut:
                function (
                  this: any
                ) {

                  this.series.forEach(
                    (
                      s: any
                    ) => {

                      s.setState(
                        "",
                        true
                      );

                    }
                  );

                },
            },
          },

          plotOptions: {
            series: {
              shadow: false,

              lineWidth: 2,

              states: {
                inactive:
                  {
                    opacity: 1,
                  },

                hover: {
                  enabled:
                    true,

                  lineWidth: 2,
                },
              },

              marker: {
                enabled:
                  false,
              },
            },
          },

          yAxis: {
            tickAmount: 6,

            title: {
              text: null,
            },

            labels: {
              style: {
                color:
                  textColor,

                fontSize:
                  "11px",
              },

              formatter:
                function (
                  this: any
                ) {

                  return (
                    Number(
                      this.value
                    ).toFixed(
                      0
                    )
                  );

                },
            },

            gridLineColor:
              gridColor,
          },

          xAxis: {
            type:
              "datetime",

            crosshair:
              {
                color:
                  "rgba(255,255,255,0.15)",

                width: 1,
              },

            labels: {
              style: {
                color:
                  subTextColor,

                fontSize:
                  "11px",
              },
            },

            lineColor:
              axisLineColor,

            gridLineColor:
              gridColor,

            gridLineDashStyle:
              "ShortDot",

            gridLineWidth: 1,
          },

          tooltip: {
            shared: true,

            hideDelay: 0,

            backgroundColor:
              useColorModeValue(
                "#fff",
                "rgba(24,24,27,0.95)"
              ),

            style: {
              color:
                textColor,
            },

            valueDecimals: 2,
          },

          legend: {
            align: "center",

            verticalAlign:
              "bottom",

            layout:
              "horizontal",

            itemStyle: {
              color:
                textColor,

              fontSize:
                "11px",
            },
          },
        }}
      />

    </GraphLayout>
  );
};

export default TrendChartCard;