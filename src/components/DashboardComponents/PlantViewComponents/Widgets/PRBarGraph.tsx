import React, { useEffect, useState, useMemo } from "react";
import { useColorModeValue } from "@chakra-ui/react";
import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import { useTimeHandle } from "../../../../Services/TimeWindowSetting";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";
import type { ExportFunctions } from "../../../../types/graphExport/export";
import type { TimeseriesDataSource } from "../../../../types/timeseries/datasource";
import ColumnGraphNew from "../../../Graphs/RevampCharts/ColumnGraphNew";
import WidgetTitle from "../../../Common/WidgetTitle";

type TimeseriesKeyConfig = TimeseriesDataSource["keys"][number] & {
  color: string;
};

const SolarGraph: React.FC = () => {
  const {
    config: timeWindowCUF,
    handleTimeWindowChange: handleTimeWindowCUFChange,
    handleReset: CUFHandleReset,
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
//CUF & PR
  const fetchingToServerObj: { dataSource: TimeseriesDataSource } = {
    dataSource: {
      devices: {
        patterns: [],
        ids: ["plant_1_plant_device"],
      },
      keys: [
        {
          key: "inv_total_power",
          alias: "Aux",
          keyType: "individual",
        },
        {
          key: "inv_total_daily_ac_energy",
          alias: "Daily Energy (kWh)",
          keyType: "individual",
        },
        {
          key: "total_inv_pr",
          alias: "Gen. Loss (kWh)",
          keyType: "individual",
        },
      ],
      aggregation: timeWindowCUF.aggregation,
      timeRange: timeWindowCUF.timeRange,
      orderBy: "ASC",
    },
  };

  const { data, fetchData } = useTimeseriesData();

  useEffect(() => {
    fetchData(fetchingToServerObj.dataSource);
  }, [timeWindowCUF]);

  const textColor = useColorModeValue("#1A202C", "#E6E6E6");
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

  /* ---------------- SERIES (UNCHANGED LOGIC) ---------------- */
  const seriesForChart = useMemo(() => {
    if (!data || typeof data !== "object") return [];

    const deviceKeys = Object.keys(data);
    if (!deviceKeys.length) return [];

    const deviceData = data[deviceKeys[0]];
    if (!deviceData) return [];

    const series: any[] = [];
    const chartColors: Record<string, string> = {
      Aux: "#6DA2FF",
      "Daily Energy (kWh)": "#6EE7B7",
      "Gen. Loss (kWh)": "#e76ed9ff",
    };

    (fetchingToServerObj.dataSource.keys as TimeseriesKeyConfig[]).forEach((cfg) => {
      const points = deviceData[cfg.alias];
      if (Array.isArray(points) && points.length > 0) {
        series.push({
          type: "column",
          name: cfg.alias,
          color: chartColors[cfg.alias] ?? "#6DA2FF",
          yAxis: cfg.alias === "Gen. Loss (kWh)" ? 1 : 0,
          data: points.map((p: any) => [p.ts, p.value]),
        });
      }
    });

    return series;
  }, [data]);

  return (
    <GraphLayout
      title={<WidgetTitle color={textColor}>Solar</WidgetTitle>}
      width={["578px"]}
      height="304px"
      fullScreen
      timeWindow
      onTimeWindowChange={(config) => handleTimeWindowCUFChange(config)}
      onReset={CUFHandleReset}
      onExport={exportFunctions}
    >
      <ColumnGraphNew
        apiData={seriesForChart}
        height={250}
        onExportReady={setExportFunctions}
        axisLabelColor={textColor}
        gridColor={gridColor}
        lineColor={axisLineColor}
        tooltipBg={useColorModeValue("#fff", "rgba(24,24,27,0.95)")}
        tooltipColor={textColor}
        legendColor={textColor}
        barWidth={10}
        barGap="0%"
        barCategoryGap="20%"
        borderRadius={0}
      />
    </GraphLayout>
  );
};

export default SolarGraph;
