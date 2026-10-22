import React, { useEffect, useMemo, useState } from "react";
import { useColorModeValue } from "@chakra-ui/react";

import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import ColumnGraphNew from "../../../Graphs/RevampCharts/ColumnGraphNew";
import WidgetTitle from "../../../Common/WidgetTitle";

import { useTimeHandle } from "../../../../Services/TimeWindowSetting";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";

import type { ExportFunctions } from "../../../../types/graphExport/export";
import type { TimeseriesDataSource } from "../../../../types/timeseries/datasource";

const DAY = 24 * 60 * 60 * 1000;

const GridStackBarGraph: React.FC = () => {
  /* TIME WINDOW */
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

  /* API CONFIG */
  const gridFetch: { dataSource: TimeseriesDataSource } = {
    dataSource: {
      devices: {
        ids: ["plant_1_pcs_2_bank_bank_2"],
        patterns: [],
      },
      keys: [
        { key: "energy_charged_today", alias: "Consumption", keyType: "individual" },
        { key: "energy_discharged_today", alias: "Feed", keyType: "individual" },
      ],
      aggregation: timeWindow.aggregation,
      timeRange: timeWindow.timeRange,
      orderBy: "ASC",
    },
  };

  const { data, fetchData } = useTimeseriesData();

  useEffect(() => {
    fetchData(gridFetch.dataSource);
  }, [timeWindow]);

  /* STACKED SERIES (2 STACKS ONLY) */
  const stackedSeries = useMemo(() => {
    if (!data) return [];

    const root = data.data ?? data;
    const device = Object.keys(root)[0];
    if (!device) return [];

    const d = root[device] as unknown as Record<string, Array<{ ts: number; value: number }>>;
    const series: any[] = [];

    /* CONSUMPTION */
    if (Array.isArray(d["Consumption"])) {
      series.push({
        type: "column",
        name: "Consumption (kWh)",
        color: "#EF4444",
        stack: "grid",
        pointRange: DAY,
        data: d["Consumption"].map((p: any) => [
          p.ts,
          Number(p.value),
        ]),
      });
    }

    /* FEED */
    if (Array.isArray(d["Feed"])) {
      series.push({
        type: "column",
        name: "Feed (kWh)",
        color: "#22C55E",
        stack: "grid",
        pointRange: DAY,
        data: d["Feed"].map((p: any) => [
          p.ts,
          Number(p.value),
        ]),
      });
    }

    return series;
  }, [data]);

  /* COLORS */
  const textColor = useColorModeValue("#1A202C", "#E6E6E6");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.10)",
    "rgba(255,255,255,0.08)"
  );

  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);

  /* RENDER */
  return (
    <GraphLayout
      title={<WidgetTitle color={textColor}>Grid</WidgetTitle>}
      width={["578px"]}
      height="304px"
      fullScreen
      timeWindow
      onTimeWindowChange={handleTimeWindowChange}
      onReset={handleReset}
      onExport={exportFunctions}
    >
      <ColumnGraphNew
        apiData={stackedSeries}
        height={250}
        onExportReady={setExportFunctions}
        axisLabelColor={textColor}
        gridColor={gridColor}
        lineColor={gridColor}
        tooltipBg={useColorModeValue("#fff", "rgba(24,24,27,0.95)")}
        tooltipColor={textColor}
        legendColor={textColor}
        stacked
        barWidth={22}
        barGap="0%"
        barCategoryGap="35%"
        borderRadius={0}
      />
    </GraphLayout>
  );
};

export default GridStackBarGraph;
