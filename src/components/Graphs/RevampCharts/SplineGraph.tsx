import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";

import {
  LineChart,
} from "echarts/charts";

import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
  DataZoomComponent,
  ToolboxComponent,
  MarkLineComponent,
} from "echarts/components";

import {
  CanvasRenderer,
} from "echarts/renderers";

import { Box } from "@chakra-ui/react";

import { EnlargeHeight } from "../../../Services/EnlargeWidget";
import type { ExportFunctions } from "../../../types/graphExport/export";
import {
  useStaleContext,
} from "../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  AxisPointerComponent,
  ToolboxComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

interface SplineGraphProps {
  apiData?: any[];
  height?: number | string;
  bg?: string;
  legendHeight?: number;
  xAxisInterval?: number | string;
  props?: any;
  isFullscreen?: boolean;
  onExportReady?: (functions: ExportFunctions) => void;
  inFullScreen?: (mode: boolean) => void;
}

const SplineGraph = forwardRef<any, SplineGraphProps>(
  (
    {
      apiData = [],
      height = 240,
      bg = "transparent",
      legendHeight = 45,
      xAxisInterval,
      props = {},
      isFullscreen = false,
      onExportReady,
      inFullScreen,
    },
    ref
  ) => {

    const chartRef = useRef<ReactECharts>(null);
    const interactionCleanupRef = useRef<(() => void) | null>(null);
    const legendScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      return () => {
        interactionCleanupRef.current?.();
      };
    }, []);

    const [isDark, setIsDark] = useState(false);

    const [selectedSeries, setSelectedSeries] = useState<number | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(
      () => new Set()
    );
    const apiDataRef = useRef<any[]>([]);

    const { setMissingPoints } = useStaleContext();

    useEffect(() => {
      const missing: {
        ts: number;
        seriesName?: string;
      }[] = [];

      (apiData || []).forEach((series: any) => {
        const points = Array.isArray(series?.data)
          ? series.data
              .filter(
                (point: any) =>
                  Array.isArray(point) &&
                  Number.isFinite(Number(point[0]))
              )
              .sort((a: any, b: any) => Number(a[0]) - Number(b[0]))
          : [];

        for (let i = 0; i < points.length; i++) {
          const ts = Number(points[i]?.[0]);
          const value = points[i]?.[1];

          if (
            Number.isFinite(ts) &&
            (value === null || value === undefined)
          ) {
            missing.push({
              ts,
              seriesName: series.name,
            });
          }

          if (i > 0) {
            const prevTs = Number(points[i - 1]?.[0]);

            if (Number.isFinite(prevTs) && Number.isFinite(ts)) {
              const gap = ts - prevTs;

              if (gap > 60000) {
                for (
                  let missingTs = prevTs + 60000;
                  missingTs < ts;
                  missingTs += 60000
                ) {
                  missing.push({
                    ts: missingTs,
                    seriesName: series.name,
                  });
                }
              }
            }
          }
        }
      });

      setMissingPoints(missing);
    }, [apiData, setMissingPoints]);

    useEffect(() => {
      apiDataRef.current = apiData || [];
    }, [apiData]);

    useEffect(() => {
      const seriesNames = new Set((apiData || []).map((series: any) => series.name));
      setHiddenSeries((currentHidden) => {
        const nextHidden = new Set(
          [...currentHidden].filter((name) => seriesNames.has(name))
        );

        return nextHidden.size === currentHidden.size
          ? currentHidden
          : nextHidden;
      });
    }, [apiData]);

    useEffect(() => {
      const detectTheme = () => {
        // detectTheme
        setIsDark(
          localStorage.getItem("chakra-ui-color-mode") === "dark"
        );
      };

      detectTheme();

      window.addEventListener("storage", detectTheme);

      return () => {
        // cleanup Effect 1
        window.removeEventListener("storage", detectTheme);
      };
    }, []);

    useEffect(() => {
      inFullScreen?.(isFullscreen);
      const handleResize = () => {
        chartRef.current?.getEchartsInstance()?.resize();
      };
      requestAnimationFrame(handleResize);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [height, isFullscreen]);

    const axisColor = isDark ? "#E6E6E6" : "#1A202C";

    const gridColor = isDark
      ? "rgba(255,255,255,.08)"
      : "rgba(0,0,0,.10)";

    const lineColor = isDark
      ? "rgba(255,255,255,.06)"
      : "rgba(0,0,0,.16)";

    const tooltipBg = isDark
      ? "rgba(24,24,27,.95)"
      : "#ffffff";

    /* ----------  ECHARTS ADAPTER ---------- */

    const option = useMemo(() => {

      const xAxisProps = props?.xAxis || {};
      const plotBands = xAxisProps.plotBands || [];
      const yAxisProps = Array.isArray(props?.yAxis)
        ? props.yAxis
        : [props?.yAxis || {}];
      const tooltipProps = props?.tooltip || {};
      const minimumLeftSpacing = 10;
      const gridLeft = Math.max(
        Number(props?.chart?.spacingLeft ?? minimumLeftSpacing),
        minimumLeftSpacing
      );

      return {

        backgroundColor: bg,

        animation: false,

        grid: {
          top: props?.chart?.spacingTop ?? 20,
          left: gridLeft,
          right: props?.chart?.spacingRight ?? 20,
          bottom: props?.chart?.spacingBottom ?? (legendHeight + 5),

          containLabel: true,
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
          show: false,
        },

        tooltip: {
          trigger: "axis",

          confine: true,

          appendToBody: false,

          transitionDuration: 0.2,

          backgroundColor:
            tooltipProps.backgroundColor || tooltipBg,

          borderWidth: 1,

          padding: [6, 8],

          textStyle: {
            color: tooltipProps.style?.color || axisColor,
            fontSize: 11,
            lineHeight: 16,
          },

          extraCssText: `
    z-index:999999;
    font-size:11px;
    line-height:16px;
    padding:6px 8px;
    min-width:140px;
    max-width:220px;
    pointer-events:none;
    border-radius:6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `,

          axisPointer: {
            type: "line",
            snap: true,
            lineStyle: {
              type: "dashed",
              width: 1,
              color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
            },
          },
          formatter: (params: any) => {
            if (!Array.isArray(params) || !params.length) return "";

            if (typeof tooltipProps.formatter === "function") {
              const context = {
                x: params[0].value[0],
                points: params.map((item: any) => ({
                  color: item.color,
                  y: Array.isArray(item.value) ? item.value[1] : item.value,
                  series: { name: item.seriesName },
                })),
              };
              return tooltipProps.formatter.call(context);
            }

            const ts = params[0].value[0];

            const date = new Date(ts);

            const pad = (n: number) => String(n).padStart(2, "0");

            const time =
              `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
              `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

            let html = `<b>${time}</b><br/>`;
            const valueSuffix = tooltipProps.valueSuffix || "";

            params.forEach((item: any) => {
              const rawValue = item.value?.[1];
              const value =
                typeof rawValue === "number"
                  ? `${rawValue.toFixed(2)}${valueSuffix}`
                  : rawValue;

              html += `
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <span>${item.marker} ${item.seriesName}</span>
          <b>${value}</b>
        </div>
      `;
            });

            return html;
          },
        },

        xAxis: {
          type: "time",
          useUTC: true,

          min: xAxisProps.min,

          max: xAxisProps.max,

          interval: xAxisProps.tickInterval ?? xAxisInterval,
          minInterval: xAxisProps.minInterval,
          maxInterval: xAxisProps.maxInterval,

          axisLabel: {
            color:
              xAxisProps.labels?.style?.color || axisColor,
            formatter: (value: number) => {
              return echarts.time.format(value, "{HH}:{mm}", true);
            },
          },

          axisLine: {
            lineStyle: {
              color:
                xAxisProps.lineColor || lineColor
            }
          },

          splitLine: {
            show: true,

            lineStyle: {
              color:
                xAxisProps.gridLineColor || gridColor,

              type: "dashed"
            }
          }
        },

        yAxis: yAxisProps.map((axis: any) => ({
          type: "value",

          min: axis.min,
          max: axis.max,
          interval: axis.tickInterval,

          position: axis.opposite ? "right" : "left",

          name: axis.title?.text,

          nameLocation: "middle",
          nameGap: 34,

          axisLabel: {
            color: axis.labels?.style?.color || axisColor,
            margin: 6,
            formatter: (v: any) => {
              if (typeof axis.labels?.formatter === "function") {
                return axis.labels.formatter.call({ value: v });
              }
              return v;
            },
          },

          axisLine: {
            show: true,
            lineStyle: {
              color: axis.lineColor || lineColor,
            },
          },

          splitLine: {
            show: !axis.opposite,
            lineStyle: {
              color: axis.gridLineColor || gridColor,
              type: "dashed",
            },
          },
        })),
        series: (apiData || []).map((series: any, index: number) => ({

          name: series.name,

          type: "line",

          smooth: true,

          showSymbol: false,

          symbol: "circle",

          symbolSize: 6,

          sampling: "lttb",

          progressive: 5000,

          progressiveThreshold: 10000,

          animation: false,

          connectNulls: true,

          emphasis: {
            focus: "series"
          },

          blur: {
            lineStyle: {
              opacity: .2
            }
          },

          lineStyle: {
            color: series.color,
            width: 2,
            opacity:
              selectedSeries === null
                ? 1
                : selectedSeries === index
                  ? 1
                  : .2
          },

          itemStyle: {
            color: series.color
          },

          yAxisIndex: series.yAxis ?? 0,
          data: series.data,
          markArea:
            index === 0 && plotBands.length
              ? {
                silent: true,
                data: plotBands.map((band: any) => [
                  {
                    xAxis: band.from,
                    name: band.label?.text,
                    label: {
                      show: true,
                      formatter: band.label?.text,
                      position: "insideTop",
                      color: band.label?.style?.color,
                      fontWeight: "bold",
                    },
                    itemStyle: {
                      color: band.color,
                    },
                  },
                  {
                    xAxis: band.to,
                  },
                ]),
              }
              : undefined,

        }))

      };

    }, [
      apiData,
      props,
      selectedSeries,
      isDark,
      height,
      legendHeight,
      isFullscreen
    ]);

    const handleResetZoom = () => {
      const chart = chartRef.current?.getEchartsInstance();

      if (!chart) return;

      chart.dispatchAction({
        type: "dataZoom",
        dataZoomIndex: 0,
        xAxisIndex: 0,
        start: 0,
        end: 100,
      });

      setIsZoomed(false);
    };

    const scrollLegend = (direction: "left" | "right") => {
      legendScrollRef.current?.scrollBy({
        left: direction === "left" ? -250 : 250,
        behavior: "smooth",
      });
    };

    /* ------------------- EVENTS ------------------- */

    useEffect(() => {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) {
        return;
      }
      const mouseOver = (params: any) => {
        // mouseover
        if (params.componentType !== "series") return;
        setSelectedSeries(params.seriesIndex);
      };
      const globalOut = () => {
        // globalOut
        setSelectedSeries(null);
      };
      chart.on("mouseover", mouseOver);
      chart.getZr().on("globalout", globalOut);
      return () => {
        if (chart.isDisposed()) return;
        chart.off("mouseover", mouseOver);
        chart.getZr()?.off("globalout", globalOut);
      };
    }, [apiData]);

    /* ------------------- EXPORT ------------------- */
    // Export registration moved to onChartReady to avoid repeated ref updates

    return (
      <Box position="relative" width="100%" height="100%">

        {isZoomed && (
          <Box
            position="absolute"
            top="8px"
            right="42px"
            zIndex={20}
            background={bg}
            border="1px solid"
            borderColor={isDark ? "#555" : "#D1D5DB"}
            borderRadius="4px"
            padding="4px 8px"
            fontSize="11px"
            fontWeight="600"
            color={axisColor}
            cursor="pointer"
            onClick={handleResetZoom}
            _hover={{
              background: isDark ? "#2D3748" : "#EDF2F7",
            }}
          >
            Reset Zoom
          </Box>
        )}

        {/* <Button
      size="xs"
      variant="ghost"
      position="absolute"
      left={`${legendOffset}px`}
      bottom={`-${buttonOffset}px`}
      zIndex={10}
      onClick={handleShowAll}
      isDisabled={!areAllHidden}
      sx={{
        mb: `${legendHeight}px`
      }}
    >
      Show all
    </Button>

    <Button
      size="xs"
      variant="ghost"
      position="absolute"
      right={`${legendOffset}px`}
      bottom={`-${buttonOffset}px`}
      zIndex={10}
      onClick={handleHideAll}
      isDisabled={areAllHidden}
      sx={{
        mb: `${legendHeight}px`
      }}
    >
      Hide all
    </Button> */}

        <ReactECharts
          ref={chartRef}
          echarts={echarts}
          option={option}
          notMerge={false}
          lazyUpdate={false}
          style={{
            width: "100%",
            height: isFullscreen
              ? EnlargeHeight(770)
              : Number(height)
          }}
          onChartReady={(chart) => {
            if (typeof ref === "function") {
              ref(chart);
            } else if (ref) {
              (ref as any).current = chart;
            }

            if (onExportReady) {
              onExportReady({
                exportPNG: () => {
                  const url = chart.getDataURL({
                    type: "png",
                    pixelRatio: 2,
                    backgroundColor: "#fff",
                  });
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "chart.png";
                  a.click();
                },
                exportCSV: () => {
                  const currentData = apiDataRef.current || [];

                  if (!currentData.length) {
                    return;
                  }

                  let csv = "Timestamp";

                  currentData.forEach((series: any) => {
                    csv += `,${series.name || "Series"}`;
                  });

                  csv += "\n";

                  const maxRows = Math.max(
                    ...currentData.map((series: any) =>
                      Array.isArray(series.data) ? series.data.length : 0
                    ),
                    0
                  );

                  for (let i = 0; i < maxRows; i++) {
                    const timestamp = currentData
                      .map((series: any) => series.data?.[i]?.[0])
                      .find((ts: any) => ts !== null && ts !== undefined);

                    let row = "";

                    if (timestamp !== undefined) {
                      const utcDate = new Date(timestamp);

                      const pad = (n: number) => String(n).padStart(2, "0");

                      const utcTime =
                        `${pad(utcDate.getUTCDate())}/${pad(utcDate.getUTCMonth() + 1)}/${utcDate.getUTCFullYear()} ` +
                        `${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}:${pad(utcDate.getUTCSeconds())}`;

                      row += `"${utcTime}"`;
                    } else {
                      row += "";
                    }

                    currentData.forEach((series: any) => {
                      const value = series.data?.[i]?.[1];

                      row += ",";

                      if (value !== null && value !== undefined && value !== "") {
                        row += `"${value}"`;
                      }
                    });

                    csv += row + "\n";
                  }

                  const blob = new Blob(
                    [csv],
                    { type: "text/csv;charset=utf-8;" }
                  );

                  const url = URL.createObjectURL(blob);

                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "PCS-Power.csv";

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  URL.revokeObjectURL(url);
                },
              });
            }

            requestAnimationFrame(() => {
              if (!chart.isDisposed()) {
                chart.resize();
              }

              const dom = chart.getDom();

              const fixZrScale = (e: MouseEvent) => {
                const rect = dom.getBoundingClientRect();
                if (!rect.width || !rect.height || !dom.offsetWidth || !dom.offsetHeight) return;
                const scaleX = dom.offsetWidth / rect.width;
                const scaleY = dom.offsetHeight / rect.height;
                (e as any).zrX = (e.clientX - rect.left) * scaleX;
                (e as any).zrY = (e.clientY - rect.top) * scaleY;
              };

              dom.addEventListener("mousemove", fixZrScale, { capture: true });
              dom.addEventListener("pointermove", fixZrScale, { capture: true });

              let isZooming = false;
              let zoomStartX = 0;
              let zoomEndX = 0;

              const zoomBox = document.createElement("div");

              zoomBox.style.position = "absolute";
              zoomBox.style.display = "none";
              zoomBox.style.pointerEvents = "none";
              zoomBox.style.background = "rgba(0, 180, 0, 0.25)";
              zoomBox.style.border = "2px solid #00a000";
              zoomBox.style.zIndex = "9999";

              dom.style.position = "relative";
              dom.appendChild(zoomBox);

              const getZoomPoint = (event: MouseEvent) => {
                const rect = dom.getBoundingClientRect();

                const scaleX = dom.offsetWidth / rect.width;
                const scaleY = dom.offsetHeight / rect.height;

                return {
                  x: (event.clientX - rect.left) * scaleX,
                  y: (event.clientY - rect.top) * scaleY,
                };
              };

              const getGridRect = () => {
                return chart
                  .getModel()
                  .getComponent("grid", 0)
                  .coordinateSystem
                  .getRect();
              };

              const handleZoomMouseDown = (event: MouseEvent) => {
                if (event.button !== 0) return;

                const point = getZoomPoint(event);
                const grid = getGridRect();

                if (
                  point.x < grid.x ||
                  point.x > grid.x + grid.width ||
                  point.y < grid.y ||
                  point.y > grid.y + grid.height
                ) {
                  return;
                }

                isZooming = true;
                zoomStartX = point.x;
                zoomEndX = point.x;

                zoomBox.style.display = "block";
                zoomBox.style.left = `${point.x}px`;
                zoomBox.style.top = `${grid.y}px`;
                zoomBox.style.width = "0px";
                zoomBox.style.height = `${grid.height}px`;
              };

              const handleZoomMouseMove = (event: MouseEvent) => {
                if (!isZooming) return;

                const point = getZoomPoint(event);
                const grid = getGridRect();

                zoomEndX = Math.max(
                  grid.x,
                  Math.min(point.x, grid.x + grid.width)
                );

                const left = Math.min(zoomStartX, zoomEndX);
                const width = Math.abs(zoomEndX - zoomStartX);

                zoomBox.style.left = `${left}px`;
                zoomBox.style.top = `${grid.y}px`;
                zoomBox.style.width = `${width}px`;
                zoomBox.style.height = `${grid.height}px`;
              };

              const handleZoomMouseUp = () => {
                if (!isZooming) return;

                const grid = getGridRect();

                const left = Math.min(zoomStartX, zoomEndX);
                const right = Math.max(zoomStartX, zoomEndX);

                zoomBox.style.display = "none";
                isZooming = false;

                if (right - left <= 3) return;

                const xAxisModel = chart
                  .getModel()
                  .getComponent("xAxis", 0);

                const axisExtent = xAxisModel.axis.scale.getExtent();

                const axisMin = Number(axisExtent[0]);
                const axisMax = Number(axisExtent[1]);

                const startRatio = Math.max(
                  0,
                  Math.min(1, (left - grid.x) / grid.width)
                );

                const endRatio = Math.max(
                  0,
                  Math.min(1, (right - grid.x) / grid.width)
                );

                const startValue =
                  axisMin + (axisMax - axisMin) * startRatio;

                const endValue =
                  axisMin + (axisMax - axisMin) * endRatio;

                chart.dispatchAction({
                  type: "dataZoom",
                  dataZoomIndex: 0,
                  xAxisIndex: 0,
                  startValue: Math.min(startValue, endValue),
                  endValue: Math.max(startValue, endValue),
                });

                setIsZoomed(true);
              };

              dom.addEventListener(
                "mousedown",
                handleZoomMouseDown
              );

              window.addEventListener(
                "mousemove",
                handleZoomMouseMove
              );

              window.addEventListener(
                "mouseup",
                handleZoomMouseUp
              );

              interactionCleanupRef.current?.();

              interactionCleanupRef.current = () => {
                if (chart.isDisposed()) return;

                dom.removeEventListener("mousemove", fixZrScale, { capture: true });
                dom.removeEventListener("pointermove", fixZrScale, { capture: true });

                dom.removeEventListener(
                  "mousedown",
                  handleZoomMouseDown
                );

                window.removeEventListener(
                  "mousemove",
                  handleZoomMouseMove
                );

                window.removeEventListener(
                  "mouseup",
                  handleZoomMouseUp
                );

                zoomBox.remove();
              };
            });
          }}
        />

        {/* HTML LEGEND — CHART KE BAHAR, SINGLE HORIZONTAL ROW */}
        <Box
          position="relative"
          width="100%"
          height={`${legendHeight}px`}
          background={bg}
          zIndex={2}
          transform="translateY(-38px)"
        >
          {/* LEFT ARROW */}
          <Box
            position="absolute"
            left="2px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={5}
            width="22px"
            height="22px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="50%"
            background={isDark ? "#2D3748" : "#EDF2F7"}
            cursor="pointer"
            onClick={() => scrollLegend("left")}
            fontSize="16px"
            fontWeight="600"
          >
            ‹
          </Box>

          {/* LEGEND SCROLL AREA */}
          <Box
            ref={legendScrollRef}
            width="100%"
            height="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflowX="hidden"
            overflowY="hidden"
            padding="0 28px"
            gap="12px"
            sx={{
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {apiData.map((series: any) => (
              <Box
                key={series.name}
                flex="0 0 auto"
                display="flex"
                alignItems="center"
                gap="5px"
                cursor="pointer"
                opacity={hiddenSeries.has(series.name) ? 0.45 : 1}
                fontSize="11px"
                color={axisColor}
                onClick={() => {
                  chartRef.current
                    ?.getEchartsInstance()
                    ?.dispatchAction({
                      type: "legendToggleSelect",
                      name: series.name,
                    });

                  setHiddenSeries((currentHidden) => {
                    const nextHidden = new Set(currentHidden);

                    if (nextHidden.has(series.name)) {
                      nextHidden.delete(series.name);
                    } else {
                      nextHidden.add(series.name);
                    }

                    return nextHidden;
                  });
                }}
              >
                <Box
                  width="18px"
                  height="3px"
                  flex="0 0 auto"
                  borderRadius="0"
                  background={series.color}
                />

                <Box
                  as="span"
                  whiteSpace="nowrap"
                  color={
                    hiddenSeries.has(series.name)
                      ? "gray.500"
                      : series.color
                  }
                  textDecoration={
                    hiddenSeries.has(series.name)
                      ? "line-through"
                      : "none"
                  }
                >
                  {series.name}
                </Box>
              </Box>
            ))}
          </Box>

          {/* RIGHT ARROW */}
          <Box
            position="absolute"
            right="2px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={5}
            width="22px"
            height="22px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            borderRadius="50%"
            background={isDark ? "#2D3748" : "#EDF2F7"}
            cursor="pointer"
            onClick={() => scrollLegend("right")}
            fontSize="16px"
            fontWeight="600"
          >
            ›
          </Box>
        </Box>

      </Box>
    );

  });

SplineGraph.displayName = "SplineGraph";

export default React.memo(SplineGraph);