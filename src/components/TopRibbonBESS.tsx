import React, { useEffect, useState, type ReactNode, useRef } from "react";
import { useEmsStatus } from "../hooks/useEmsStatus";
import useTimeseriesData from "../hooks/useTimeseriesData";
import type { TimeseriesDataSource } from "../types/timeseries/datasource";
import NotificationBell from "./NotificationBell";
import {
  Box, HStack, VStack, Text, Tooltip, Icon, Flex, IconButton, Avatar,
  Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, useDisclosure,
  Divider,
  Image, Grid, GridItem, Heading, Stack, useColorMode, useColorModeValue,
  Menu, MenuButton, MenuList, MenuItem, MenuGroup, Button, Portal
} from "@chakra-ui/react";
import {
  FiZap, FiBatteryCharging, FiTrendingUp, FiActivity, FiBell, FiInfo,
  FiSun, FiMoon
} from "react-icons/fi";
import imgPlant from "../assets/OIP.jpeg";
// import cognetaLogoBlack from "../assets/cogneta_logo_black.png";

type PlantDetails = {
  name: string; location: string; date: string; energySystem: string;
  pvCapacity: string; bessCapacity?: string; dgCapacity?: string; imageUrl: string;
};

type Props = {
  livePowerKw: number; lifeChargeMWh: number; lifeDischargeMWh: number;
  dailyChargeMWh: number; dailyDischargeMWh: number; cufAcPct: number; cufDcPct: number;
  onlineInverters: number; totalInverters: number; updatedAt?: string; leftSlot?: ReactNode;
  eventCount?: number; plantInfo?: string; plantDetails?: PlantDetails;
  avatarUrl?: string; timeZone?: string;
  isLoggedIn?: boolean; displayName?: string; handleLogout?: () => void; navigate?: (path: string) => void;
};

/* ========= SIZES ========= */
const VAL_SIZE = "14px"; // number + unit
const LAB_SIZE = { base: "11px", md: "12px" };

/* ========= TYPO ========= */
const ValueText = (props: any) => (
  <Text
    as="span"
    fontSize={VAL_SIZE}
    fontWeight={600}
    lineHeight="1"
    color={useColorModeValue("#000", "whiteAlpha.900")}
    noOfLines={1}
    {...props}
  />
);
const BigNum = ({ v }: { v: number }) => (
  <ValueText>{v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ValueText>
);
const BigNumInt = ({ v }: { v: number }) => <ValueText>{v.toLocaleString()}</ValueText>;
const Unit = ({ u }: { u: string }) => <ValueText flexShrink={0}>{" "}{u}</ValueText>;
const Sep = () => <ValueText>{`\u00A0/\u00A0`}</ValueText>; // non-breaking

// ensures the whole value stays on ONE line (no wrap, no overlap)
const ValueRow = ({ children }: { children: ReactNode }) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="baseline"
    columnGap="4px"
    whiteSpace="nowrap"
    minW={0}
    overflow="hidden"
    textOverflow="ellipsis"
  >
    {children}
  </Box>
);

/* ========= ICON (compact) ========= */
const SquareIcon = ({ as, bg }: { as: any; bg: string }) => (
  <Box w="20px" h="20px" bg={bg} borderRadius="4px" display="grid" placeItems="center" flexShrink={0}>
    <Icon as={as} boxSize="12px" color="gray.900" />
  </Box>
);

/* ========= DIVIDER ========= */
const MetricDivider = (props: any) => (
  <Box
    role="separator"
    aria-hidden="true"
    w="1px"
    h="18px"
    bg={useColorModeValue("#CBD5E1", "#475569")}
    opacity={0.65}
    flexShrink={0}
    {...props}
  />
);

/* ========= PILL ========= */
const Pill = ({
  icon, colorBg = "teal.300", label, children, tooltip,
  minW = "105px", h = "42px", gap = "6px",
}: {
  icon: any; colorBg?: string; label: string; children: React.ReactNode; tooltip?: string;
  minW?: string | number; h?: string | number; gap?: string | number;
}) => (
  <Tooltip label={tooltip ?? label} hasArrow>
    <HStack spacing="8px" flex="0 0 auto" minW={minW} h={h} align="center">

      <SquareIcon as={icon} bg={colorBg} />
      <VStack align="start" spacing={gap} w="full" h="full" minW={0} justify="center">
        <Text fontSize={LAB_SIZE} color={useColorModeValue("#00000080", "gray.300")} lineHeight="1" noOfLines={1}>
          {label}
        </Text>
        <ValueRow>{children}</ValueRow>
      </VStack>
    </HStack>
  </Tooltip>
);

/* ========= LIVE POWER ========= */
const LivePowerItem = ({ kw, qKvar, updatedAt }: { kw: number; qKvar: number | null; updatedAt?: string }) => (
  <Tooltip label={`Real-time active power${updatedAt ? ` • Updated ${updatedAt}` : ""}`} hasArrow>
    <HStack minW="120px" h="42px" spacing="8px" align="center" flex="0 0 auto">

      <SquareIcon as={FiZap} bg="yellow.300" />
      <VStack align="start" spacing="6px" minW={0}>
        <Text
          w="full"
          textAlign="center"
          fontSize={LAB_SIZE}
          color={useColorModeValue("#00000080", "gray.300")}
          lineHeight="1"
          noOfLines={1}
        >
          P / Q
        </Text>
        <ValueRow>
          <BigNum v={kw} />
          <Unit u="kW" />
          <Sep />
          <ValueText>{qKvar === null || Number.isNaN(qKvar) ? "--" : qKvar.toFixed(2)}</ValueText>
          <Unit u="kVAr" />
        </ValueRow>
      </VStack>
    </HStack>
  </Tooltip>
);

/* ========= CONNECTIONS ========= */
const ConnectionECG = ({ healthy }: { healthy: boolean }) => (
  <Box w="60px" h="10px" color="currentColor" flexShrink={0}>
    {healthy ? (
      <svg viewBox="0 0 60 10" width="60px" height="10px" preserveAspectRatio="none">
        <polyline points="0,5 6,5 11,9 13,1 15,8 20,5 26,5 31,9 33,1 35,8 40,5 46,5 51,9 53,1 55,8 60,5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ) : (
      <svg viewBox="0 0 60 10" width="60px" height="10px" preserveAspectRatio="none">
        <line x1="0" y1="5" x2="60" y2="5" stroke="currentColor" strokeWidth="2" />
      </svg>
    )}
  </Box>
);

const ConnBubble = ({ healthy }: { healthy: boolean }) => (
  <Tooltip label={healthy ? "Protocol connection healthy" : "Protocol connection not healthy"} hasArrow>
    <Box w="10px" h="10px" borderRadius="full" bg={healthy ? "green.300" : "red.300"} border="1px solid" borderColor="blackAlpha.300" flexShrink={0} />
  </Tooltip>
);

