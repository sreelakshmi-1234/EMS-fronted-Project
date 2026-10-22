import { useEffect, useState, useMemo } from "react";
import { useTimeHandle } from "../../../../Services/TimeWindowSetting";
import SplineGraph from "../../../Graphs/RevampCharts/SplineGraph";
import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";
import { useColorModeValue, Box } from "@chakra-ui/react";
import type { ExportFunctions } from "../../../../types/graphExport/export";

const hour = 60 * 60 * 1000;

// ---- DUMMY FALLBACK ----
const dummySeries = (() => {
  const now = new Date();
  const start = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    12, 0, 0
  );

  return [
    {
      type: "spline" as const,
      name: "Power (kW)",
      data: Array.from({ length: 12 }, (_, i) => [
        start + i * hour,
        Math.random() * 1000,
      ]),
      marker: { enabled: true },
    },
    {
      type: "spline" as const,
      name: "POA (W/m²)",
      data: Array.from({ length: 12 }, (_, i) => [
        start + i * hour,
        Math.random() * 800,
      ]),
      marker: { enabled: true },
    },
  ];
})();

const PowerCurve = () => {
  const {
    config: timeWindowPowerCurve,
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
        relativeType: "currentDaySoFar",
        interval: 1,
        intervalType: "minute",
      },
    }
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateNavEnabled, setDateNavEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFs = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFs);
    return () => document.removeEventListener("fullscreenchange", handleFs);
  }, []);

  const formattedDate = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    return `${y}/${m}/${d}`;
  }, [currentDate]);

  const isToday = useMemo(() => {
    const t = new Date();
    return (
      currentDate.getFullYear() === t.getFullYear() &&
      currentDate.getMonth() === t.getMonth() &&
      currentDate.getDate() === t.getDate()
    );
  }, [currentDate]);

  const applyAbsoluteDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0,0,0,0);

    const end = new Date(date);
    end.setHours(23,59,59,999);

    handleTimeWindowChange({
      aggregation: timeWindowPowerCurve.aggregation,
      orderBy: timeWindowPowerCurve.orderBy,
      timeRange:{
        type:"absolute",
        startTs:start.getTime(),
        endTs:end.getTime()
      }
    });
  };

  const goPrevDay = () => {
    setCurrentDate(prev=>{
      const d = new Date(prev);
      d.setDate(d.getDate()-1);
      applyAbsoluteDay(d);
      return d;
    });
  };

  const goNextDay = () => {
    if (isToday) return;

    setCurrentDate(prev=>{
      const d = new Date(prev);
      d.setDate(d.getDate()+1);

      const today = new Date();

      const reachedToday =
        d.getFullYear()===today.getFullYear() &&
        d.getMonth()===today.getMonth() &&
        d.getDate()===today.getDate();

      if(reachedToday){
        handleReset();
      } else {
        applyAbsoluteDay(d);
      }

      return d;
    });
  };

  const fetchingToServerObj = {
    dataSource: {
      devices: {
        patterns: [],
        ids: ["plant_1_pcs_2_bank_bank_1"],
      },
      keys: [
        {
          key: "active_power",
          alias: "Power (kW)",
          keyType: "common",
        },
        {
          key: "soc",
          alias: "POA (W/m²)",
          keyType: "common",
        },
      ],
      aggregation: timeWindowPowerCurve.aggregation,
      timeRange: timeWindowPowerCurve.timeRange,
      orderBy: timeWindowPowerCurve.orderBy,
    },
  };

  const { data, fetchData } = useTimeseriesData();

  useEffect(() => {
    fetchData(fetchingToServerObj.dataSource);
  }, [timeWindowPowerCurve]);

  // ---- TRANSFORM API DATA ----
  const seriesForChart = useMemo(() => {
    if (data && typeof data === "object") {
      const series: any[] = [];

      Object.values(data).forEach((deviceObj: any) => {
        if (deviceObj && typeof deviceObj === "object") {
          Object.entries(deviceObj).forEach(([metric, points]: any) => {
            if (Array.isArray(points)) {
              series.push({
                type: "spline",
                name: metric,
                data: points.map((p) => [p.ts, p.value]),
                marker: { enabled: true },
              });
            }
          });
        }
      });

      return series.length ? series : dummySeries;
    }
    return dummySeries;
  }, [data]);

  const textColor = useColorModeValue("#1A202C", "#E6E6E6");
  const subTextColor = useColorModeValue("#4A5568", "#B9B9B9");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.10)",
    "rgba(255,255,255,0.08)"
  );
  const axisLineColor = useColorModeValue(
    "rgba(0,0,0,0.16)",
    "rgba(255,255,255,0.06)"
  );

  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);

  return (
    <GraphLayout
      title={
        <Box display="flex" alignItems="center" w="100%">

          <Box fontWeight="600">Power Curve</Box>

          <Box ml={isFullScreen ? "900" : "28"}
            display="flex"
            alignItems="center"
            bg={useColorModeValue("gray.100","gray.700")}
            borderRadius="6px"
            px={2}
            height="22px"
            gap={2}
          >
            <Box cursor="pointer" fontSize="12px" onClick={goPrevDay}>‹</Box>

            <Box fontSize="11px" fontWeight="600" minW="78px" textAlign="center">
              {formattedDate}
            </Box>

            <Box
              cursor={isToday ? "not-allowed" : "pointer"}
              opacity={isToday ? 0.35 : 1}
              fontSize="12px"
              onClick={goNextDay}
            >
              ›
            </Box>
          </Box>

        </Box>
      }
      
      width={["578px"]}
      height="304px"
      fullScreen
      timeWindow
      onTimeWindowChange={handleTimeWindowChange}
      onReset={handleReset}
      onExport={exportFunctions}
    >
      <SplineGraph
        apiData={seriesForChart}
        height={250}
        onExportReady={setExportFunctions}
        props={{
          chart: {
            events: {
              mouseOut() {
                // hover stuck fix (hard reset)
                this.series.forEach((s: any) => {
                  s.setState("", true);
                });
              },
            },
          },

          plotOptions: {
            series: {
              shadow: false,
              lineWidth: 2,

              // IMPORTANT FIX
              states: {
                inactive: {
                  opacity: 1, // cursor hatate hi sab normal
                },
                hover: {
                  enabled: true,
                  lineWidth: 2,
                },
              },

              marker: {
                enabled: true,
                radius: 4,
                lineWidth: 2,
                lineColor: "#FFFFFF",
              },
            },
          },

          yAxis: {
            tickAmount: 6,
            title: { text: null },
            labels: {
              style: { color: textColor },
              formatter() {
                return this.value.toFixed(2);
              },
            },
            gridLineColor: gridColor,
          },

          xAxis: {
            type: "datetime",
            min: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              0,
              0,
              0,
              0
            ).getTime(),
            max: new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
              23,
              59,
              59,
              999
            ).getTime(),
            tickInterval: 2 * 60 * 60 * 1000,
            startOnTick: true,
            endOnTick: true,
            crosshair: { color: "rgba(255,255,255,0.15)", width: 1 },
            labels: {
              format: "{value:%H:%M}",
              style: { color: subTextColor },
            },
            lineColor: axisLineColor,
            gridLineColor: gridColor,
            gridLineDashStyle: "ShortDot",
            gridLineWidth: 1,
          },

          tooltip: {
            shared: true,
            hideDelay: 0,
            backgroundColor: useColorModeValue(
              "#fff",
              "rgba(24,24,27,0.95)"
            ),
            style: { color: textColor },
            valueDecimals: 2,
          },

          legend: {
            align: "center",
            verticalAlign: "bottom",
            layout: "horizontal",
            itemStyle: { color: textColor },
          },
        }}
      />
    </GraphLayout>
  );
};

export default PowerCurve;
