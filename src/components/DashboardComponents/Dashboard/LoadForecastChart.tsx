import { useEffect, useMemo, useState } from "react";

import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";

import GraphLayout from "../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import ColumnGraphNew from "../../Graphs/RevampCharts/ColumnGraphNew";

import type { ExportFunctions } from "../../../types/graphExport/export";

type ForecastItem = {
  forecast_load_kw: number;
  timestamp: string;
};

type ScheduleItem = {
  id: number;
  start_ts: string;
  end_ts: string | null;
  power: number | null;
  type: string;
  duration: string | null;
};

type ApiResponse = {
  forecast?: ForecastItem[];
  schedule?: ScheduleItem[];
  status?: string;
};

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE as string | undefined) || ""
)
  .replace(/^['"]+|['"]+$/g, "")
  .replace(/\/$/, "");

const LoadForecastChart = () => {
  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);

  // =========================================================
  // TODAY
  // =========================================================

  const getToday = (): string => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // Default date = today
  const [selectedDate, setSelectedDate] =
    useState<string>(getToday());

  // =========================================================
  // API DATA
  // =========================================================

  const [apiData, setApiData] =
    useState<ApiResponse>({
      forecast: [],
      schedule: [],
    });

  const [loading, setLoading] =
    useState(false);

  // =========================================================
  // FULLSCREEN STATE
  // =========================================================

  const [isFullScreen, setIsFullScreen] =
    useState(false);

  const [screenHeight, setScreenHeight] =
    useState(
      typeof window !== "undefined"
        ? window.innerHeight
        : 700
    );

  // =========================================================
  // FULLSCREEN + RESIZE LISTENER
  // =========================================================

  useEffect(() => {
    const handleFullScreen = () => {
      setIsFullScreen(
        !!document.fullscreenElement
      );

      setScreenHeight(
        window.innerHeight
      );
    };

    const handleResize = () => {
      setScreenHeight(
        window.innerHeight
      );
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullScreen
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullScreen
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =========================================================
  // FETCH LOAD + SCHEDULE API
  // =========================================================

  useEffect(() => {
    const fetchLoadAndSchedule =
      async () => {
        try {
          setLoading(true);

          const url =
            `${API_BASE_URL}/api/load-and-schedule?date=${selectedDate}`;

          console.log(
            "Load Schedule API:",
            url
          );

          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              `API failed: ${response.status} ${response.statusText}`
            );
          }

          const data: ApiResponse =
            await response.json();

          console.log(
            "Load Schedule API Response:",
            data
          );

          setApiData({
            forecast:
              data.forecast || [],

            schedule:
              data.schedule || [],

            status:
              data.status,
          });
        } catch (error) {
          console.error(
            "Failed to fetch load and schedule:",
            error
          );

          setApiData({
            forecast: [],
            schedule: [],
          });
        } finally {
          setLoading(false);
        }
      };

    fetchLoadAndSchedule();
  }, [selectedDate]);

  // =========================================================
  // DATE NAVIGATION
  // =========================================================

  const changeDate = (days: number) => {
    const date = new Date(
      `${selectedDate}T00:00:00`
    );

    date.setDate(
      date.getDate() + days
    );

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    setSelectedDate(
      `${year}-${month}-${day}`
    );
  };

  // =========================================================
  // DISPLAY DATE
  // =========================================================

  const formattedSelectedDate =
    useMemo(() => {
      const date = new Date(
        `${selectedDate}T00:00:00`
      );

      return date.toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    }, [selectedDate]);

  // =========================================================
  // 15-MINUTE CATEGORIES
  // =========================================================

  const categories = useMemo(() => {
    return Array.from(
      { length: 97 },
      (_, interval) => {
        const date = new Date(
          `${selectedDate}T00:00:00`
        );

        date.setHours(
          0,
          interval * 15,
          0,
          0
        );

        return date.toLocaleTimeString(
          "en-GB",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }
        );
      }
    );
  }, [selectedDate]);

  // =========================================================
  // LOAD FORECAST
  // =========================================================

  const forecastQuarterHourlyData =
    useMemo(() => {
      const intervalValues: number[][] =
        Array.from(
          { length: 96 },
          () => []
        );

      (
        apiData.forecast || []
      ).forEach((item) => {
        if (
          item.forecast_load_kw ===
            null ||
          item.forecast_load_kw ===
            undefined ||
          !item.timestamp
        ) {
          return;
        }

        const normalizedTimestamp =
          item.timestamp.replace(
            " ",
            "T"
          );

        const date = new Date(
          normalizedTimestamp
        );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }

        const interval =
          date.getHours() * 4 +
          Math.floor(date.getMinutes() / 15);

        if (
          interval >= 0 &&
          interval < 96
        ) {
          intervalValues[
            interval
          ].push(
            Number(
              item.forecast_load_kw
            )
          );
        }
      });

      const result: (
        | number
        | null
      )[] = Array(97).fill(null);

      intervalValues.forEach(
        (values, interval) => {
          if (!values.length) {
            return;
          }

          const average =
            values.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / values.length;

          result[interval] =
            Number(
              average.toFixed(2)
            );
        }
      );

      if (result[95] !== null) {
        result[96] = result[95];
      }

      return result;
    }, [apiData.forecast]);

  // =========================================================
  // BESS SCHEDULE
  // =========================================================

  const bessScheduleData =
    useMemo(() => {
      const values: (
        | number
        | null
      )[] = Array(97).fill(
        null
      );

      (
        apiData.schedule || []
      ).forEach((item) => {
        if (
          !item.start_ts ||
          item.power === null ||
          item.power === undefined
        ) {
          return;
        }

        const type =
          String(
            item.type || ""
          ).toLowerCase();

        // Only Charge / Discharge
        if (
          type !== "charge" &&
          type !== "discharge"
        ) {
          return;
        }

        const startDate =
          new Date(
            item.start_ts
          );

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          return;
        }

        const interval =
          startDate.getHours() * 4 +
          Math.floor(startDate.getMinutes() / 15);

        if (
          interval < 0 ||
          interval > 95
        ) {
          return;
        }

        let power =
          Number(item.power);

        if (
          Number.isNaN(power)
        ) {
          return;
        }

        // Charge = positive
        if (
          type === "charge"
        ) {
          power =
            Math.abs(power);
        }

        // Discharge = negative
        if (
          type === "discharge"
        ) {
          power =
            -Math.abs(power);
        }

        // Combine schedules that start in the same 15-minute interval.
        if (
          values[interval] ===
          null
        ) {
          values[interval] =
            power;
        } else {
          values[interval] =
            Number(
              values[interval]
            ) + power;
        }
      });

      return values;
    }, [apiData.schedule]);

  // =========================================================
  // CHART SERIES
  // =========================================================

  const series = useMemo(() => {
    return [
      {
        type: "spline",

        name: "Load Forecast",

        color: "#3B82F6",

        marker: {
          enabled: false,
        },

        data:
          forecastQuarterHourlyData,
      },

      {
        type: "column",

        name: "BESS Schedule",

        color: "#22C55E",

        data:
          bessScheduleData,
      },
    ];
  }, [
    forecastQuarterHourlyData,
    bessScheduleData,
  ]);

  // =========================================================
  // DYNAMIC CHART HEIGHT
  // =========================================================
  //
  // Normal:
  //   210px
  //
  // Fullscreen:
  //   Almost complete viewport height
  // =========================================================

  const chartHeight = isFullScreen
    ? Math.max(
        screenHeight - 90,
        400
      )
    : 240;

  // =========================================================
  // TITLE
  // =========================================================

  const titleContent = (
    <Flex
      width="100%"
      align="center"
      gap={2}
      minW={0}
    >
      {/* TITLE */}

      <Text
        fontSize="16px"
        fontWeight="600"
        lineHeight="1"
        whiteSpace="nowrap"
      >
        24-Hour Load Forecast
      </Text>

      {/* DATE CONTROLS */}

      <Flex
        align="center"
        gap={1}
        ml={1}
      >
        {/* PREVIOUS */}

        <IconButton
          aria-label="Previous date"
          icon={
            <ChevronLeftIcon
              boxSize={4}
            />
          }
          size="xs"
          variant="ghost"
          onClick={() =>
            changeDate(-1)
          }
        />

        {/* SELECTED DATE */}

        <Text
          fontSize="12px"
          fontWeight="600"
          minW="92px"
          textAlign="center"
          whiteSpace="nowrap"
        >
          {formattedSelectedDate}
        </Text>

        {/* NEXT */}

        <IconButton
          aria-label="Next date"
          icon={
            <ChevronRightIcon
              boxSize={4}
            />
          }
          size="xs"
          variant="ghost"
          onClick={() =>
            changeDate(1)
          }
        />

        {/* DATE PICKER */}

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => {
            setSelectedDate(
              event.target.value
            );
          }}
          style={{
            height: "26px",
            width: "118px",
            padding: "2px 6px",
            marginLeft: "3px",
            border:
              "1px solid #CBD5E0",
            borderRadius: "5px",
            fontSize: "12px",
            background: "white",
          }}
        />
      </Flex>
    </Flex>
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <GraphLayout
      title={titleContent}
      width={["820px"]}
      height="315px"
      fullScreen
      onExport={exportFunctions}
    >
      <Box
        h={
          isFullScreen
            ? "calc(100vh - 50px)"
            : "100%"
        }
        minW={0}
        position="relative"
        overflow="hidden"
      >
        {loading ? (
          <Flex
            h="100%"
            align="center"
            justify="center"
            fontSize="13px"
            color="gray.500"
          >
            Loading...
          </Flex>
        ) : (
          <Box
            width="100%"
            height={
              isFullScreen
                ? `${chartHeight}px`
                : "100%"
            }
          >
            <ColumnGraphNew
              apiData={series}
              category={categories}
              height={chartHeight}
              barWidth={14}
              barCategoryGap="15%"
              borderRadius={4}
              legendHeight={40}
              onExportReady={
                setExportFunctions
              }
            />
          </Box>
        )}
      </Box>
    </GraphLayout>
  );
};

export default LoadForecastChart;