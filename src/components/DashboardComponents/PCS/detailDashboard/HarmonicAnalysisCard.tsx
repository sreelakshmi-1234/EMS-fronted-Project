import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useColorModeValue } from "@chakra-ui/react";

import GraphLayout from "../../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import ColumnGraph from "../../../Graphs/RevampCharts/ColumnGraph";
import WidgetTitle from "../../../Common/WidgetTitle";
import { useTimeHandle } from "../../../../Services/TimeWindowSetting";
import useTimeseriesData from "../../../../hooks/useTimeseriesData";

import type { ExportFunctions } from "../../../../types/graphExport/export";

const DAY = 24 * 60 * 60 * 1000;

interface HarmonicAnalysisCardProps {
  deviceId?: string;
}

const HarmonicAnalysisCard: React.FC<HarmonicAnalysisCardProps> = ({ deviceId }) => {
  /* COLORS */
  const textColor = useColorModeValue("#1A202C", "#E6E6E6");
  const subTextColor = useColorModeValue("#4A5568", "#B9B9B9");
  const gridColor = useColorModeValue(
    "rgba(0,0,0,0.10)",
    "rgba(255,255,255,0.08)"
  );

  const { data, fetchData } = useTimeseriesData();
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

  /* EXPORT */
  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    fetchData({
      devices: {
        ids: [deviceId],
        patterns: [],
      },
      keys: [
        {
          key: "daily_energy",
          alias: "Daily Energy",
          keyType: "common",
        },
      ],
      aggregation: timeWindow.aggregation,
      timeRange: timeWindow.timeRange,
      orderBy: "ASC",
    } as any);
  }, [deviceId, timeWindow]);

  const harmonicSeries = useMemo(() => {
    const responseData = (data as any)?.data ?? data;
    const deviceData = responseData?.[deviceId || ""];
    const points = deviceData?.["Daily Energy"] ?? [];

    console.log("deviceData", deviceData);
    console.log("points", points);

    if (!deviceData || points.length === 0) {
      return [
        {
          type: "column",
          name: "Daily Energy",
          color: "#3B82F6",
          data: [[Date.now(), 0]],
        },
      ];
    }

    return [
      {
        type: "column",
        name: "Energy",
        color: "#3B82F6",
        data: points.map((point: any) => [
          Number(point.ts),
          Number(point.value),
        ]),
        pointRange: DAY,
        pointPlacement: 0,
        zIndex: 3,
      },
    ];
  }, [data, deviceId]);

  const handleExportReady = useCallback((functions: ExportFunctions) => {
    setExportFunctions((prev) => {
      if (
        prev?.exportPNG === functions.exportPNG &&
        prev?.exportCSV === functions.exportCSV
      ) {
        return prev;
      }
      return functions;
    });
  }, []);

  return (
    <>
      <GraphLayout
        title={<WidgetTitle>Harmonic Analysis (AC Side)</WidgetTitle>}
        width={["100%"]}
        height="310px"
        fullScreen
        timeWindow
        onTimeWindowChange={handleTimeWindowChange}
        onReset={handleReset}
        downloadOption
        onExport={exportFunctions}
      >
        <ColumnGraph
          apiData={harmonicSeries}
          height={215}
          legendHeight={20}
          onExportReady={handleExportReady}
          props={{
            xAxis: {
              type: "datetime",
              tickAmount: 7,
              labels: {
                formatter: function (this: any) {
                  return new Date(this.value).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  });
                },
                style: {
                  color: subTextColor,
                },
              },
            },
            yAxis: {
              min: 0,
              title: {
                text: "",
              },
              labels: {
                style: {
                  color: textColor,
                },
              },
              gridLineColor: gridColor,
            },
            plotOptions: {
              column: {
                pointWidth: 18,
                borderRadius: 6,
                grouping: true,
                groupPadding: 0.12,
                pointPadding: 0.05,
                borderWidth: 0,
              },
            },
            tooltip: {
              shared: true,
              backgroundColor: useColorModeValue(
                "#fff",
                "rgba(24,24,27,0.95)"
              ),
              style: {
                color: textColor,
              },
              formatter: function (this: any) {
                const points = this.points || [];
                const time = new Date(this.x).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });

                const rows = points.map((point: any) => {
                  const value = Number(point.y).toFixed(2);
                  return `<div><span style="color:${point.color}">●</span> ${point.series.name}: <b>${value} kWh</b></div>`;
                });

                return `<b>${time}</b><br/>${rows.join("")}`;
              },
            },
            legend: {
              enabled: true,
              align: "center",
              verticalAlign: "bottom",
              navigation: {
                enabled: false,
              },
              itemStyle: {
                color: textColor,
              },
            },
          }}
        />
      </GraphLayout>

    </>
  );
};

export default HarmonicAnalysisCard;
