import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Badge,
  Button,
  IconButton,
  Progress,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
} from "@chakra-ui/react";

import {
  FiCalendar,
  FiFileText,
  FiSun,
  FiZap,
  FiArrowUp,
  FiArrowDown,
  FiBattery,
  FiRefreshCw,
  FiGrid,
  FiAlertCircle,
  FiPlay,
  FiSquare,
} from "react-icons/fi";

import { ExpandIcon, SqeezIcon } from "../../../assets/Icons";

/* =========================================================
   API URL
========================================================= */

const getEmsScheduleUrl = (): string => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE;
    const port = import.meta.env.VITE_API_PORT;

    if (!baseUrl) {
      console.error("VITE_API_BASE is not defined");
      return "/api/ems-schedule";
    }

    const url = new URL(baseUrl);

    if (port) {
      url.port = String(port);
    }

    url.pathname = "/api/ems-schedule";
    url.search = "";

    return url.toString();
  } catch (error) {
    console.error("Failed to construct EMS API URL:", error);
    return "/api/ems-schedule";
  }
};

const EMS_SCHEDULE_API = getEmsScheduleUrl();

console.log("EMS Schedule API:", EMS_SCHEDULE_API);

const getControlApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_BASE;

  if (!baseUrl) {
    console.error("VITE_API_BASE is not defined");
    return path;
  }

  try {
    const port = import.meta.env.VITE_API_PORT;

    const url = new URL(baseUrl);

    if (port) {
      url.port = String(port);
    }

    url.pathname = path;
    url.search = "";

    return url.toString();
  } catch (error) {
    console.error("Failed to construct EMS control API URL:", error);
    return path;
  }
};

const EXECUTE_API = getControlApiUrl(
  "/api/twin_schedule_exec"
);

const STOP_API = getControlApiUrl(
  "/api/twin_schedule_stop"
);

/* =========================================================
   TYPES
========================================================= */

interface ScheduleItem {
  time: string;
  timeStamp: string;
  eventId: string;
  eventNumber: number | null;
  load: number;
  pv: number;
  tariff: number;
  state: string;
  decision: string;
  charge: number;
  discharge: number;
  grid: number;
  soc: number;
  battery: number;
  throughput: number;
  description: string;
}

interface ApiSchedule {
  time_stamp?: string | null;
  load_kw?: number | string | null;
  pv_kw?: number | string | null;
  tariff_per_kw?: number | string | null;
  load_state?: string | null;
  decision?: string | null;
  charge_kw?: number | string | null;
  grid_charge_kw?: number | string | null;
  discharge_kw?: number | string | null;
  grid_import_kw?: number | string | null;
  soc_percent?: number | string | null;
  battery_energy_mwh?: number | string | null;
  throughput_cycles?: number | string | null;
  description?: string | null;

  // API may return true / false / 1 / 0 / "true" / "false"
  is_pass?: boolean | number | string | null;
  event_id?: string | null;
  event_number?: number | string | null;
}

interface EMScheduleResponse {
  success?: boolean;
  count?: number;
  schedule?: ApiSchedule[];
  message?: string;
  error?: string;
}

interface ControlApiResponse {
  success?: boolean;
  message?: string;
}

/* =========================================================
   HELPERS
========================================================= */

const toNumber = (
  value: unknown,
  fallback = 0
): number => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const num = Number(value);

  return Number.isFinite(num) ? num : fallback;
};

const toStringValue = (
  value: unknown,
  fallback = "--"
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const stringValue = String(value).trim();

  return stringValue || fallback;
};

const isPassedSchedule = (
  value: unknown
): boolean => {
  if (value === true) return true;

  if (value === 1) return true;

  if (
    typeof value === "string" &&
    ["true", "1", "yes", "pass", "passed"].includes(
      value.trim().toLowerCase()
    )
  ) {
    return true;
  }

  return false;
};

const formatTime = (
  timestamp?: string | null
): string => {
  if (!timestamp) return "--";

  const value = String(timestamp).trim();

  // Handles:
  // 2026-10-08 12:30:00
  // 2026-10-08T12:30:00
  // 12:30:00

  const match = value.match(
    /(?:T|\s)(\d{2}):(\d{2})/
  );

  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return value.substring(0, 5) || "--";
};

