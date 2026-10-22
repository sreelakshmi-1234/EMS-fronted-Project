
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";

import * as echarts from "echarts/core";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
  DataZoomComponent,
  ToolboxComponent,
} from "echarts/components";

import { BarChart, LineChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";


import type { ExportFunctions } from "../../../types/graphExport/export";

echarts.use([
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
  DataZoomComponent,
  ToolboxComponent,
  BarChart,
  LineChart,
  CanvasRenderer,
]);

interface ColumnGraphProps {
  apiData?: any[];
  height?: number | string;
  bg?: string;
  category?: string[];
  legendHeight?: number;
  xAxisInterval?: number | string;
  isFullscreen?: boolean;
  onExportReady?: (functions: ExportFunctions) => void;
  inFullScreen?: (mode: boolean) => void;
  axisLabelColor?: string;
  gridColor?: string;
  lineColor?: string;
  tooltipBg?: string;
  tooltipColor?: string;
  legendColor?: string;
  stacked?: boolean;
  barWidth?: number;
  barCategoryGap?: string;
  barGap?: string;
  borderRadius?: number;
}

const ColumnGraph: React.FC<ColumnGraphProps> = ({
  apiData = [],
  height = 280,
  bg,
  category,
  legendHeight = 40,
  xAxisInterval = "auto",
  isFullscreen = false,
  onExportReady,
  inFullScreen,
  axisLabelColor: axisLabelColorProp,
  gridColor: gridColorProp,
  lineColor: lineColorProp,
  tooltipBg: tooltipBgProp,
  tooltipColor: tooltipColorProp,
  legendColor: legendColorProp,
  stacked = false,
  barWidth = 14,
  barCategoryGap = "15%",
  barGap = "0%",
  borderRadius = 0,
}) => {
  const chartRef = useRef<ReactECharts>(null);
  const pointerFixCleanupRef = useRef<(() => void) | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    return () => {
      pointerFixCleanupRef.current?.();
    };
  }, []);

  // --------------------------------------------------
  // Detect Chakra theme
  // --------------------------------------------------
  useEffect(() => {
    const detectTheme = () => {
      const mode = localStorage.getItem("chakra-ui-color-mode");
      setIsDark(mode === "dark");
    };

    detectTheme();

    window.addEventListener("storage", detectTheme);

    const observer = new MutationObserver(detectTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    return () => {
      window.removeEventListener("storage", detectTheme);
      observer.disconnect();
    };
  }, []);

  const axisLabelColor =
    axisLabelColorProp ?? (isDark ? "#E6E6E6" : "#1A202C");

  const gridColor =
    gridColorProp ??
    (isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.10)");

  const lineColor =
    lineColorProp ??
    (isDark
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.15)");

  const legendColor =
    legendColorProp ?? (isDark ? "#E6E6E6" : "#1A202C");

  const tooltipBg =
    tooltipBgProp ?? (isDark ? "rgba(24,24,27,.96)" : "#fff");

  const tooltipColor =
    tooltipColorProp ?? (isDark ? "#fff" : "#1A202C");

  const chartHeight = isFullscreen
    ? "calc(100vh - 70px)"
    : Number(height);

  // --------------------------------------------------
  // Resize chart on fullscreen change
  // --------------------------------------------------
  useEffect(() => {
    inFullScreen?.(isFullscreen);

    requestAnimationFrame(() => {
      const chart = chartRef.current?.getEchartsInstance();

      if (chart && !chart.isDisposed()) {
        chart.resize({ animation: false });
      }
    });
  }, [isFullscreen, inFullScreen]);

  // --------------------------------------------------
  // Chart option
  // Timestamp axis and tooltip follow SplineGraph
  // --------------------------------------------------
  const option = useMemo(() => {
    const hasTimeSeriesData = (apiData || []).some((series: any) =>
      Array.isArray(series?.data) &&
      series.data.some(
        (point: any) =>
          Array.isArray(point) &&
          Number.isFinite(Number(point[0]))
      )
    );

    /*
     * Keep the original [timestamp, value] data for time-series
     * points. Do not convert timestamps into category indexes.
     */
    const normalizedSeries = (apiData || []).map((series: any) => ({
      ...series,
      data: Array.isArray(series?.data)
        ? series.data.map((point: any) => {
            if (
              hasTimeSeriesData &&
              Array.isArray(point) &&
              Number.isFinite(Number(point[0]))
            ) {
              return [Number(point[0]), point[1]];
            }

            return Array.isArray(point) ? point[1] : point;
          })
        : [],
    }));

    const legendBottomSpace = Math.max(legendHeight + 24, 64);

    return {
      backgroundColor: bg || "transparent",
      animation: false,

      grid: {
        left: 20,
        right: 20,
        top: 20,
        bottom: legendBottomSpace,
        containLabel: true,
        borderWidth: 1,
        borderColor: "#DFDFDF",
      },

      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "filter",
          zoomOnMouseWheel: false,
          moveOnMouseMove: false,
          moveOnMouseWheel: false,
        },
      ],

      legend: {
        type: "scroll",
        left: "center",
        bottom: 8,
        width: "100%",
        padding: [2, 8, 2, 8],
        itemGap: 28,
        icon: "rect",
        itemWidth: 12,
        itemHeight: 12,
        textStyle: {
          color: legendColor,
          fontSize: 12,
          fontFamily: "Montserrat",
        },
      },

      tooltip: {
        trigger: "axis",
        triggerOn: "mousemove|click",
        confine: true,
        appendToBody: false,
        transitionDuration: 0.2,
        backgroundColor: tooltipBg,
        borderWidth: 1,
        padding: [6, 8],

        textStyle: {
          color: tooltipColor,
          fontSize: 11,
          lineHeight: 16,
        },

        extraCssText: `
          z-index: 999999;
          font-size: 11px;
          line-height: 16px;
          padding: 6px 8px;
          min-width: 140px;
          max-width: 220px;
          pointer-events: none;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `,

        axisPointer: {
          type: "line",
          snap: true,
          triggerTooltip: true,
          lineStyle: {
            type: "dashed",
            width: 1,
            color: isDark
              ? "rgba(255,255,255,0.25)"
              : "rgba(0,0,0,0.25)",
          },
        },

        formatter: (params: any) => {
          if (!Array.isArray(params) || !params.length) {
            return "";
          }

          // Same timestamp source as SplineGraph.
          const firstValue = params[0]?.value;
          const timestamp = Array.isArray(firstValue)
            ? Number(firstValue[0])
            : NaN;

          let heading = String(params[0]?.axisValue ?? "");

          if (Number.isFinite(timestamp)) {
            const date = new Date(timestamp);
            const pad = (n: number) => String(n).padStart(2, "0");

            heading =
              `${date.getUTCFullYear()}-` +
              `${pad(date.getUTCMonth() + 1)}-` +
              `${pad(date.getUTCDate())} ` +
              `${pad(date.getUTCHours())}:` +
              `${pad(date.getUTCMinutes())}`;
          }

          let html = `<b>${heading}</b><br/>`;

          params.forEach((item: any) => {
            const rawValue = Array.isArray(item.value)
              ? item.value[1]
              : item.value;

            const value =
              typeof rawValue === "number"
                ? rawValue.toFixed(2)
                : rawValue ?? "";

            html += `
              <div style="
                display:flex;
                justify-content:space-between;
                gap:12px;
              ">
                <span>${item.marker} ${item.seriesName}</span>
                <b>${value}</b>
              </div>
            `;
          });

          return html;
        },
      },

      // IMPORTANT:
      // For timestamp data, always use a UTC time axis,
      // even when a category prop is also supplied.
      xAxis: {
        type: hasTimeSeriesData ? "time" : "category",
        useUTC: true,

        ...(hasTimeSeriesData ? {} : { data: category }),

        boundaryGap: hasTimeSeriesData ? false : true,

        ...(typeof xAxisInterval === "number"
          ? { interval: xAxisInterval }
          : {}),

        axisPointer: {
          show: true,
          snap: true,
        },

        axisLine: {
          lineStyle: {
            color: lineColor,
          },
        },

        axisTick: {
          show: true,
          alignWithLabel: true,
        },

        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed",
            color: gridColor,
          },
        },

        axisLabel: {
          color: axisLabelColor,
          fontSize: 12,
          hideOverlap: true,

          formatter: (value: number | string) => {
            if (!hasTimeSeriesData) {
              return String(value).split("-")[0];
            }

            return echarts.time.format(
              Number(value),
              "{HH}:{mm}",
              true
            );
          },
        },
      },

      yAxis: [
        {
          type: "value",
          position: "left",
          splitNumber: isFullscreen ? 10 : 6,

          axisLine: {
            show: true,
            lineStyle: {
              color: lineColor,
              width: 2,
            },
          },

          axisLabel: {
            color: axisLabelColor,
            fontSize: 12,
          },

          splitLine: {
            show: true,
            lineStyle: {
              type: "dashed",
              color: gridColor,
            },
          },
        },

        {
          type: "value",
          position: "right",
          splitNumber: isFullscreen ? 10 : 6,

          axisLine: {
            show: true,
            lineStyle: {
              color: lineColor,
              width: 2,
            },
          },

          axisLabel: {
            color: axisLabelColor,
            fontSize: 12,
          },

          splitLine: {
            show: false,
          },
        },
      ],

      series: normalizedSeries.map((series: any) => ({
        ...series,

        type: series.type === "spline" ? "line" : "bar",
        yAxisIndex: series.yAxis ?? 0,

        smooth: series.type === "spline",
        showSymbol: false,
        connectNulls: true,

        lineStyle:
          series.type === "spline"
            ? {
                width: series.lineWidth ?? 2,
              }
            : undefined,

        itemStyle: {
          color: series.color,
          borderRadius,
        },

        ...(series.type !== "spline"
          ? {
              barWidth,
              barGap,
              barCategoryGap,
              stack: stacked
                ? series.stack || "stack"
                : undefined,
            }
          : {}),

        emphasis: {
          focus: "none",
        },
      })),
    };
  }, [
    apiData,
    category,
    bg,
    legendHeight,
    isDark,
    xAxisInterval,
    axisLabelColor,
    gridColor,
    lineColor,
    tooltipBg,
    tooltipColor,
    legendColor,
    stacked,
    barWidth,
    barGap,
    barCategoryGap,
    borderRadius,
    isFullscreen,
  ]);

  // --------------------------------------------------
  // Export PNG
  // --------------------------------------------------
  const exportPNG = () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    const url = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: bg || "#ffffff",
    });

    const link = document.createElement("a");
    link.href = url;
    link.download = "chart-png.png";
    link.click();
  };

  // --------------------------------------------------
  // Export CSV
  // --------------------------------------------------
  const exportCSV = () => {
    if (!apiData?.length) return;

    const rows: string[] = [];
    const header = ["Category"];

    apiData.forEach((series: any) => {
      header.push(series.name);
    });

    rows.push(header.join(","));

    const len = apiData[0]?.data?.length || 0;

    for (let i = 0; i < len; i++) {
      const row: any[] = [];

      const firstPoint = apiData[0]?.data?.[i];

      if (Array.isArray(firstPoint)) {
        const timestamp = Number(firstPoint[0]);

        row.push(
          Number.isFinite(timestamp)
            ? new Date(timestamp).toISOString()
            : category?.[i] ?? i
        );
      } else {
        row.push(category?.[i] ?? i);
      }

      apiData.forEach((series: any) => {
        let value = series.data?.[i];

        if (Array.isArray(value)) {
          value = value[1];
        }

        row.push(value ?? "");
      });

      rows.push(row.join(","));
    }

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "chart.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------
  // Parent export functions
  // --------------------------------------------------
  useEffect(() => {
    if (!onExportReady) return;

    onExportReady({
      exportPNG,
      exportCSV,
    });
  }, [onExportReady, apiData, bg, category]);

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <ReactECharts
        ref={chartRef}
        echarts={echarts}
        option={option}
        notMerge={false}
        lazyUpdate={true}
        onChartReady={(chart) => {
          pointerFixCleanupRef.current?.();

          const dom = chart.getDom();

          const fixZrScale = (event: MouseEvent) => {
            const rect = dom.getBoundingClientRect();

            if (
              !rect.width ||
              !rect.height ||
              !dom.offsetWidth ||
              !dom.offsetHeight
            ) {
              return;
            }

            const scaleX = dom.offsetWidth / rect.width;
            const scaleY = dom.offsetHeight / rect.height;
            const pointerEvent = event as MouseEvent & {
              zrX?: number;
              zrY?: number;
            };

            pointerEvent.zrX =
              (event.clientX - rect.left) * scaleX;
            pointerEvent.zrY =
              (event.clientY - rect.top) * scaleY;
          };

          dom.addEventListener("mousemove", fixZrScale, true);
          dom.addEventListener("pointermove", fixZrScale, true);

          pointerFixCleanupRef.current = () => {
            dom.removeEventListener("mousemove", fixZrScale, true);
            dom.removeEventListener("pointermove", fixZrScale, true);
          };
        }}
        style={{
          width: "100%",
          height: chartHeight,
        }}
      />
    </div>
  );
};

export default ColumnGraph;