const ConnectionsGroup = ({
  dbHealthy, commHealthy,
}: { dbHealthy: boolean; commHealthy: boolean }) => {
  return (
    <Tooltip label="Link Status" hasArrow>
      <HStack
        w={{ base: "125px", xl: "140px" }}
        h="56px"
        spacing="2px"
        align="center"
        flex="0 0 auto"
        ml="0px"
      >
        <VStack
          align="start"
          spacing="5px"
          w="full"
          h="full"
          justify="center"
          pl="0px"
        >
          <Text
            fontSize="11px"
            ml={"60px"}
            fontWeight={600}
            color={useColorModeValue("#00000080", "gray.300")}
            lineHeight="1"
          >
            Link Status
          </Text>
          <HStack w="full" spacing="2px" align="center" pl="58px">
            <ConnBubble healthy={commHealthy} />
            <Tooltip label={dbHealthy ? "DB connection healthy" : "DB connection not healthy"} hasArrow>
              <Box
                bg={useColorModeValue("green.100", "green.700")}
                py={1}
                color={useColorModeValue("gray.800", "gray.100")}
              >
                <ConnectionECG healthy={dbHealthy} />
              </Box>
            </Tooltip>
          </HStack>
        </VStack>
      </HStack>
    </Tooltip>
  );
};

/* ========= CLOCK ========= */
function useClock(tz?: string) {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const timeZone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone });
  const dayNum = parseInt(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone }).format(now), 10);
  const suffix = dayNum % 10 === 1 && dayNum % 100 !== 11 ? "st" : dayNum % 10 === 2 && dayNum % 100 !== 12 ? "nd" : dayNum % 10 === 3 && dayNum % 100 !== 13 ? "rd" : "th";
  const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone }).format(now).replace(".", "");
  const year = new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone }).format(now);
  const prettyDate = `${dayNum}${suffix} ${month}, ${year}`;
  return { prettyDate, time: timeFmt.format(now), timeZone };
}