const formatDate = (
  timestamp?: string | null
): string => {
  if (!timestamp) return "--";

  const value = String(timestamp).trim();

  const match = value.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (!match) {
    return "--";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!year || !month || !day) {
    return "--";
  }

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return `${day} ${date.toLocaleString("en-US", {
    month: "short",
  })} ${year}`;
};

const mapApiSchedule = (
  item: ApiSchedule
): ScheduleItem => ({
  time: formatTime(item.time_stamp),

  timeStamp: toStringValue(
    item.time_stamp,
    ""
  ),

  eventId: toStringValue(
    item.event_id,
    "--"
  ),

  eventNumber:
    item.event_number !== null &&
    item.event_number !== undefined &&
    item.event_number !== "" &&
    Number.isInteger(Number(item.event_number))
      ? Number(item.event_number)
      : null,

  load: toNumber(item.load_kw),

  pv: toNumber(item.pv_kw),

  tariff: toNumber(item.tariff_per_kw),

  state: toStringValue(
    item.load_state
  ),

  decision: toStringValue(
    item.decision
  ),

  charge: toNumber(item.grid_charge_kw),

  discharge: toNumber(
    item.discharge_kw
  ),

  grid: toNumber(
    item.grid_import_kw
  ),

  soc: toNumber(
    item.soc_percent
  ),

  battery: toNumber(
    item.battery_energy_mwh
  ),

  throughput: toNumber(
    item.throughput_cycles
  ),

  description: toStringValue(
    item.description
  ),
});

/* =========================================================
   COMPONENT
========================================================= */

