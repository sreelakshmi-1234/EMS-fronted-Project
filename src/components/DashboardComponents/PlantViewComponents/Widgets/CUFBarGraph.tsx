import React, { useEffect, useMemo, useState } from "react";
import { useColorModeValue } from "@chakra-ui/react";

import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import ColumnGraphNew from "../../../Graphs/RevampCharts/ColumnGraphNew";
import WidgetTitle from "../../../Common/WidgetTitle";

import { useTimeHandle } from "../../../../Services/TimeWindowSetting";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";

import type { ExportFunctions } from "../../../../types/graphExport/export";

const DAY = 24 * 60 * 60 * 1000;

const CUFBarGraph: React.FC = () => {
  /* TIME WINDOW  */
  const {
    config: timeWindow,
    handleTimeWindowChange,
    handleReset,
  } = useTimeHandle(
    12,
    "hour",
    "last",
    [1, "day"],
    60000,
    {
      timeRange: {
        type: "last",
        relativeType: "currentDaySoFar",
        interval: 7,
        intervalType: "day",
      },
    }
  );

  /* SOC (ALL BANKS - SPLINE */
  const socFetch = {
  dataSource: {
    devices: {
      patterns: [],
      ids: Array.from({ length: 17 }, (_, i) => [
        `plant_1_pcs_1_bank_bank_${i + 1}`,
        `plant_1_pcs_2_bank_bank_${i + 1}`,
      ]).flat(),
    },

    keys: [
      {
        key: "soc",
        alias: "SoC (%)",
        keyType: "common",
      },
    ],

    aggregation: timeWindow.aggregation,
    timeRange: timeWindow.timeRange,
    orderBy: "ASC",
  },
};

  const { data: socData, fetchData: fetchSoc } = useTimeseriesData();

  /* CHARGE / DISCHARGE (BARS) */
  const powerFetch = {
  dataSource: {
    devices: {
      ids: ["plant_1_pcs_2_bank_bank_1"],
      patterns: [],
    },
    keys: [
      { key: "energy_charged_today", alias: "Charge" },
      { key: "energy_discharged_today", alias: "Discharge" },
    ],
    aggregation: timeWindow.aggregation,
    timeRange: timeWindow.timeRange,
    orderBy: "ASC",
  },
};
  const { data: powerData, fetchData: fetchPower } = useTimeseriesData();

  /* FETCH */
  useEffect(() => {
    fetchSoc(socFetch.dataSource);
    fetchPower(powerFetch.dataSource);
  }, [timeWindow]);

  /* MIXED SERIES (SOC + CHARGE/DISCHARGE)  */
  const mixedSeries = useMemo(() => {
    if (!socData || !powerData) return [];

    const series: any[] = [];

    /* SOC SPLINE (ALL BANKS) */
    const socRoot = socData.data ?? socData;
    const socColors = [
      "#090cb2ff",
      "#16a34a",
      "#dc2626",
      "#7c3aed",
      "#ea580c",
      "#0891b2",
      "#be185d",
      "#65a30d",
      "#1d4ed8",
      "#b45309",
    ];

    Object.keys(socRoot).forEach((device, index) => {
      const pts = socRoot[device]?.["SoC (%)"];
      if (Array.isArray(pts)) {
        series.push({
          type: "spline",
          name: `SOC (%)-${device.split("_").pop()}`,
          data: pts.map((p: any) => [p.ts, Number(p.value)]),
          yAxis: 1,
          color: socColors[index % socColors.length],
          opacity: 0.9,
          lineWidth: 2,
          marker: { enabled: false },
          zIndex: 1,
        });
      }
    });

    /* CHARGE / DISCHARGE BARS */
    const powerRoot = powerData.data ?? powerData;
    const dev = Object.keys(powerRoot)[0];

    if (dev) {
      const d = powerRoot[dev];

      if (Array.isArray(d["Charge"])) {
        series.push({
          type: "column",
          name: "Charge (kWh)",
          data: d["Charge"].map((p: any) => [p.ts, Number(p.value)]),
          yAxis: 0,
          color: "#d43809ff",
          pointRange: DAY,
          zIndex: 3,
        });
      }

      if (Array.isArray(d["Discharge"])) {
        series.push({
          type: "column",
          name: "Discharge (kWh)",
          data: d["Discharge"].map((p: any) => [p.ts, Number(p.value)]),
          yAxis: 0,
          color: "#0ad0e7ff",
          pointRange: DAY,
          zIndex: 3,
        });
      }
    }

    return series;
  }, [socData, powerData]);

  /* COLORS */
  const textColor = useColorModeValue("#1A202C", "#E6E6E6");
  const subTextColor = useColorModeValue("#4A5568", "#B9B9B9");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.10)",
    "rgba(255,255,255,0.08)"
  );

  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);

  /* ---------------- RENDER ---------------- */
  return (
    <GraphLayout
      title={
        <WidgetTitle color={textColor}>Charge / Discharge with SOC</WidgetTitle>
      }
      width={["578px"]}
      height="304px"
      fullScreen
      timeWindow
      onTimeWindowChange={handleTimeWindowChange}
      onReset={handleReset}
      onExport={exportFunctions}
    >
      <ColumnGraphNew
        apiData={mixedSeries}
        height={250}
        onExportReady={setExportFunctions}
        axisLabelColor={textColor}
        gridColor={gridColor}
        lineColor={gridColor}
        tooltipBg={useColorModeValue("#fff", "rgba(24,24,27,0.95)")}
        tooltipColor={textColor}
        legendColor={textColor}
        barWidth={18}
        barGap="10%"
        barCategoryGap="30%"
        borderRadius={0}
      />
    </GraphLayout>
  );
};

export default CUFBarGraph;

