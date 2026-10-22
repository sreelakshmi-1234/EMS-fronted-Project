import { useEffect, useState, useMemo, useRef } from "react";
import { useTimeHandle } from "../../../Services/TimeWindowSetting";
import SplineGraph from "../../Graphs/RevampCharts/SplineGraph";
import GraphLayout from "../../Layouts/WidgetsLayout/GraphsLayout/GraphLayout";
import useTimeseriesData from "../../../hooks/useTimeseriesData";
import { Box, Flex, HStack, Text, Icon } from "@chakra-ui/react";
import {
  FiZap,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import type { ExportFunctions } from "../../../types/graphExport/export";

const MeterWidget = () => {

  const {
    config: timeWindow,
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

  const timeWindowRef = useRef(timeWindow);

  useEffect(() => {
    timeWindowRef.current = timeWindow;
  }, [timeWindow]);

  /*  DATE STATE */
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const tw = timeWindow.timeRange;

    if (tw.type === "absolute") {
      setCurrentDate(new Date(tw.startTs ?? Date.now()));
    }

    if (tw.type === "relative") {
      if (tw.relativeType === "currentDaySoFar") {
        setCurrentDate(new Date());
      }

      if (tw.relativeType === "yesterday") {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        setCurrentDate(d);
      }
    }

  }, [timeWindow]);

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

  const isCurrentDay =
    timeWindow.timeRange.type === "relative" &&
    timeWindow.timeRange.relativeType === "currentDaySoFar";
  const currentDayLabelInterval = 4 * 60 * 60 * 1000;

  const applyAbsoluteDay = (date: Date) => {

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    handleTimeWindowChange({
       aggregation: timeWindow.aggregation,
      orderBy: "ASC",
      timeRange: {
        type: "absolute",
        startTs: start.getTime(),
        endTs: end.getTime(),
      },
    });
  };

  const goPrevDay = () => {

    setCurrentDate(prev => {

      const d = new Date(prev);
      d.setDate(d.getDate() - 1);

      applyAbsoluteDay(d);

      return d;
    });

  };

  const goNextDay = () => {

    if (isToday) return;

    setCurrentDate(prev => {

      const d = new Date(prev);
      d.setDate(d.getDate() + 1);

      const today = new Date();

      const reachedToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      if (reachedToday) {
        handleReset();
      } else {
        applyAbsoluteDay(d);
      }

      return d;

    });

  };

  // removed memoized fetching payload; we'll construct request in the effect below

  const { data, fetchData } = useTimeseriesData();
  const { fetchData: fetchMeterStats } = useTimeseriesData();

  useEffect(() => {
    const loadData = () => {
      fetchData({
        devices: {
          patterns: [],
          ids: ["plant_1_ht_outgoing_meter_1"],
        },
        keys: [
          {
            key: "total_active_power",
            alias: "Power (kW)",
            keyType: "common",
            type: "spline",
          },
          {
            key: "total_reactive_power",
            alias: "Power (kVAR)",
            keyType: "common",
            type: "spline",
          },
          {
            key: "total_apparent_power",
            alias: "Power (KVA)",
            keyType: "common",
            type: "spline",
          },
        ],
        aggregation: timeWindow.aggregation,
        timeRange: timeWindow.timeRange,
        orderBy: "ASC",
      } as any);
    };

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 60000);

    return () => clearInterval(interval);
  }, [timeWindow]);

  useEffect(() => {
    const loadMeterStats = () => {
      fetchMeterStats({
        devices: {
          patterns: [],
          ids: ["plant_1_ht_outgoing_meter_1"],
        },
        keys: [
          {
            key: "total_active_power",
            alias: "Active Power",
            keyType: "common",
          },
          {
            key: "daily_active_energy_import",
            alias: "Daily Energy",
            keyType: "common",
          },
          {
            key: "frequency",
            alias: "Frequency",
            keyType: "common",
          },
          {
            key: "avg_voltage_l",
            alias: "Voltage",
            keyType: "common",
          },
          {
            key: "avg_current_l",
            alias: "Current",
            keyType: "common",
          },
        ],
        aggregation: {
          func: "none",
          interval: 1,
          intervalType: "minute",
        },
        timeRange: {
          type: "last",
          interval: 10,
          intervalType: "minute",
        },
        orderBy: "ASC",
      } as any);
    };

    loadMeterStats();

    const interval = setInterval(loadMeterStats, 60000);

    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const seriesForChart = useMemo(() => {

    if (!data || typeof data !== "object") return [];

    const s: any[] = [];
    const seriesColors: Record<string, string> = {
      total_active_power: "#1890FF",
      total_reactive_power: "#20B26B",
      total_apparent_power: "#F5A623",
    };

    Object.values(data).forEach((deviceObj: any) => {

      if (!deviceObj) return;

      Object.entries(deviceObj).forEach(([metric, pts]: any) => {

        if (Array.isArray(pts)) {

          s.push({
            type: "spline",
            name: metric,
            color: seriesColors[metric],

            data: pts
              .filter(
                (p: any) =>
                  p &&
                  p.ts &&
                  p.value !== null &&
                  p.value !== undefined &&
                  !isNaN(Number(p.value))
              )
              .map((p: any) => [Number(p.ts), Number(p.value)])
              .sort((a: any, b: any) => a[0] - b[0]),

            marker: {
              enabled: false,
            },
          });

        }

      });

    });

    return s.length ? s : [{}];

  }, [data]);

  const textColor = "#1A202C";
  const subTextColor = "#718096";

  const dashboardBg = "#FFFFFF";
  const panelBg = "#F7FAFC";
  const borderColor = "#D9E2EC";

  const blueGlow = "#1890FF";
  const greenGlow = "#20B26B";

  const gridColor = "rgba(0,0,0,0.08)";
  const axisLineColor = "rgba(0,0,0,0.15)";

  const [exportFunctions, setExportFunctions] =
    useState<ExportFunctions | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  return (
    <GraphLayout
      title={
        <Flex
          w="100%"
          h="42px"
          align="center"
          justify="space-between"
          px="10px"
          bg={dashboardBg}
          color={textColor}
        >
          <HStack spacing="8px">
            <Box
              w="28px"
              h="28px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="8px"
              bg="rgba(24,144,255,0.08)"
            >
              <Icon as={FiZap} boxSize="18px" color={blueGlow} />
            </Box>

            <Box>
              <Text fontSize="15px" fontWeight="700" lineHeight="15px">
                Meter Data
              </Text>

              <Text fontSize="8px" color={subTextColor} mt="2px">
                Real-time Power Monitoring & Energy Insights
              </Text>
            </Box>
          </HStack>

          <HStack spacing="8px" ml="auto">
            <HStack
              h="26px"
              px="8px"
              borderRadius="6px"
              bg="#F3F8FF"
              border="1px solid"
              borderColor={borderColor}
              spacing="6px"
              ml="8px"
            >
              <Icon as={FiCalendar} boxSize="12px" />

              <Text fontSize="10px" fontWeight="600">
                {formattedDate}
              </Text>

              <Text cursor="pointer" onClick={goPrevDay} fontSize="14px">
                ‹
              </Text>

              <Text
                cursor={isToday ? "not-allowed" : "pointer"}
                opacity={isToday ? 0.35 : 1}
                onClick={goNextDay}
                fontSize="14px"
              >
                ›
              </Text>
            </HStack>

            {/* <Icon as={FiMaximize2} boxSize="14px" color={subTextColor} />
            <Icon as={FiClock} boxSize="14px" color={subTextColor} />
            <Icon as={FiMoreVertical} boxSize="14px" color={subTextColor} /> */}
          </HStack>
        </Flex>
      }
      width="590px"
      height="300px"
      fullScreen
      timeWindow={!isFullscreen}
      onTimeWindowChange={handleTimeWindowChange}
      onReset={handleReset}
      onExport={exportFunctions}
    >
      <Box
        w="100%"
        h={isFullscreen ? "calc(100vh - 60px)" : "218px"}
        minH={0}
        bg={dashboardBg}
        px="7px"
        pb="0px"
        display="flex"
        flexDirection="column"
        gap="0px"
        overflow="hidden"
        boxSizing="border-box"
      >
        <Box
          w="100%"
          h={isFullscreen ? "100%" : "218px"}
          minH={0}
          display="flex"
          flex={isFullscreen ? 1 : "initial"}
          flexDirection={isFullscreen ? "column" : "row"}
          gap={isFullscreen ? "12px" : "6px"}
          minW="0"
          overflow="hidden"
          flexShrink={isFullscreen ? 1 : 0}
        >
          <Box
            flex={isFullscreen ? "0 0 auto" : "1"}
            minW="0"
            h={isFullscreen ? "calc(100vh - 180px)" : "218px"}
            minH={0}
            bg={panelBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            p="2px"
            boxSizing="border-box"
            overflow="hidden"
          >
            <SplineGraph
              apiData={seriesForChart}
              height={isFullscreen ? window.innerHeight - 260 : 214}
              onExportReady={setExportFunctions}
              props={{
                yAxis: {
                  tickAmount: 5,
                  labels: {
                    style: {
                      color: textColor,
                      fontSize: "8px",
                    },
                  },
                  gridLineColor: gridColor,
                },

                xAxis: {
                  type: "datetime",
                  minInterval: currentDayLabelInterval,
                  maxInterval: currentDayLabelInterval,
                  labels: {
                    step: isCurrentDay ? 4 : 1,
                    rotation: 0,
                    style: {
                      color: subTextColor,
                      fontSize: isCurrentDay ? "7px" : "8px",
                    },
                  },
                  lineColor: axisLineColor,
                  gridLineColor: gridColor,
                },

                plotOptions: {
                  series: {
                    connectNulls: false,
                    turboThreshold: 5000,
                  },

                  spline: {
                    lineWidth: 2,
                    marker: {
                      enabled: false,
                    },
                  },
                },

                tooltip: {
                  shared: true,
                },

                legend: {
                  enabled: true,
                  align: "center",
                  verticalAlign: "top",
                  y: 0,
                  itemStyle: {
                    color: textColor,
                    fontSize: "12px",
                    fontWeight: "500",
                  },
                  itemDistance: 16,
                },
              }}
            />
          </Box>

            <Box
              w={isFullscreen ? "100%" : "180px"}
              minW={isFullscreen ? "0" : "180px"}
              h={isFullscreen ? "90px" : "218px"}
              minH="0"
              display="flex"
              flexDirection={isFullscreen ? "row" : "column"}
              gap={isFullscreen ? "8px" : "2px"}
              overflow="visible"
              boxSizing="border-box"
            >
              <Box
                flex="1"
                minH="0"
                minW="0"
                px="8px"
                py="3px"
                borderRadius="8px"
                bg="#F4FAFF"
                border="1px solid #B9DDF4"
                borderLeft="3px solid #1890FF"
                color={textColor}
                overflow="hidden"
                transition="transform 180ms ease, box-shadow 180ms ease"
                _hover={{
                  transform: "translateX(-3px)",
                  boxShadow: "0 5px 14px rgba(24,144,255,0.18)",
                }}
              >
                <HStack justify="space-between" spacing="3px" align="flex-start">
                  <HStack spacing="5px" minW="0" flex="1">
                    <Icon as={FiZap} boxSize="21px" flexShrink={0} color={blueGlow} />
                    <Text fontSize={isFullscreen ? "12px" : "8px"} fontWeight="600" whiteSpace="nowrap">
                      Instantaneous Power
                    </Text>
                  </HStack>

                  <Text fontSize={isFullscreen ? "16px" : "12px"} fontWeight="700" color={blueGlow} whiteSpace="nowrap">
                    2512.5
                    <Text as="span" fontSize={isFullscreen ? "9px" : "6px"} ml="2px">
                      kVA
                    </Text>
                  </Text>
                </HStack>

                <HStack mt="1px" justify="space-between" spacing="3px">
                  <Text fontSize={isFullscreen ? "12px" : "10px"} color={subTextColor}>
                    kVA: <b>2512.5</b>
                  </Text>
                  <Text fontSize={isFullscreen ? "12px" : "10px"} color={subTextColor}>
                    kVAR: <b>0.00</b>
                  </Text>
                  <Text fontSize={isFullscreen ? "12px" : "10px"} color={subTextColor}>
                    kW: <b>2512.5</b>
                  </Text>
                </HStack>
              </Box>

              <Box
                flex="1"
                minH="0"
                minW="0"
                px="8px"
                py="3px"
                borderRadius="8px"
                bg="#F3FFF9"
                border="1px solid #B9E9D2"
                borderLeft="3px solid #20B26B"
                color={textColor}
                position="relative"
                overflow="hidden"
                transition="transform 180ms ease, box-shadow 180ms ease"
                _hover={{
                  transform: "translateX(-3px)",
                  boxShadow: "0 5px 14px rgba(32,178,107,0.18)",
                }}
              >
                <HStack justify="space-between" align="center" spacing="3px">
                  <HStack spacing="5px">
                    <Box
                      w="27px"
                      h="27px"
                      borderRadius="7px"
                      bg="#DDF8E9"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiActivity} boxSize="17px" color={greenGlow} />
                    </Box>
                    <Box>
                      <Text fontSize={isFullscreen ? "12px" : "8px"} fontWeight="600" lineHeight="10px">
                        Daily Energy
                      </Text>
                    </Box>
                  </HStack>
                  <Text fontSize={isFullscreen ? "16px" : "13px"} fontWeight="700" color={greenGlow} lineHeight="15px" whiteSpace="nowrap">
                    7032
                    <Text as="span" fontSize={isFullscreen ? "9px" : "7px"} ml="3px" color={subTextColor}>
                      kWh
                    </Text>
                  </Text>
                </HStack>

                <HStack mt="-4px" justify="space-between" spacing="5px" px="2px">
                  <Text fontSize={isFullscreen ? "11px" : "9px"} color={subTextColor} whiteSpace="nowrap">
                    Import <b>7032 kWh</b>
                  </Text>
                  <Text fontSize={isFullscreen ? "11px" : "9px"} color={subTextColor} whiteSpace="nowrap">
                    Export <b>0.00 kWh</b>
                  </Text>
                </HStack>
              </Box>

              <Box
                flex="1"
                minH="0"
                minW="0"
                px="8px"
                py="3px"
                borderRadius="8px"
                bg="#F5F9FF"
                border="1px solid #BBD5F5"
                borderLeft="3px solid #4A90E2"
                color={textColor}
                overflow="hidden"
                transition="transform 180ms ease, box-shadow 180ms ease"
                _hover={{
                  transform: "translateX(-3px)",
                  boxShadow: "0 5px 14px rgba(74,144,226,0.18)",
                }}
              >
                <HStack justify="space-between" h="100%" spacing="3px" align="center">
                  <HStack spacing="5px" flexShrink={0}>
                    <Box
                      w="27px"
                      h="27px"
                      borderRadius="7px"
                      bg="#DDEBFF"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FiActivity} boxSize="18px" color={blueGlow} />
                    </Box>
                    <Box>
                      <Text fontSize={isFullscreen ? "12px" : "8px"} fontWeight="600" lineHeight="10px">Frequency</Text>
                      <Text fontSize={isFullscreen ? "20px" : "15px"} fontWeight="700" lineHeight="16px" color={blueGlow}>
                        49.81
                        <Text as="span" fontSize={isFullscreen ? "9px" : "7px"} ml="3px" color={subTextColor}>Hz</Text>
                      </Text>
                    </Box>
                  </HStack>

                </HStack>
              </Box>

              <Box
                flex="1"
                minH="0"
                minW="0"
                px="8px"
                py="3px"
                borderRadius="8px"
                bg="#FAFCFF"
                border="1px solid #C7D7E8"
                borderLeft="3px solid #6B8EAD"
                color={textColor}
                overflow="hidden"
                transition="transform 180ms ease, box-shadow 180ms ease"
                _hover={{
                  transform: "translateX(-3px)",
                  boxShadow: "0 5px 14px rgba(75,105,135,0.16)",
                }}
              >
                <HStack justify="space-between" spacing="3px">
                  <HStack spacing="5px">
                    <Text fontSize="18px" lineHeight="18px">⚡</Text>
                    <Text fontSize={isFullscreen ? "12px" : "8px"} fontWeight="600" whiteSpace="nowrap">Voltage (L-L)</Text>
                  </HStack>

                  <Text fontSize={isFullscreen ? "16px" : "13px"} fontWeight="700" whiteSpace="nowrap">231.13 V</Text>
                </HStack>

                <HStack mt="2px" spacing="0" w="100%">
                  <Box w="33.33%" textAlign="center" borderRight="1px solid rgba(255,255,255,0.20)">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">231.13 V</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L1</Text>
                  </Box>
                  <Box w="33.33%" textAlign="center" borderRight="1px solid rgba(255,255,255,0.20)">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">230.85 V</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L2</Text>
                  </Box>
                  <Box w="33.33%" textAlign="center">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">231.42 V</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L3</Text>
                  </Box>
                </HStack>
              </Box>

              <Box
                flex="1"
                minH="0"
                minW="0"
                px="8px"
                py="3px"
                borderRadius="8px"
                bg="#FFFCF5"
                border="1px solid #F1DDAE"
                borderLeft="3px solid #F5A623"
                color={textColor}
                overflow="hidden"
                transition="transform 180ms ease, box-shadow 180ms ease"
                _hover={{
                  transform: "translateX(-3px)",
                  boxShadow: "0 5px 14px rgba(245,166,35,0.18)",
                }}
              >
                <HStack justify="space-between" spacing="3px">
                  <HStack spacing="5px">
                    <Text fontSize="18px" color="#FFB72B" lineHeight="18px">〽</Text>
                    <Text fontSize={isFullscreen ? "12px" : "8px"} fontWeight="600">Current</Text>
                  </HStack>

                  <Text fontSize={isFullscreen ? "16px" : "13px"} fontWeight="700" color="#FFD166" whiteSpace="nowrap">978.05 A</Text>
                </HStack>

                <HStack mt="2px" spacing="0" w="100%">
                  <Box w="33.33%" textAlign="center" borderRight="1px solid rgba(255,255,255,0.20)">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">978.05 A</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L1</Text>
                  </Box>
                  <Box w="33.33%" textAlign="center" borderRight="1px solid rgba(255,255,255,0.20)">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">977.82 A</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L2</Text>
                  </Box>
                  <Box w="33.33%" textAlign="center">
                    <Text fontSize={isFullscreen ? "13px" : "10px"} fontWeight="600">978.31 A</Text>
                    <Text fontSize={isFullscreen ? "8px" : "6px"} color={subTextColor}>L3</Text>
                  </Box>
                </HStack>
              </Box>
            </Box>
        </Box>

      </Box>
    </GraphLayout>
  );
};

export default MeterWidget;