const NextDaySchedule: React.FC = () => {
  const widgetRef =
    useRef<HTMLDivElement>(null);

  const [schedules, setSchedules] =
    useState<ScheduleItem[]>([]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [executingScheduleKey, setExecutingScheduleKey] =
    useState<string | null>(null);

  const [executionLoading, setExecutionLoading] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* =========================================================
     FETCH SCHEDULE
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchSchedule = async () => {
      setError(null);

      try {
        console.log(
          "Fetching EMS schedule:",
          EMS_SCHEDULE_API
        );

        const response = await fetch(
          `${EMS_SCHEDULE_API}?_t=${Date.now()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        console.log(
          "EMS response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `API failed with status ${response.status}`
          );
        }

        const result: EMScheduleResponse =
          await response.json();

        console.log(
          "EMS API response:",
          result
        );

        if (!result) {
          throw new Error(
            "Empty API response"
          );
        }

        if (
          result.success === false
        ) {
          throw new Error(
            result.message ||
              result.error ||
              "EMS schedule API failed"
          );
        }

        const rawSchedule =
          Array.isArray(result.schedule)
            ? result.schedule
            : [];

        console.log(
          "Raw schedule length:",
          rawSchedule.length
        );

        /*
         * IMPORTANT:
         *
         * Do NOT blindly use:
         *
         * .filter(item => item.is_pass === true)
         *
         * because backend may send:
         *
         * 1
         * "1"
         * "true"
         * true
         */

        const passedSchedules =
          rawSchedule.filter((item) =>
            isPassedSchedule(
              item?.is_pass
            )
          );

        /*
         * If is_pass isn't supplied by the API,
         * don't make the entire UI disappear.
         */
        const finalSchedule =
          passedSchedules.length > 0
            ? passedSchedules
            : rawSchedule;

        const mappedSchedules =
          finalSchedule
            .filter(Boolean)
            .map(mapApiSchedule);

        console.log(
          "Mapped schedules:",
          mappedSchedules
        );

        if (!mounted) return;

        setSchedules(mappedSchedules);
        setSelectedIndex((current) =>
          mappedSchedules.length === 0
            ? 0
            : Math.min(
                current,
                mappedSchedules.length - 1
              )
        );
      } catch (err) {
        console.error(
          "EMS Schedule API Error:",
          err
        );

        if (!mounted) return;

        setSchedules([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load EMS schedule"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchSchedule();
    const interval = setInterval(
      fetchSchedule,
      30 * 1000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* =========================================================
     FULLSCREEN
  ========================================================= */

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        setIsFullscreen(
          document.fullscreenElement ===
            widgetRef.current
        );
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen =
    async () => {
      const widget =
        widgetRef.current;

      if (!widget) return;

      try {
        if (
          document.fullscreenElement ===
          widget
        ) {
          await document.exitFullscreen();
        } else {
          await widget.requestFullscreen();
        }
      } catch (err) {
        console.error(
          "Fullscreen error:",
          err
        );
      }
    };

  /* =========================================================
     SELECTED ROW
  ========================================================= */

  const selected =
    schedules.length > 0
      ? schedules[
          Math.min(
            selectedIndex,
            schedules.length - 1
          )
        ]
      : null;

  const selectedScheduleKey = selected
    ? `${selected.timeStamp}-${selected.eventId}`
    : null;

  const isSelectedExecuting =
    selectedScheduleKey !== null &&
    executingScheduleKey === selectedScheduleKey;

  const handleExecute = async () => {
    if (!selected || !selectedScheduleKey) return;

    if (selected.eventNumber === null) {
      window.alert(
        "Event number is missing for this schedule."
      );
      return;
    }

    setExecutionLoading(true);

    try {
      const response = await fetch(EXECUTE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          event_number: selected.eventNumber,
        }),
      });

      const result: ControlApiResponse = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Schedule execution failed."
        );
      }

      setExecutingScheduleKey(selectedScheduleKey);

      window.alert(
        result.message || "Schedule execution started."
      );
    } catch (error) {
      console.error("Execute API error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to execute schedule."
      );
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleStopExecution = async () => {
    if (!selected || !selectedScheduleKey) return;

    setExecutionLoading(true);

    try {
      const response = await fetch(STOP_API, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      const result: ControlApiResponse = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Stop execution failed."
        );
      }

      setExecutingScheduleKey(null);

      window.alert(
        result.message || "Schedule stop requested."
      );
    } catch (error) {
      console.error("Stop API error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to stop execution."
      );
    } finally {
      setExecutionLoading(false);
    }
  };

  const handleResetExecution = async () => {
    setExecutionLoading(true);

    try {
      const response = await fetch(EXECUTE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          event_number: 0,
        }),
      });

      const result: ControlApiResponse = await response.json();

      if (!response.ok || result.success !== true) {
        throw new Error(
          result.message || "Schedule reset failed."
        );
      }

      setExecutingScheduleKey(null);

      window.alert(
        result.message || "Schedule reset request sent."
      );
    } catch (error) {
      console.error("Reset API error:", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to reset schedule."
      );
    } finally {
      setExecutionLoading(false);
    }
  };

  /* =========================================================
     SUMMARY
  ========================================================= */

  const summary = useMemo(() => {
    const intervalHours = 0.25;

    const totalCharge =
      schedules.reduce(
        (sum, item) =>
          sum +
          (item.charge *
            intervalHours) /
            1000,
        0
      );

    const totalDischarge =
      schedules.reduce(
        (sum, item) =>
          sum +
          (item.discharge *
            intervalHours) /
            1000,
        0
      );

    const totalGridImport =
      schedules.reduce(
        (sum, item) =>
          sum +
          (item.grid *
            intervalHours) /
            1000,
        0
      );

    return {
      charge: totalCharge,
      discharge: totalDischarge,
      grid: totalGridImport,
    };
  }, [schedules]);

  /* =========================================================
     STYLES
  ========================================================= */

  const getDecisionStyle = (
    decision: string
  ) => {
    const normalized =
      decision
        .trim()
        .toLowerCase();

    if (
      normalized === "discharge"
    ) {
      return {
        bg: "#FFE1E4",
        color: "#EF4444",
      };
    }

    if (
      normalized === "charge"
    ) {
      return {
        bg: "#DDF7EC",
        color: "#10A568",
      };
    }

    return {
      bg: "#E5E7EB",
      color: "#374151",
    };
  };

  const getStateStyle = (
    state: string
  ) => {
    const normalized =
      state
        .trim()
        .toLowerCase();

    if (
      normalized === "peak"
    ) {
      return {
        bg: "#FFF0E5",
        color: "#EA580C",
      };
    }

    return {
      bg: "#DDEEFF",
      color: "#0878E8",
    };
  };

  const formatNumber = (
    value: number,
    decimals = 0
  ) => {
    return value.toLocaleString(
      "en-IN",
      {
        minimumFractionDigits:
          decimals,
        maximumFractionDigits:
          decimals,
      }
    );
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <Box
        width="100%"
        height="725px"
        minHeight="725px"
        bg="#FFFFFF"
        border="1px solid #E4EAF1"
        borderRadius="16px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing="12px">
          <Spinner
            size="md"
            color="#1769D2"
          />
          <Text
            fontSize="13px"
            color="#52627A"
          >
            Loading EMS schedule...
          </Text>
        </VStack>
      </Box>
    );
  }

  /* =========================================================
     ERROR / EMPTY STATE
  ========================================================= */

  if (!selected) {
    return (
      <Box
        width="100%"
        height="715px"
        minHeight="715px"
        bg="#FFFFFF"
        border="1px solid #E4EAF1"
        borderRadius="16px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxShadow="0 3px 14px rgba(20, 40, 70, 0.05)"
      >
        <VStack
          spacing="10px"
          px="20px"
          textAlign="center"
        >
          <Icon
            as={FiAlertCircle}
            boxSize="28px"
            color="#F59E0B"
          />

          <Text
            fontSize="15px"
            fontWeight="700"
            color="#172B4D"
          >
            No EMS schedule available
          </Text>

          <Text
            fontSize="11px"
            color="#66758A"
            maxWidth="500px"
          >
            {error ||
              "The API returned no schedule records."}
          </Text>

          <Text
            fontSize="9px"
            color="#9AA6B5"
          >
            API: {EMS_SCHEDULE_API}
          </Text>
        </VStack>
      </Box>
    );
  }

  const decisionStyle =
    getDecisionStyle(
      selected.decision
    );

  const stateStyle =
    getStateStyle(
      selected.state
    );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <Box
      ref={widgetRef}
      width={
        isFullscreen
          ? "100vw"
          : "100%"
      }
      height={
        isFullscreen
          ? "100vh"
          : "715px"
      }
      minHeight="0"
      position={
        isFullscreen
          ? "fixed"
          : "relative"
      }
      top={
        isFullscreen ? 0 : "auto"
      }
      left={
        isFullscreen ? 0 : "auto"
      }
      right={
        isFullscreen ? 0 : "auto"
      }
      bottom={
        isFullscreen ? 0 : "auto"
      }
      zIndex={
        isFullscreen ? 9999 : "auto"
      }
      bg="#FFFFFF"
      borderRadius={
        isFullscreen ? 0 : "16px"
      }
      border="1px solid #E4EAF1"
      overflow="hidden"
      boxShadow="0 3px 14px rgba(20, 40, 70, 0.05)"
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <Flex
        height="70px"
        px="24px"
        align="center"
        justify="space-between"
        borderBottom="1px solid #E6EBF1"
      >
        <HStack spacing="13px">
          <Box
            width="30px"
            height="30px"
            borderRadius="7px"
            bg="#EAF3FF"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon
              as={FiCalendar}
              boxSize="17px"
              color="#075DBB"
            />
          </Box>

          <Text
            fontSize={isFullscreen ? "20px" : "18px"}
            fontWeight="700"
            color="#102452"
          >
            Provisional Schedule
          </Text>

          <Box
            width="1px"
            height="34px"
            bg="#D6DCE5"
            mx="4px"
          />

          <Flex
            height="32px"
            px="9px"
            borderRadius="8px"
            bg="#F5F8FC"
            border="1px solid #E4EAF1"
            align="center"
            gap="6px"
          >
            <Icon
              as={FiCalendar}
              boxSize="17px"
              color="#40506A"
            />

            <Text
              fontSize={isFullscreen ? "12px" : "11px"}
              fontWeight="700"
              color="#243552"
            >
              {formatDate(
                selected.timeStamp
              )}
            </Text>
          </Flex>

          <Box
            width="40px"
            height="40px"
            borderRadius="50%"
            bg="#F4F7FB"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            color="#243552"
            _hover={{
              bg: "#E8F1FD",
              color: "#1769D2",
            }}
          >
            <Text
              fontSize="25px"
              mt="-3px"
            >
              ›
            </Text>
          </Box>
        </HStack>

        {/* SUMMARY */}

        <HStack spacing="12px">
          <SummaryCard
            icon={FiFileText}
            iconColor="#2563EB"
            title="Event ID"
            value={selected?.eventId || "--"}
            valueFontSize="9px"
            isFullscreen={isFullscreen}
          />

          <SummaryCard
            icon={FiZap}
            iconColor="#10B981"
            title="Total Charge"
            value={`${formatNumber(
              summary.charge,
              1
            )} MWh`}
            isFullscreen={isFullscreen}
          />

          <SummaryCard
            icon={FiZap}
            iconColor="#F97316"
            title="Total Discharge"
            value={`${formatNumber(
              summary.discharge,
              1
            )} MWh`}
            isFullscreen={isFullscreen}
          />

          <SummaryCard
            icon={FiGrid}
            iconColor="#253858"
            title="Total Grid Import"
            value={`${formatNumber(
              summary.grid,
              1
            )} MWh`}
            isFullscreen={isFullscreen}
          />

          <IconButton
            aria-label={
              isFullscreen
                ? "Exit fullscreen"
                : "Enter fullscreen"
            }
            title={
              isFullscreen
                ? "Exit fullscreen"
                : "Fullscreen"
            }
            icon={
              isFullscreen ? (
                <SqeezIcon />
              ) : (
                <ExpandIcon />
              )
            }
            size="xs"
            w="32px"
            h="32px"
            minW="32px"
            borderRadius="4px"
            variant="outline"
            borderColor="#D7E0EA"
            bg="white"
            color="#243552"
            _hover={{
              bg: "#E8F1FD",
              color: "#1769D2",
            }}
            onClick={
              toggleFullscreen
            }
          />
        </HStack>
      </Flex>

      {/* ===================================================
          BODY
      =================================================== */}

      <Flex
        width="100%"
        height="calc(100% - 70px)"
        minHeight="0"
      >
        {/* =================================================
            LEFT TABLE
        ================================================= */}

        <Box
          width="70%"
          borderRight="1px solid #E5EAF0"
          px="14px"
          py="10px"
        >
          <TableContainer
            height="100%"
            overflowY="auto"
            overflowX="auto"
            sx={{
              "&::-webkit-scrollbar": {
                width: "7px",
                height: "7px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#F4F6F8",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#B9C3D0",
                borderRadius: "10px",
              },
            }}
          >
            <Table
              size="sm"
              variant="simple"
              sx={{
                tableLayout: "fixed",
              }}
            >
              <Thead
                position="sticky"
                top={0}
                zIndex={2}
                bg="#F8FAFD"
              >
                <Tr>
                  <TableHeader width="7%" isFullscreen={isFullscreen}>
                    Time
                  </TableHeader>

                  <TableHeader width="9%" isFullscreen={isFullscreen}>
                    Load
                    <br />
                    (kW)
                  </TableHeader>

                  <TableHeader width="8%" isFullscreen={isFullscreen}>
                    PV
                    <br />
                    (kW)
                  </TableHeader>

                  <TableHeader width="10%" isFullscreen={isFullscreen}>
                    Tariff
                    <br />
                    (₹/kWh)
                  </TableHeader>

                  <TableHeader width="11%" isFullscreen={isFullscreen}>
                    State
                  </TableHeader>

                  <TableHeader width="12%" isFullscreen={isFullscreen}>
                    Decision
                  </TableHeader>

                  <TableHeader width="10%" isFullscreen={isFullscreen}>
                    Charge
                    <br />
                    (kW)
                  </TableHeader>

                  <TableHeader width="11%" isFullscreen={isFullscreen}>
                    Discharge
                    <br />
                    (kW)
                  </TableHeader>

                  <TableHeader width="9%" isFullscreen={isFullscreen}>
                    Grid
                    <br />
                    (kW)
                  </TableHeader>

                  <TableHeader width="7%" isFullscreen={isFullscreen}>
                    SOC
                    <br />
                    (%)
                  </TableHeader>

                  <TableHeader width="11%" isFullscreen={isFullscreen}>
                    Battery
                    <br />
                    (MWh)
                  </TableHeader>
                </Tr>
              </Thead>

              <Tbody>
                {schedules.map(
                  (item, index) => {
                    const itemDecision =
                      getDecisionStyle(
                        item.decision
                      );

                    const itemState =
                      getStateStyle(
                        item.state
                      );

                    const selectedRow =
                      index ===
                      selectedIndex;

                    return (
                      <Tr
                        key={`${item.timeStamp}-${index}`}
                        onClick={() =>
                          setSelectedIndex(
                            index
                          )
                        }
                        cursor="pointer"
                        bg={
                          selectedRow
                            ? "#EAF4FF"
                            : "#FFFFFF"
                        }
                        transition="0.15s"
                        borderBottom="1px solid #EDF1F5"
                        _hover={{
                          bg: "#F3F8FE",
                        }}
                      >
                        <TableCell
                          isFullscreen={isFullscreen}
                          fontWeight={
                            selectedRow
                              ? "700"
                              : "500"
                          }
                          color="#172B4D"
                        >
                          {item.time}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.load
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.pv
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.tariff,
                            1
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          <Badge
                            px="5px"
                            py="3px"
                            borderRadius="5px"
                            bg={
                              itemState.bg
                            }
                            color={
                              itemState.color
                            }
                            fontSize={isFullscreen ? "9px" : "8px"}
                            fontWeight="600"
                          >
                            {item.state}
                          </Badge>
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          <Badge
                            px="5px"
                            py="3px"
                            borderRadius="5px"
                            bg={
                              itemDecision.bg
                            }
                            color={
                              itemDecision.color
                            }
                            fontSize={isFullscreen ? "9px" : "8px"}
                            fontWeight="700"
                          >
                            {item.decision}
                          </Badge>
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.charge
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.discharge
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen}>
                          {formatNumber(
                            item.grid
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen} fontWeight="600">
                          {formatNumber(
                            item.soc,
                            2
                          )}
                        </TableCell>

                        <TableCell isFullscreen={isFullscreen} fontWeight="600">
                          {formatNumber(
                            item.battery,
                            3
                          )}
                        </TableCell>
                      </Tr>
                    );
                  }
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* =================================================
            RIGHT DETAILS
        ================================================= */}

        <Box
          width="30%"
          px="18px"
          py="10px"
          overflowY="auto"
          height="100%"
        >
          {/* SCHEDULE EXECUTION CONTROLS */}
          <Box
            mb="12px"
            p="10px"
            border="1px solid #E2EAF4"
            borderRadius="10px"
            bg="#F8FAFD"
          >
            <Flex align="center" justify="space-between" mb="9px">
              <Text fontSize="11px" fontWeight="700" color="#243552">
                Schedule Execution
              </Text>

              <Badge
                colorScheme={isSelectedExecuting ? "green" : "gray"}
                fontSize="9px"
                px="7px"
                py="3px"
              >
                {isSelectedExecuting ? "EXECUTING" : "NOT STARTED"}
              </Badge>
            </Flex>

            <HStack spacing="8px">
              <Button
                flex="1"
                size="sm"
                leftIcon={<Icon as={FiPlay} />}
                colorScheme="green"
                fontSize="11px"
                isLoading={executionLoading}
                loadingText="Executing..."
                isDisabled={executionLoading || isSelectedExecuting}
                onClick={handleExecute}
              >
                Execute
              </Button>

              <Button
                flex="1"
                size="sm"
                leftIcon={<Icon as={FiSquare} />}
                colorScheme="red"
                variant="outline"
                fontSize="11px"
                isLoading={executionLoading}
                loadingText="Stopping..."
                isDisabled={executionLoading}
                onClick={handleStopExecution}
              >
                Stop
              </Button>
              <Button
                flex="1"
                size="sm"
                leftIcon={<Icon as={FiRefreshCw} />}
                colorScheme="gray"
                variant="outline"
                fontSize="11px"
                isLoading={executionLoading}
                loadingText="Resetting..."
                isDisabled={executionLoading}
                onClick={handleResetExecution}
              >
                Reset
              </Button>
            </HStack>
          </Box>

          {/* SELECTED TIME */}

          <Flex
            height="48px"
            px="16px"
            borderRadius="11px"
            bg="#EAF3FF"
            align="center"
            justify="space-between"
            mb="9px"
          >
            <Text
              fontSize={isFullscreen ? "20px" : "18px"}
              fontWeight="800"
              color="#132D61"
            >
              {selected.time}
            </Text>

            <Badge
              px="7px"
              py="3px"
              borderRadius="5px"
              bg={stateStyle.bg}
              color={stateStyle.color}
              fontSize={isFullscreen ? "9px" : "8px"}
              fontWeight="700"
            >
              {selected.state}
            </Badge>
          </Flex>

          <DetailRow
            icon={FiFileText}
            iconColor="#253858"
            label="Load"
            isFullscreen={isFullscreen}
            value={`${formatNumber(
              selected.load
            )} kW`}
          />

          <DetailRow
            icon={FiSun}
            iconColor="#F59E0B"
            label="PV"
            isFullscreen={isFullscreen}
            value={`${formatNumber(
              selected.pv
            )} kW`}
          />

          <DetailRow
            icon={FiZap}
            iconColor="#F59E0B"
            label="Tariff"
            isFullscreen={isFullscreen}
            value={`₹ ${formatNumber(
              selected.tariff,
              1
            )} /kWh`}
          />

          <DetailRow
            icon={FiZap}
            iconColor="#2563EB"
            label="Decision"
            isFullscreen={isFullscreen}
            value={
              <Badge
                px="5px"
                py="3px"
                borderRadius="5px"
                bg={
                  decisionStyle.bg
                }
                color={
                  decisionStyle.color
                }
                fontSize={isFullscreen ? "9px" : "8px"}
                fontWeight="700"
              >
                {selected.decision}
              </Badge>
            }
          />

          <DetailRow
            icon={FiArrowUp}
            iconColor="#16A34A"
            label="Charge"
            isFullscreen={isFullscreen}
            value={`${formatNumber(
              selected.charge
            )} kW`}
          />

          <DetailRow
            icon={FiArrowDown}
            iconColor="#EF4444"
            label="Discharge"
            isFullscreen={isFullscreen}
            value={`${formatNumber(
              selected.discharge
            )} kW`}
          />

          <DetailRow
            icon={FiGrid}
            iconColor="#253858"
            label="Grid Import"
            isFullscreen={isFullscreen}
            value={`${formatNumber(
              selected.grid
            )} kW`}
          />

          {/* SOC */}

          <Box
            py="5px"
            borderBottom="1px solid #E9EEF4"
          >
            <Flex
              align="center"
              justify="space-between"
              mb="6px"
            >
              <HStack spacing="6px">
                <Icon
                  as={FiBattery}
                  boxSize="13px"
                  color="#2563EB"
                />

                <Text
                  fontSize={isFullscreen ? "11px" : "10px"}
                  color="#263B5B"
                >
                  SOC
                </Text>
              </HStack>

              <Text
                fontSize={isFullscreen ? "11px" : "10px"}
                fontWeight="700"
                color="#172B4D"
              >
                {formatNumber(
                  selected.soc,
                  2
                )}{" "}
                %
              </Text>
            </Flex>

            <Progress
              value={Math.max(
                0,
                Math.min(
                  100,
                  selected.soc
                )
              )}
              height="6px"
              borderRadius="10px"
              bg="#E8EDF3"
              sx={{
                "& > div": {
                  background:
                    "linear-gradient(90deg, #3B82F6, #3BA4F5)",
                  borderRadius:
                    "10px",
                },
              }}
            />
          </Box>

          {/* BATTERY */}

          <Box
            py="5px"
            borderBottom="1px solid #E9EEF4"
          >
            <Flex
              align="center"
              justify="space-between"
              mb="6px"
            >
              <HStack spacing="6px">
                <Icon
                  as={FiBattery}
                  boxSize="13px"
                  color="#10B981"
                />

                <Text
                  fontSize={isFullscreen ? "11px" : "10px"}
                  color="#263B5B"
                >
                  Battery Energy
                </Text>
              </HStack>

              <Text
                fontSize={isFullscreen ? "11px" : "10px"}
                fontWeight="700"
                color="#172B4D"
              >
                {formatNumber(
                  selected.battery,
                  3
                )}{" "}
                MWh
              </Text>
            </Flex>

            <Progress
              value={Math.max(
                0,
                Math.min(
                  100,
                  (selected.battery /
                    26) *
                    100
                )
              )}
              height="6px"
              borderRadius="10px"
              bg="#E8EDF3"
              sx={{
                "& > div": {
                  background:
                    "linear-gradient(90deg, #16C79A, #14C9B0)",
                  borderRadius:
                    "10px",
                },
              }}
            />
          </Box>

          <DetailRow
            icon={FiRefreshCw}
            iconColor="#2563EB"
            label="Throughput Cycles"
            isFullscreen={isFullscreen}
            value={formatNumber(
              selected.throughput,
              4
            )}
          />

          {/* DESCRIPTION */}

          <Box
            mt="6px"
            p="8px"
            borderRadius="7px"
            bg="#EEF6FF"
          >
            <HStack
              spacing="6px"
              mb="5px"
            >
              <Icon
                as={FiFileText}
                boxSize="18px"
                color="#2563EB"
              />

              <Text
                fontSize={isFullscreen ? "11px" : "10px"}
                fontWeight="700"
                color="#163B73"
              >
                Description
              </Text>
            </HStack>

            <Text
              fontSize={isFullscreen ? "10px" : "9px"}
              lineHeight="1.35"
              color="#385274"
            >
              {selected.description}
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

/* =========================================================
   SUMMARY CARD
========================================================= */

interface SummaryCardProps {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  value: string;
  valueFontSize?: string;
  isFullscreen: boolean;
}

const SummaryCard: React.FC<
  SummaryCardProps
> = ({
  icon,
  iconColor,
  title,
  value,
  valueFontSize = "11px",
  isFullscreen,
}) => {
  return (
    <Box
      minWidth="105px"
      height="42px"
      px="8px"
      borderRadius="8px"
      bg="#F7F9FC"
      border="1px solid #E6EBF1"
      display="flex"
      alignItems="center"
      gap="6px"
    >
      <Icon
        as={icon}
        boxSize="15px"
        color={iconColor}
      />

      <VStack
        align="start"
        spacing={0}
      >
        <Text
          fontSize="9px"
          color="#52627A"
          lineHeight="1.1"
        >
          {title}
        </Text>

        <Text
          fontSize={`${
            Number.parseInt(valueFontSize, 10) +
            (isFullscreen ? 2 : 1)
          }px`}
          fontWeight="800"
          color="#14213D"
          lineHeight="1.2"
        >
          {value}
        </Text>
      </VStack>
    </Box>
  );
};

/* =========================================================
   TABLE HEADER
========================================================= */

const TableHeader = ({
  children,
  width,
  isFullscreen,
}: {
  children: React.ReactNode;
  width: string;
  isFullscreen: boolean;
}) => {
  return (
    <Th
      width={width}
      px="4px"
      py="6px"
      textAlign="center"
      fontSize={isFullscreen ? "10px" : "9px"}
      fontWeight="700"
      color="#1D2D47"
      whiteSpace="nowrap"
      textTransform="none"
      borderBottom="1px solid #E2E8F0"
    >
      {children}
    </Th>
  );
};

/* =========================================================
   TABLE CELL
========================================================= */

const TableCell = ({
  children,
  fontWeight,
  color,
  isFullscreen,
}: {
  children: React.ReactNode;
  fontWeight?: string | number;
  color?: string;
  isFullscreen: boolean;
}) => {
  return (
    <Td
      px="4px"
      py="5px"
      textAlign="center"
      fontSize={isFullscreen ? "11px" : "10px"}
      fontWeight={
        fontWeight || "500"
      }
      color={
        color || "#26364F"
      }
      whiteSpace="nowrap"
      borderBottom="1px solid #EDF1F5"
    >
      {children}
    </Td>
  );
};

/* =========================================================
   DETAIL ROW
========================================================= */

interface DetailRowProps {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: React.ReactNode;
  isFullscreen: boolean;
}

const DetailRow: React.FC<
  DetailRowProps
> = ({
  icon,
  iconColor,
  label,
  value,
  isFullscreen,
}) => {
  return (
    <Flex
      minHeight="29px"
      align="center"
      justify="space-between"
      borderBottom="1px solid #E9EEF4"
    >
      <HStack spacing="6px">
        <Icon
          as={icon}
          boxSize="13px"
          color={iconColor}
        />

        <Text
          fontSize={isFullscreen ? "11px" : "10px"}
          color="#263B5B"
        >
          {label}
        </Text>
      </HStack>

      <Box
        fontSize={isFullscreen ? "11px" : "10px"}
        fontWeight="700"
        color="#172B4D"
      >
        {value}
      </Box>
    </Flex>
  );
};

export default NextDaySchedule;