/* ========= BESS CONTROL SUMMARY ========= */
const BessControlSummary = () => {
  const labelColor = useColorModeValue("#64748B", "#8E9AA3");
  const valueColor = useColorModeValue("#0F172A", "#F1F5F9");

  const panelBg = useColorModeValue(
    "linear-gradient(180deg, #FFFFFF 0%, #F3F6F8 100%)",
    "linear-gradient(180deg, #20272B 0%, #171C1F 100%)"
  );

  const panelBorder = useColorModeValue("#D9E1E5", "#30383D");

  const shadow = useColorModeValue(
    "0 2px 5px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
    "0 2px 7px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
  );

  const DEVICE_ID = "plant_1_plant_device";

  const { data, fetchData } = useTimeseriesData();

  const fetchingToServerObj: { dataSource: TimeseriesDataSource } = {
    dataSource: {
      devices: {
        ids: [DEVICE_ID],
        patterns: [],
      },

      keys: [
        {
          key: "ess_total_soc",
          alias: "SOC",
          keyType: "number",
        },
        {
          key: "soh",
          alias: "SOH",
          keyType: "number",
        },
        {
          key: "inv_total_power",
          alias: "P",
          keyType: "number",
        },
        {
          key: "reactive_power",
          alias: "Q",
          keyType: "number",
        },
        {
          key: "plant_frequency",
          alias: "Frequency",
          keyType: "number",
        },
        {
          key: "cuf_ac",
          alias: "CUF AC",
          keyType: "number",
        },
        {
          key: "cuf_dc",
          alias: "CUF DC",
          keyType: "number",
        },
      ],

      aggregation: {
        func: "none",
        interval: 1,
        intervalType: "minute",
      },

      timeRange: {
        type: "relative",
        relativeType: "currentDaySoFar",
      },

      orderBy: "DESC",
    },
  };

  useEffect(() => {
    fetchData(fetchingToServerObj.dataSource);

    const interval = setInterval(() => {
      fetchData(fetchingToServerObj.dataSource);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getLatestValue = (alias: string) => {
    const root = (data as any)?.data ?? data;
    const deviceData = root?.[DEVICE_ID];

    const series = deviceData?.[alias];

    if (!Array.isArray(series) || series.length === 0) {
      return null;
    }

    return Number(series[0]?.value);
  };

  const formatValue = (
    alias: string,
    decimals = 2,
    unit = ""
  ) => {
    const value = getLatestValue(alias);

    if (value === null || Number.isNaN(value)) {
      return "--";
    }

    return `${value.toFixed(decimals)}${unit ? ` ${unit}` : ""}`;
  };

  const soc = formatValue("SOC", 1, "%");
  const soh = formatValue("SOH", 1, "%");

  const pValue = getLatestValue("P");
  const qValue = getLatestValue("Q");

  const p =
    pValue === null || Number.isNaN(pValue)
      ? "--"
      : `${pValue >= 0 ? "+" : ""}${(pValue / 1000).toFixed(1)} MW`;

  const q =
    qValue === null || Number.isNaN(qValue)
      ? "--"
      : `${qValue >= 0 ? "+" : ""}${(qValue / 1000).toFixed(1)} MVAr`;

  const frequency = formatValue("Frequency", 2, "Hz");
  const cufAc = formatValue("CUF AC", 1, "%");
  const cufDc = formatValue("CUF DC", 1, "%");

  const items = [
    ["EMS", "REMOTE"],
    ["Grid", "CONNECTED"],
    ["Plant State", "RUNNING"],
    ["Battery State", "IDLE"],
    ["Mode", "GFL / PQ"],
    ["BMS", "46/46"],
    ["PCS", "46/46"],
    ["SOC", soc],
    ["SOH", soh],
    ["Frequency", frequency],
    
    ["CUF AC", cufAc],
    ["CUF DC", cufDc],
    ["P Setpoint", p],
    ["Q Setpoint", q],

    
  ];

  return (
    <Box
      w="full"
      px="20px"
      py="2px"
      overflow="hidden"
    >
      <Flex
        w="full"
        align="center"
        justify="space-between"
        gap="8px"
        flexWrap="nowrap"
        whiteSpace="nowrap"
        overflow="hidden"
      >
        {items.map(([label, value], index) => {
          const isPower = label === "P" || label === "Q";
          const isAlarm = label === "Critical Alarm";
          const isHealthy = label === "BMS" || label === "PCS";

          return (
            <React.Fragment key={label}>
              {index > 0 && (
                <Box
                  w="1px"
                  h="20px"
                  flexShrink={0}
                  bg={useColorModeValue(
                    "#CBD5E1",
                    "#3B454B"
                  )}
                />
              )}

              <Box
                position="relative"
                minW="fit-content"
                px="5px"
                py="3px"
                borderRadius="4px"
                bg={panelBg}
                border="1px solid"
                borderColor={panelBorder}
                boxShadow={shadow}
                transition="all 0.22s ease"
                _hover={{
                  transform: "translateY(-1px)",
                }}
              >
                <HStack spacing="4px">
                  {index < 4 && (
  <Box
    w="7px"
    h="7px"
    borderRadius="full"
    bg={
      label === "Battery State"
        ? "linear-gradient(145deg, #FDBA74, #F97316)"
        : "linear-gradient(145deg, #86EFAC, #16A34A)"
    }
    boxShadow={
      label === "Battery State"
        ? "0 0 5px rgba(249,115,22,0.55)"
        : "0 0 5px rgba(34,197,94,0.55)"
    }
    flexShrink={0}
  />
)}

                  <Text
                    fontSize="8px"
                    color={labelColor}
                    fontWeight="500"
                    lineHeight="1"
                  >
                    {label}
                  </Text>

                  {isHealthy && (
                    <Box
                      w="5px"
                      h="5px"
                      borderRadius="full"
                      bg="linear-gradient(145deg, #86EFAC, #16A34A)"
                      boxShadow="0 0 5px rgba(34,197,94,0.45)"
                    />
                  )}

                  <Text
                    fontSize={isPower ? "9px" : "8.5px"}
                    fontWeight="700"
                    color={
                      isAlarm
                        ? "#22C55E"
                        : valueColor
                    }
                    lineHeight="1"
                  >
                    {value}
                  </Text>
                </HStack>

                {isPower && (
                  <Box
                    position="absolute"
                    bottom="1px"
                    left="5px"
                    right="5px"
                    h="1px"
                    bg={
                      label === "P"
                        ? "#F59E0B"
                        : "#38BDF8"
                    }
                    opacity={0.65}
                  />
                )}
              </Box>
            </React.Fragment>
          );
        })}
      </Flex>
    </Box>
  );
};
/* ========= RIGHT CONTROLS ========= */
const RightCornerControls = ({
  eventCount = 0, plantInfo = "Plant information not available",
  onOpenNotif, onOpenInfo, avatarUrl, timeZone,
  isLoggedIn, displayName, handleLogout, navigate,
}: {
  eventCount?: number; plantInfo?: string; onOpenNotif: () => void; onOpenInfo: () => void;
  avatarUrl?: string; timeZone?: string; isLoggedIn?: boolean; displayName?: string;
  handleLogout?: () => void; navigate?: (path: string) => void;
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const chipBg = useColorModeValue("#F1F5F9", "#232A2F");
  const activeBg = useColorModeValue("white", "gray.700");
  const iconClr = useColorModeValue("gray.700", "gray.100");
  const { prettyDate, time, timeZone: tz } = useClock(timeZone);
  const isLight = colorMode === "light";

  return (
    <Box w="310px" minW="310px" maxW="310px" h="58px" flex="0 0 310px" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="flex-start" gap="6px" overflow="visible" pl="0" pr="12px">
      <HStack spacing="6px" align="center" justify="flex-end" w="100%" flexShrink={0}>
        <HStack spacing="0" bg={chipBg} borderRadius="16px" p="2px" w="72px" h="28px" justify="space-between">
          <IconButton aria-label="Light mode" icon={<FiSun />} size="xs" onClick={() => (isLight ? null : toggleColorMode())} bg={isLight ? activeBg : "transparent"} color={iconClr} _hover={{ bg: isLight ? activeBg : "transparent" }} borderRadius="14px" />
          <IconButton aria-label="Dark mode" icon={<FiMoon />} size="xs" onClick={() => (isLight ? toggleColorMode() : null)} bg={!isLight ? activeBg : "transparent"} color={iconClr} _hover={{ bg: !isLight ? activeBg : "transparent" }} borderRadius="14px" />
        </HStack>
        <NotificationBell />
        <Tooltip label={plantInfo} hasArrow>
          <IconButton aria-label="Plant Info" icon={<FiInfo />} size="sm" variant="ghost" />
        </Tooltip>
        {isLoggedIn ? (
          <Menu placement="bottom-end" isLazy closeOnSelect={false}>
            <MenuButton as={Button} variant="ghost" p={0} minW={0} borderRadius="full">
              <Avatar size="sm" name={displayName || "User"} src={avatarUrl} />
            </MenuButton>
            <Portal>
              <MenuList zIndex={2000}>
                <MenuItem onClick={() => navigate && navigate("/users")}>Users</MenuItem>
                {/* <MenuItem onClick={() => navigate && navigate("/profile")}>Profile</MenuItem> */}
                <MenuItem onClick={() => navigate && navigate("/settings")}>Settings</MenuItem>
                <MenuItem onClick={() => navigate && navigate("/userlog")}>
                  Log
                </MenuItem>
                <MenuItem onClick={() => navigate && navigate("/config/device")}>Config</MenuItem>
                <MenuItem onClick={() => handleLogout && handleLogout()}>Logout</MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        ) : (
          <IconButton aria-label="Login" variant="ghost" p={0} minW={0} borderRadius="full" onClick={() => navigate && navigate("/login")} _hover={{ bg: "transparent" }} icon={<Avatar size="sm" />} />
        )}
      </HStack>
      <HStack w="100%" justify="flex-start" spacing="6px" flexShrink={0} whiteSpace="nowrap" pl="95px">
        <Text fontSize="11px" color={useColorModeValue("gray.700", "gray.300")} lineHeight="1">
          {prettyDate}
        </Text>
        <Text fontSize="11px" color={useColorModeValue("gray.700", "gray.300")} lineHeight="1">
          {time}
        </Text>
        <Text fontSize="11px" color={useColorModeValue("gray.700", "gray.300")} lineHeight="1">
          ({tz})
        </Text>
      </HStack>
    </Box>
  );
};

/* ========= SCALE-TO-FIT (adds no visual change except fitting) ========= */
function useScaleToFit() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const cw = containerRef.current?.clientWidth ?? 0;
      const sw = contentRef.current?.scrollWidth ?? 0;
      if (sw > 0) {
        setNaturalWidth(sw);
        setScale(Math.min(1, cw / sw));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  return { containerRef, contentRef, scale, naturalWidth };
}

/* ========= MAIN ========= */
export default function TopRibbonBESS({
  livePowerKw, lifeChargeMWh, lifeDischargeMWh, dailyChargeMWh, dailyDischargeMWh,
  cufAcPct, cufDcPct, updatedAt, leftSlot,
  eventCount = 3, plantInfo = "Plant information not available", plantDetails,
  avatarUrl, timeZone, isLoggedIn, displayName, handleLogout, navigate,
}: Props) {
  // Fetch real EMS health status from backend
  const { flags } = useEmsStatus(60000);
  const dbHealthy = flags ? (flags.is_db_healthy ?? 0) > 0 : false;
  const commHealthy = flags ? (flags.is_protocol_healthy ?? 0) > 0 : false;

  const { data: powerData, fetchData: fetchPowerData } = useTimeseriesData();
  const [qKvar, setQKvar] = useState<number | null>(null);

  useEffect(() => {
    const dataSource: TimeseriesDataSource = {
      devices: { ids: ["plant_1_plant_device"], patterns: [] },
      keys: [{ key: "reactive_power", alias: "Q", keyType: "number" }],
      aggregation: { func: "none", interval: 1, intervalType: "minute" },
      timeRange: { type: "relative", relativeType: "currentDaySoFar" },
      orderBy: "DESC",
    };

    fetchPowerData(dataSource);
    const interval = setInterval(() => fetchPowerData(dataSource), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = (powerData as any)?.data ?? powerData;
    const series = root?.["plant_1_plant_device"]?.Q;
    const latestValue = Array.isArray(series) && series.length > 0
      ? Number(series[0]?.value)
      : null;
    setQKvar(latestValue !== null && !Number.isNaN(latestValue) ? latestValue : null);
  }, [powerData]);

  const { containerRef, contentRef, scale, naturalWidth } = useScaleToFit();

  return (
    <Box bg={useColorModeValue("white", "#161B1B")}borderBottom="none" w="full" minH="50px" px={0} py={0} mt={0} position="relative" zIndex={1200}>
      <Flex position="relative" align="center" justify="space-between" direction="row" gap={{ base: 2, md: 4, xl: 8 }} w="full" minW={0} overflow="hidden">
        {/* LEFT */}
        <Flex align="center" gap="0px" flex="1 1 auto" minW={0} overflow="hidden">
          {/* COGNETA LOGO */}
          <Box
            minW="68px"
            w="68px"
            h="46px"
            flex="0 0 68px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="visible"
          >
            
          </Box>
          {leftSlot && (
            <HStack flexShrink={0} pr="0" ml="-18px">
              {leftSlot}
            </HStack>
          )}

          {/* Metrics rail: single row, auto-scales to fit; no scrollbar/overlap */}
          <Box
            ref={containerRef as any}
            flex="1 1 auto"
            minW={0}
            overflow="hidden"
          >
            <Box
              ref={contentRef as any}
              transform={`scale(${scale})`}
              transformOrigin="left center"
              w={naturalWidth ? `${naturalWidth}px` : "auto"}
              h="46px"
            >
              <Flex
                wrap="nowrap"
                justify="space-between"
                align="center"
                gap="1px"
                minW={0}
                w="max-content"   // intrinsic width so spacing stays Figma-like
              >
                <ConnectionsGroup dbHealthy={dbHealthy} commHealthy={commHealthy} />

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px" />

                <LivePowerItem kw={livePowerKw} qKvar={qKvar} updatedAt={updatedAt} />

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px" />

                <Pill icon={FiBatteryCharging} colorBg="cyan.300" label="Lifetime Charge / Discharge" tooltip="Cumulative energy since commissioning" minW="105px" h="42px">
                  <BigNum v={lifeChargeMWh} />
                  <Sep />
                  <BigNum v={lifeDischargeMWh} />
                  <Unit u="MWh" />
                </Pill>

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px" />

                <Pill icon={FiTrendingUp} colorBg="purple.300" label="Daily Charge / Discharge" tooltip="Energy for today" minW="105px" h="42px">
                  <BigNum v={dailyChargeMWh} />
                  <Sep />
                  <BigNum v={dailyDischargeMWh} />
                  <Unit u="MWh" />
                </Pill>

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px"/>

                <Pill icon={FiActivity} colorBg="orange.300" label="Available Charge / Discharge" tooltip="Available charge and discharge capacity" minW="105px" h="42px">
                  <ValueText>98 MW</ValueText>
                  <Sep />
                  <ValueText>96 MW</ValueText>
                </Pill>

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px" />

                <Pill icon={FiZap} colorBg="blue.300" label="Import / Export" tooltip="Grid Import / Export" minW="105px" h="42px">
                  <ValueText>0 MW</ValueText>
                  <Sep />
                  <ValueText>23.5 MW</ValueText>
                </Pill>

                <MetricDivider display={{ base: "none", md: "block" }} mx="12px" />

                <Pill icon={FiActivity} colorBg="green.300" label="POI Voltage" tooltip="Point of interconnection voltage" minW="105px" h="42px">
                  <ValueText>-- kV</ValueText>
                </Pill>

              </Flex>
            </Box>
          </Box>
        </Flex>

        {/* FUTURE LOGO PLACEHOLDER */}
        <Box
          position="absolute"
          right="230px"
          top="60%"
          transform="translateY(-50%)"
          w="110px"
          h="40px"
          border="1px solid"
          borderColor={useColorModeValue("#CBD5E1", "#475569")}
          borderRadius="4px"
          bg={useColorModeValue("#FFFFFF", "#1E2529")}
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
          zIndex={2}
          pointerEvents="none"
        >
          <Text fontSize="8px" fontWeight="600" color={useColorModeValue("#64748B", "#CBD5E1")}>
            CLIENT-LOGO
          </Text>
        </Box>

        {/* RIGHT */}
        <RightCornerControls eventCount={eventCount} plantInfo={plantInfo} onOpenNotif={() => {}} onOpenInfo={() => {}} avatarUrl={avatarUrl} timeZone={timeZone} isLoggedIn={isLoggedIn} displayName={displayName} handleLogout={handleLogout} navigate={navigate} />
      </Flex>
      {/* Space above divider */}
      <Box h="5px" w="full" />
      {/* Space below divider */}
      <Box h="5px" w="full" />
      {/* BESS CONTROL SUMMARY - SINGLE ROW */}
      <BessControlSummary />
    </Box>
  );
}
// import React, { useEffect, useState, type ReactNode, useRef } from "react";
// import { getWMSStatus } from "../Services/dashboard";
// import { useEmsStatus } from "../hooks/useEmsStatus";
// import {
//   Box, HStack, VStack, Text, Tooltip, Icon, Flex, IconButton, Avatar,
//   Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, useDisclosure,
//   Divider, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton,
//   Image, Grid, GridItem, Heading, Stack, useColorMode, useColorModeValue,
//   Menu, MenuButton, MenuList, MenuItem, MenuGroup, Button, Portal
// } from "@chakra-ui/react";
// import {
//   FiZap, FiBatteryCharging, FiTrendingUp, FiActivity, FiCpu, FiBell, FiInfo,
//   FiSun, FiMoon
// } from "react-icons/fi";
// import imgPlant from "../assets/OIP.jpeg";
// import StaleIndicator from "./Common/StaleIndicator";

// type PlantDetails = {
//   name: string; location: string; date: string; energySystem: string;
//   pvCapacity: string; bessCapacity?: string; dgCapacity?: string; imageUrl: string;
// };

// type Props = {
//   livePowerKw?: number; lifeEnergyMWh?: number;
//   dailyEnergyMWh?: number; cufAcPct?: number; cufDcPct?: number;
//   livePowerTs?: number;
//   lifeEnergyTs?: number;
//   dailyEnergyTs?: number;
//   cufAcTs?: number;
//   cufDcTs?: number;
//   onlineInverters?: number; totalInverters?: number; updatedAt?: string; lastUpdate: number; leftSlot?: ReactNode;
//   eventCount?: number; plantInfo?: string; plantDetails?: PlantDetails;
//   avatarUrl?: string; timeZone?: string;
//   isLoggedIn?: boolean; displayName?: string; handleLogout?: () => void; navigate?: (path: string) => void;
//   generatingCount?: number;
//   stopCount?: number;
//   nonCommCount?: number;
// };

// /* ========= SIZES ========= */
// const VAL_SIZE = "12px"; // number + unit
// const LAB_SIZE = { base: "10px", md: "11px" };

// /* ========= TYPO ========= */
// const ValueText = (props: any) => (
//   <Text
//     as="span"
//     fontSize={VAL_SIZE}
//     fontWeight={600}
//     lineHeight="1"
//     color={useColorModeValue("#000", "whiteAlpha.900")}
//     noOfLines={1}
//     {...props}
//   />
// );
// const BigNum = ({ v }: { v?: number }) => (
//   <ValueText>{v == null ? "-" : v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ValueText>
// );
// const BigNumInt = ({ v }: { v?: number }) => <ValueText>{v == null ? "-" : v.toLocaleString()}</ValueText>;
// const Unit = ({ u }: { u: string }) => <ValueText flexShrink={0}>{" "}{u}</ValueText>;
// const Sep = () => <ValueText>{`\u00A0/\u00A0`}</ValueText>; // non-breaking

// // ensures the whole value stays on ONE line (no wrap, no overlap)
// const ValueRow = ({ children }: { children: ReactNode }) => (
//   <Box
//     as="span"
//     display="inline-flex"
//     alignItems="baseline"
//     columnGap="4px"
//     whiteSpace="nowrap"
//     minW={0}
//     overflow="hidden"
//     textOverflow="ellipsis"
//   >
//     {children}
//   </Box>
// );

// /* ========= ICON (compact) ========= */
// const SquareIcon = ({ as, bg }: { as: any; bg: string }) => (
//   <Box w="20px" h="20px" bg={bg} borderRadius="4px" display="grid" placeItems="center" flexShrink={0}>
//     <Icon as={as} boxSize="12px" color="gray.900" />
//   </Box>
// );

// /* ========= DIVIDER ========= */
// const MetricDivider = (props: any) => (
//   <Box
//     role="separator"
//     aria-hidden="true"
//     w="1px"
//     h="22px"
//     bg={useColorModeValue("#222", "white")}
//     flexShrink={0}
//     {...props}
//   />
// );

// /* ========= PILL ========= */
// const Pill = ({
//   icon, colorBg = "teal.300", label, children, tooltip,
//   minW = "120px", h = "42px", gap = "6px",
// }: {
//   icon: any; colorBg?: string; label: string; children: React.ReactNode; tooltip?: string;
//   minW?: string | number; h?: string | number; gap?: string | number;
// }) => (
//   <Tooltip label={tooltip ?? label} hasArrow>
//     <HStack spacing="8px" flex="0 0 auto" minW={minW} h={h} align="center">

//       <SquareIcon as={icon} bg={colorBg} />
//       <VStack align="start" spacing={gap} w="full" h="full" minW={0} justify="center">
//         <Text fontSize={LAB_SIZE} color={useColorModeValue("#00000080", "gray.300")} lineHeight="1" noOfLines={1}>
//           {label}
//         </Text>
//         <ValueRow>{children}</ValueRow>
//       </VStack>
//     </HStack>
//   </Tooltip>
// );

// /* ========= LIVE POWER ========= */
// const LivePowerItem = ({ kw, updatedAt, ts }: { kw?: number; updatedAt?: string; ts?: number }) => (
//   <Tooltip
//     label={`Real-time active power${updatedAt ? ` • Updated ${updatedAt}` : ""}`}
//     hasArrow
//   >
//     <HStack minW="120px" h="42px" spacing="8px" align="center" flex="0 0 auto">

//       <SquareIcon as={FiZap} bg="yellow.300" />
//       <VStack align="start" spacing="6px" minW={0}>
//         <Text fontSize={LAB_SIZE} color={useColorModeValue("#00000080", "gray.300")} lineHeight="1" noOfLines={1}>
//           Live Power
//         </Text>
//         <HStack spacing={1}>
//           <ValueRow>
//             <BigNum v={kw} />
//             <Unit u="kW" />
//           </ValueRow>

//           <StaleIndicator ts={ts} value={kw} />
//         </HStack>
//       </VStack>
//     </HStack>
//   </Tooltip>
// );

// /* ========= CONNECTIONS ========= */
// const ConnectionECG = ({ healthy }: { healthy: boolean }) => (
//   <Box w="60px" h="10px" color="currentColor" flexShrink={0}>
//     {healthy ? (
//       <svg
//         viewBox="0 0 60 10"
//         width="60px"
//         height="10px"
//         preserveAspectRatio="none"
//       >
//         <polyline
//           points="0,5 6,5 11,9 13,1 15,8 20,5 26,5 31,9 33,1 35,8 40,5 46,5 51,9 53,1 55,8 60,5"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="2"
//           strokeLinecap="round"
//           strokeLinejoin="round"
//           strokeDasharray="120"
//           strokeDashoffset="120"
//         >
//           <animate
//             attributeName="stroke-dashoffset"
//             from="120"
//             to="0"
//             dur="1.2s"
//             repeatCount="indefinite"
//           />
//         </polyline>
//       </svg>
//     ) : (
//       <svg
//         viewBox="0 0 60 10"
//         width="60px"
//         height="10px"
//         preserveAspectRatio="none"
//       >
//         <line
//           x1="0"
//           y1="5"
//           x2="60"
//           y2="5"
//           stroke="currentColor"
//           strokeWidth="2"
//         />
//       </svg>
//     )}
//   </Box>
// );

// const ConnBubble = ({ healthy }: { healthy: boolean }) => (
//   <Tooltip label={healthy ? "Protocol connection healthy" : "Protocol connection not healthy"} hasArrow>
//     <Box w="10px" h="10px" borderRadius="full" bg={healthy ? "green.300" : "red.300"} border="1px solid" borderColor="blackAlpha.300" flexShrink={0} />
//   </Tooltip>
// );

// const ConnectionsGroup = ({
//   dbHealthy, commHealthy,
// }: { dbHealthy: boolean; commHealthy: boolean }) => {
//   const tooltip = dbHealthy ? "DB Connection healthy" : "DB Connection not healthy";
//   return (
//     <Tooltip label={tooltip} hasArrow>
//       <HStack
//         w={{ base: "clamp(140px, 38vw, 160px)", xl: "160px" }}
//         h="56px"
//         spacing="10px"
//         align="center"
//         flex="0 0 auto"
//       >
//         <HStack align="start" mt={10} spacing="15px" w="full" h="full">
//           <Text fontSize="14px" fontWeight={600} mt={"2px"} color={useColorModeValue("#00000080", "gray.300")} lineHeight="1">
//             Link
//           </Text>
//           <HStack w="full" spacing="20px" align="center">
//             <ConnBubble healthy={commHealthy} />
//             <Tooltip label={dbHealthy ? "DB connection healthy" : "DB connection not healthy"} hasArrow>
//               <Box
//                 bg={useColorModeValue("green.100", "green.700")}
//                 py={1}
//                 color={useColorModeValue("gray.800", "gray.100")}
//               >
//                 <ConnectionECG healthy={dbHealthy} />
//               </Box>
//             </Tooltip>
//           </HStack>
//         </HStack>
//       </HStack>
//     </Tooltip>
//   );
// };

// /* ========= CLOCK ========= */
// function useClock(tz?: string) {
//   const [now, setNow] = useState<Date>(new Date());
//   useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
//   const timeZone = tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
//   const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone });
//   const dayNum = parseInt(new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone }).format(now), 10);
//   const suffix = dayNum % 10 === 1 && dayNum % 100 !== 11 ? "st" : dayNum % 10 === 2 && dayNum % 100 !== 12 ? "nd" : dayNum % 10 === 3 && dayNum % 100 !== 13 ? "rd" : "th";
//   const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone }).format(now).replace(".", "");
//   const year = new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone }).format(now);
//   const prettyDate = `${dayNum}${suffix} ${month}, ${year}`;
//   return { prettyDate, time: timeFmt.format(now), timeZone };
// }

// /* ========= RIGHT CONTROLS ========= */
// const RightCornerControls = ({
//   eventCount = 0, plantInfo = "Plant information not available",
//   onOpenNotif, onOpenInfo, avatarUrl, timeZone,
//   isLoggedIn, displayName, handleLogout, navigate, lastUpdate
// }: {
//   eventCount?: number; plantInfo?: string; onOpenNotif: () => void; onOpenInfo: () => void;
//   avatarUrl?: string; timeZone?: string; isLoggedIn?: boolean; displayName?: string; lastUpdate: number;
//   handleLogout?: () => void; navigate?: (path: string) => void;
// }) => {
//   const { colorMode, toggleColorMode } = useColorMode();
//   const chipBg = useColorModeValue("#F1F5F9", "#232A2F");
//   const activeBg = useColorModeValue("white", "gray.700");
//   const iconClr = useColorModeValue("gray.700", "gray.100");
//   const { prettyDate, time, timeZone: tz } = useClock(timeZone);
//   const isLight = colorMode === "light";

//   return (
//     <Box w={{ base: "230px", md: "283px" }} h="58px" display="flex" flexDirection="column" alignItems="flex-end" justifyContent="flex-start" gap="6px" flex="0 0 auto">
//       <HStack spacing="6px" align="center" justify="flex-end" w="100%">
//         <HStack spacing="0" bg={chipBg} borderRadius="16px" p="2px" w="72px" h="28px" justify="space-between">
//           <IconButton aria-label="Light mode" icon={<FiSun />} size="xs" onClick={() => (isLight ? null : toggleColorMode())} bg={isLight ? activeBg : "transparent"} color={iconClr} _hover={{ bg: isLight ? activeBg : "transparent" }} borderRadius="14px" />
//           <IconButton aria-label="Dark mode" icon={<FiMoon />} size="xs" onClick={() => (isLight ? toggleColorMode() : null)} bg={!isLight ? activeBg : "transparent"} color={iconClr} _hover={{ bg: !isLight ? activeBg : "transparent" }} borderRadius="14px" />
//         </HStack>
//         <Tooltip label="Active Events / Alarms" hasArrow>
//           <Box position="relative">
//             <IconButton aria-label="Events / Alarms" icon={<FiBell />} size="sm" variant="ghost" />
//             {!!eventCount && (
//               <Box bg="red.500" borderRadius="full" position="absolute" top="0" right="0" w="8px" h="8px" border="2px solid" borderColor={useColorModeValue("white", "gray.800")} />
//             )}
//           </Box>
//         </Tooltip>
//         {/* <Tooltip label={plantInfo} hasArrow>
//           <IconButton aria-label="Plant Info" icon={<FiInfo />} size="sm" variant="ghost" />
//         </Tooltip> */}
//         {sessionStorage.getItem("token") ? (
//           <Menu placement="bottom-end" isLazy closeOnSelect={false}>
//             <MenuButton as={Button} variant="ghost" p={0} minW={0} borderRadius="full">
//               <Avatar
//                 size="sm"
//                 name={sessionStorage.getItem("userName") || "User"}
//                 bg="teal.400"
//                 color="black"
//               />
//             </MenuButton>
//             <Portal>
//               <MenuList zIndex={2000}>
//                 <MenuItem onClick={() => navigate && navigate("/users")}>Users</MenuItem>
//                 {/* <MenuItem onClick={() => navigate && navigate("/profile")}>Profile</MenuItem> */}
//                 <MenuItem onClick={() => navigate && navigate("/settings")}>Settings</MenuItem>
//                 <MenuItem onClick={() => navigate && navigate("/userlog")}>
//                   Log
//                 </MenuItem>
//                 {/* <MenuItem onClick={() => navigate && navigate("/config/device")}>Config</MenuItem> */}
//                 <MenuItem onClick={() => handleLogout && handleLogout()}>Logout</MenuItem>
//               </MenuList>
//             </Portal>
//           </Menu>
//         ) : (
//           <IconButton aria-label="Login" variant="ghost" p={0} minW={0} borderRadius="full" onClick={() => navigate && navigate("/login")} _hover={{ bg: "transparent" }} icon={<Avatar size="sm" />} />
//         )}
//       </HStack>
//       <Text fontSize="10px" color={useColorModeValue("gray.700", "gray.300")} lineHeight="1" textAlign="left">
//         {prettyDate} &nbsp; {time} &nbsp; ({tz})
//         {/* Last Update At: {new Date(lastUpdate).toUTCString()} */}
//       </Text>
//       <Text fontSize="8px" color={useColorModeValue("gray.700", "gray.300")} lineHeight="1" textAlign="left">
//         {/* {prettyDate} &nbsp; {time} &nbsp; ({tz}) <br />< br /> */}
//         Last Update At: {new Date(lastUpdate).toUTCString().replace("GMT", " ")}
//       </Text>
//     </Box>
//   );
// };

// /* ========= SCALE-TO-FIT (adds no visual change except fitting) ========= */
// function useScaleToFit() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);
//   const [scale, setScale] = useState(1);
//   const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

//   useEffect(() => {
//     const ro = new ResizeObserver(() => {
//       const cw = containerRef.current?.clientWidth ?? 0;
//       const sw = contentRef.current?.scrollWidth ?? 0;
//       if (sw > 0) {
//         setNaturalWidth(sw);
//         setScale(Math.min(1, cw / sw));
//       }
//     });
//     if (containerRef.current) ro.observe(containerRef.current);
//     if (contentRef.current) ro.observe(contentRef.current);
//     return () => ro.disconnect();
//   }, []);

//   return { containerRef, contentRef, scale, naturalWidth };
// }

// /* ========= MAIN ========= */
// export default function TopRibbonBESS({
//   livePowerKw, lifeEnergyMWh, dailyEnergyMWh,
//   cufAcPct, cufDcPct, livePowerTs, lifeEnergyTs, dailyEnergyTs, cufAcTs, cufDcTs, updatedAt, lastUpdate, leftSlot,
//   eventCount = 3, plantInfo = "Plant information not available", plantDetails,
//   avatarUrl, timeZone, isLoggedIn, displayName, handleLogout, navigate,
//   generatingCount, stopCount, nonCommCount,
// }: Props) {
//   // Fetch real EMS health status from backend
//   const { flags } = useEmsStatus(60000);
//   const hasDeviceStatus =
//     (generatingCount ?? 0) +
//     (stopCount ?? 0) +
//     (nonCommCount ?? 0) > 0;
//   const dbHealthy = flags ? (flags.is_db_healthy ?? 0) > 0 : false;
//   const commHealthy = flags ? (flags.is_protocol_healthy ?? 0) > 0 : false;

//   // Inverter online/total mapping (like WMSStatusCard)
//   const [onlineInverters, setOnlineInverters] = useState(0);
//   const [totalInverters, setTotalInverters] = useState(0);

//   useEffect(() => {
//     const fetchInverterStatus = async () => {
//       try {
//         const res = await getWMSStatus({
//           pattern: "_inverter_inverter", // inverter pattern, adjust as needed
//           column: "active_power",
//         });
//         const data = res.data;
//         setOnlineInverters(data.active); // active ---- Online
//         setTotalInverters(data.device_list.length);  // online ---- Total
//       } catch (err) {
//         setOnlineInverters(0);
//         setTotalInverters(0);
//       }
//     };
//     fetchInverterStatus();
//   }, []);

//   const { containerRef, contentRef, scale, naturalWidth } = useScaleToFit();

//   return (
//     <Box bg={useColorModeValue("white", "#161B1B")} borderBottom="1px solid" borderColor="green.700" w="full" minH="96px" px={0} py={{ base: 2, md: 3, xl: 4 }} position="relative" zIndex={1200}>
//       <Flex align="center" justify="space-between" direction="row" gap={{ base: 2, md: 4, xl: 8 }}>
//         {/* LEFT */}
//         <Flex align="center" gap={{ base: 2, md: 3 }} flex="1 1 auto" minW={0}>
//           {leftSlot && <HStack flexShrink={0} pr={2}>{leftSlot}</HStack>}

//           {/* Metrics rail: single row, auto-scales to fit; no scrollbar/overlap */}
//           <Box
//             ref={containerRef as any}
//             flex="1 1 auto"
//             minW={0}
//             overflow="hidden"
//           >
//             <Box
//               ref={contentRef as any}
//               transform={`scale(${scale})`}
//               transformOrigin="left center"
//               w={naturalWidth ? `${naturalWidth}px` : "auto"}
//               h="46px"
//             >
//               <Flex
//                 wrap="nowrap"
//                 justify="space-between"
//                 align="center"
//                 gap={{ base: 3, lg: 6 }}
//                 minW={0}
//                 w="max-content"   // intrinsic width so spacing stays Figma-like
//               >
//                 <ConnectionsGroup dbHealthy={dbHealthy} commHealthy={commHealthy} />

//                 <Box
//                   position="relative"
//                   display="flex"
//                   alignItems="center"
//                   justifyContent="center"
//                   minW="30px"
//                   h="46px"
//                 >
//                   {/* outer radar ring */}
//                   <Box
//                     position="absolute"
//                     w="42px"
//                     h="42px"
//                     borderRadius="full"
//                     border="2px solid"
//                     borderColor={
//                       !hasDeviceStatus
//                         ? "gray.400"
//                         : nonCommCount
//                           ? "gray.400"
//                           : stopCount
//                             ? "red.400"
//                             : "green.300"
//                     }

//                     opacity={0.7}
//                     animation={
//                       nonCommCount
//                         ? "radarPulse 2.8s infinite"
//                         : stopCount
//                           ? "dangerPulse 1s infinite"
//                           : "energyRing 1.6s infinite"
//                     }
//                     sx={{
//                       "@keyframes energyRing": {
//                         "0%": {
//                           transform: "scale(0.9)",
//                           opacity: 0.9,
//                         },
//                         "70%": {
//                           transform: "scale(1.35)",
//                           opacity: 0,
//                         },
//                         "100%": {
//                           opacity: 0,
//                         },
//                       },
//                       "@keyframes dangerPulse": {
//                         "0%": {
//                           transform: "scale(0.95)",
//                           opacity: 1,
//                         },
//                         "50%": {
//                           transform: "scale(1.2)",
//                           opacity: 0.2,
//                         },
//                         "100%": {
//                           transform: "scale(0.95)",
//                           opacity: 1,
//                         },
//                       },
//                       "@keyframes radarPulse": {
//                         "0%": {
//                           transform: "scale(1)",
//                           opacity: 0.4,
//                         },
//                         "50%": {
//                           transform: "scale(1.25)",
//                           opacity: 0.1,
//                         },
//                         "100%": {
//                           transform: "scale(1)",
//                           opacity: 0.4,
//                         },
//                       },
//                     }}
//                   />

//                   {/* rotating glow ring */}
//                   <Box
//                     position="absolute"
//                     w="38px"
//                     h="38px"
//                     borderRadius="full"
//                     border="2px dashed"
//                     borderColor={
//                       !hasDeviceStatus
//                         ? "gray.500"
//                         : nonCommCount
//                           ? "gray.500"
//                           : stopCount
//                             ? "red.500"
//                             : "green.400"
//                     }

//                     animation="spinRing 4s linear infinite"
//                     sx={{
//                       "@keyframes spinRing": {
//                         from: {
//                           transform: "rotate(0deg)",
//                         },
//                         to: {
//                           transform: "rotate(360deg)",
//                         },
//                       },
//                     }}
//                   />

//                   {/* main icon core */}
//                   <Tooltip
//                     label={
//                       !hasDeviceStatus
//                         ? "No Device Data"
//                         : nonCommCount
//                           ? "Plant No Communication"
//                           : stopCount
//                             ? "Plant Non Generating"
//                             : "Plant Generating"
//                     }
//                     hasArrow
//                   >
//                     <Box
//                       position="relative"
//                       zIndex={2}
//                       w="26px"
//                       h="26px"
//                       borderRadius="8px"
//                       bg={
//                         !hasDeviceStatus
//                           ? "gray.500"
//                           : nonCommCount
//                             ? "gray.500"
//                             : stopCount
//                               ? "red.500"
//                               : "green.400"
//                       }
//                       display="grid"
//                       placeItems="center"
//                       boxShadow={
//                         nonCommCount
//                           ? "0 0 12px rgba(120,120,120,0.5)"
//                           : stopCount
//                             ? "0 0 18px rgba(255,0,0,0.6)"
//                             : "0 0 20px rgba(0,255,120,0.7)"
//                       }
//                       animation={
//                         nonCommCount
//                           ? "floatIdle 3s ease-in-out infinite"
//                           : stopCount
//                             ? "shakeAlert 0.5s infinite"
//                             : "powerBounce 1.5s ease-in-out infinite"
//                       }
//                       sx={{
//                         "@keyframes powerBounce": {
//                           "0%,100%": {
//                             transform: "translateY(0px)",
//                           },
//                           "50%": {
//                             transform: "translateY(-4px)",
//                           },
//                         },
//                         "@keyframes shakeAlert": {
//                           "0%": {
//                             transform: "translateX(0px)",
//                           },
//                           "25%": {
//                             transform: "translateX(-2px)",
//                           },
//                           "50%": {
//                             transform: "translateX(2px)",
//                           },
//                           "75%": {
//                             transform: "translateX(-2px)",
//                           },
//                           "100%": {
//                             transform: "translateX(0px)",
//                           },
//                         },
//                         "@keyframes floatIdle": {
//                           "0%,100%": {
//                             transform: "translateY(0px)",
//                           },
//                           "50%": {
//                             transform: "translateY(-2px)",
//                           },
//                         },
//                       }}
//                     >
//                       <Icon
//                         as={
//                           !hasDeviceStatus
//                             ? FiInfo
//                             : nonCommCount
//                               ? FiInfo
//                               : stopCount
//                                 ? FiActivity
//                                 : FiZap
//                         }


//                         boxSize="14px"
//                         color="black"
//                       />
//                     </Box>
//                   </Tooltip>
//                 </Box>

//                 <MetricDivider display={{ base: "none", md: "block" }} />

//                 <LivePowerItem kw={livePowerKw} updatedAt={updatedAt} ts={livePowerTs} />

//                 <MetricDivider display={{ base: "none", md: "block" }} />

//                 <Pill
//                   icon={FiBatteryCharging}
//                   colorBg="cyan.300"
//                   label="Lifetime Energy"
//                   tooltip="Cumulative energy since commissioning"
//                   minW="120px"
//                   h="42px"
//                 >
//                   <HStack spacing={1}>

//                     <ValueRow>
//                       <BigNum v={lifeEnergyMWh} />
//                       <Unit u="MWh" />
//                     </ValueRow>

//                     <StaleIndicator ts={lifeEnergyTs} value={lifeEnergyMWh} />

//                   </HStack>
//                 </Pill>

//                 <MetricDivider display={{ base: "none", md: "block" }} />

//                 <Pill
//                   icon={FiTrendingUp}
//                   colorBg="purple.300"
//                   label="Daily Energy"
//                   tooltip="Energy for today"
//                   minW="120px"
//                   h="42px"
//                 >
//                   <HStack spacing={1}>

//                     <ValueRow>
//                       <BigNum v={dailyEnergyMWh} />
//                       <Unit u="MWh" />
//                     </ValueRow>

//                     <StaleIndicator ts={dailyEnergyTs} value={dailyEnergyMWh} />

//                   </HStack>
//                 </Pill>

//                 <MetricDivider display={{ base: "none", md: "block" }} />

//                 <Pill icon={FiActivity} colorBg="orange.300" label="CUF (AC / DC)" tooltip="Capacity Utilization Factor" minW="120px" h="42px">
//                   <ValueText>{cufAcPct == null ? "-" : `${cufAcPct.toFixed(2)}%`}</ValueText>
//                   <Sep />
//                   <ValueText>{cufDcPct == null ? "-" : `${cufDcPct.toFixed(2)}%`}</ValueText>

//                   <StaleIndicator
//                     ts={Math.max(cufAcTs || 0, cufDcTs || 0)}
//                     value={`${cufAcPct}-${cufDcPct}`}
//                   />
//                 </Pill>

//                 <MetricDivider display={{ base: "none", md: "block" }} />

//                 <Pill icon={FiCpu} colorBg="green.300" label="Inverters Online" tooltip="Operational inverters / total installed" minW="120px" h="42px">
//                   <BigNumInt v={onlineInverters} />
//                   <Sep />
//                   <BigNumInt v={totalInverters} />
//                 </Pill>
//               </Flex>
//             </Box>
//           </Box>
//         </Flex>

//         {/* RIGHT */}
//         <RightCornerControls lastUpdate={lastUpdate} eventCount={eventCount} plantInfo={plantInfo} onOpenNotif={() => { }} onOpenInfo={() => { }} avatarUrl={avatarUrl} timeZone={timeZone} isLoggedIn={isLoggedIn} displayName={displayName} handleLogout={handleLogout} navigate={navigate} />
//       </Flex>
//     </Box>
//   );
// }