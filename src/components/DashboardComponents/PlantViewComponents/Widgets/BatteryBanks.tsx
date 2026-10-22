import React, { useEffect } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Progress,
  useColorModeValue,
  useBreakpointValue,
} from "@chakra-ui/react";
import useBatteryBank from "../../../../hooks/PlantView/useBatteryBank";
import { useNavigate } from "react-router-dom";

type Bank = {
  device_id: string;
  soc: number;
  active_device: number;
  non_active_device: number;
  amps : string;
  voltage : string;
  latest_temp : number;
  max_temp : number;
  dod?: number;
  soh?: number;
};



/** Tile with controllable value row box */
const Tile: React.FC<{
  title: string;
  value?: string | number;
  sub?: string;
  bg: string;
  flexGrow?: number;
  valueBox?: {
    width?: number;   
    height?: number;  
    gapPx?: number;   
    angleDeg?: number;
    opacity?: number; 
  };
}> = ({ title, value, sub, bg, flexGrow = 1, valueBox }) => {
  const titleFs = useBreakpointValue({ base: "10px", md: "11px" });
  const valFs = useBreakpointValue({ base: "10px", md: "11px" });
  const padX = useBreakpointValue({ base: "10px", md: "12px" });
  const padY = useBreakpointValue({ base: "6px", md: "8px" });
  const h = useBreakpointValue({ base: "50px", md: "54px" });

  const titleColor = useColorModeValue("blackAlpha.700", "whiteAlpha.800");
  const valueColor = useColorModeValue("blackAlpha.900", "white");
  const subColor = useColorModeValue("blackAlpha.700", "whiteAlpha.800");
  const ring = useColorModeValue(
    "inset 0 0 0 1px rgba(0,0,0,0.06)",
    "inset 0 0 0 1px rgba(255,255,255,0.06)"
  );

  // value row sizing
  const rowW = valueBox?.width !== undefined ? `${valueBox.width}px` : "100%";
  const rowH = valueBox?.height !== undefined ? `${valueBox.height}px` : undefined;
  const rowGap = valueBox?.gapPx !== undefined ? `${valueBox.gapPx}px` : "6px";
  const rowAngle = valueBox?.angleDeg !== undefined ? `rotate(${valueBox.angleDeg}deg)` : undefined;
  const rowOpacity = valueBox?.opacity ?? 1;
  const rowLineH = valueBox?.height !== undefined ? `${valueBox.height}px` : undefined;

  return (
    <VStack
      align="start"
      spacing="4px"
      bg={bg}
      px={padX}
      py={padY}
      rounded="lg"
      height={h}
      justify="center"
      boxShadow={ring}
      flex={`${flexGrow} 1 0`}
      minW={0}
    >
      <Text color={titleColor} fontSize={titleFs} lineHeight="14px" title={title} isTruncated>
        {title}
      </Text>

      <HStack
        spacing={rowGap}
        w={rowW}
        h={rowH}
        minW={0}
        align="center"
        transform={rowAngle}
        opacity={rowOpacity}
        overflow="hidden"
        whiteSpace="nowrap"
      >
        <Text
          color={valueColor}
          fontWeight="semibold"
          fontSize={valFs}
          title={String(value ?? "")}
          minW={0}
          textOverflow="ellipsis"
          noOfLines={1}
          lineHeight={rowLineH}
        >
          {value}
        </Text>

        {sub && (
          <>
            <Text color={subColor} fontSize={valFs} flexShrink={0} lineHeight={rowLineH}>
              |
            </Text>
            <Text
              color={subColor}
              fontSize={valFs}
              title={sub}
              minW={0}
              textOverflow="ellipsis"
              noOfLines={1}
              lineHeight={rowLineH}
            >
              {sub}
            </Text>
          </>
        )}
      </HStack>
    </VStack>
  );
};

const formatBankName = (id: string) => {
  return id
    .replace(/^plant_\d+_/, "")
    .replace("bank_bank", "bank")
    .replace(/_/g, " ")
    .replace("pcs", "PCS");
};

const BatteryRow: React.FC<{ bank: Bank }> = ({ bank }) => {
  // light/dark
  const cardBg = useColorModeValue("white", "#0F1215");
  const nameColor = useColorModeValue("black", "white");
  const socTextColor = useColorModeValue("blackAlpha.700", "whiteAlpha.800");
  const cardShadow = useColorModeValue(
    "0 0 0 1px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06)",
    "0 0 0 1px rgba(255,255,255,0.06), 0 6px 20px rgba(0,0,0,0.25)"
  );
  const barBg = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const barFill = useColorModeValue("#14B8A6", "#22D3EE");

  const connectedBg = useColorModeValue("#C2FFE9", "#18463E");
  const disabledBg  = useColorModeValue("#F2F2F5", "#3B3A3E");
  const stringsBg   = useColorModeValue("#EBEFFF", "#27315A");
  const tempsBg     = useColorModeValue("#FFE6E6", "#5D3433");

  const nameFs = useBreakpointValue({ base: "14px", md: "15px" });
  const socBarW = useBreakpointValue({ base: "120px", md: "140px" });
  const gap = useBreakpointValue({ base: "10px", md: "12px" });
  // Placeholder DoD and SoH values (replace with real data if available)
  const dod = bank.dod ?? 60; // fallback to 60 if not present
  const soh = bank.soh ?? 90; // fallback to 90 if not present

  // fixed value box spec for Strings & Module Temps
  const fixedValueBox = { width: 120, height: 21, gapPx: 4, angleDeg: 0, opacity: 1 };
  const navigate = useNavigate();
  return (
    <Box
      w="100%"
      bg={cardBg}
      rounded="12px"
      px={{ base: "12px", md: "14px", lg: "16px" }}
      py={{ base: "8px", md: "10px", lg: "12px" }}
      mb={"20px"}
    >
      <HStack spacing={gap} align="center" w="100%" wrap="nowrap" overflow="hidden">
        <VStack align="start" spacing="6px" flex="0 0 auto" minW="140px">
          <Text color={nameColor} fontWeight="semibold" cursor={"pointer"} textTransform={"capitalize"} fontSize={nameFs} noOfLines={1} title={bank.device_id}
            onClick={() => navigate('/batterybankk', {state : {currentBank : bank.device_id}})}
          >
            {formatBankName(bank.device_id)}
          </Text>
          {/* SoC, DoD, SoH Bars in a single row with left labels */}
          <VStack align="start" spacing={0} w="100%">
            <HStack spacing={1} align="center">
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">SoC</Text>
              <Progress
                value={bank.soc}
                height="6px"
                rounded="full"
                w={socBarW}
                sx={{
                  "& > div": { bg: barFill },
                  bg: barBg,
                }}
              />
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">{bank.soc}%</Text>
            </HStack>
            <HStack spacing={1} align="center">
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">DoD</Text>
              <Progress
                value={dod}
                height="6px"
                rounded="full"
                w={socBarW}
                sx={{
                  "& > div": { bg: "#F59E42" },
                  bg: barBg,
                }}
              />
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">{dod}%</Text>
            </HStack>
            <HStack spacing={1} align="center">
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">SoH</Text>
              <Progress
                value={soh}
                height="6px"
                rounded="full"
                w={socBarW}
                sx={{
                  "& > div": { bg: "#6DA2FF" },
                  bg: barBg,
                }}
              />
              <Text color={socTextColor} fontSize={{ base: "8px", md: "8px" }} minW="28px">{soh}%</Text>
            </HStack>
          </VStack>
        </VStack>

        {/* smaller */}
        <Box ml={"-10px"}>
          <Tile title="Connected" value={bank.active_device} bg={connectedBg} flexGrow={0.9} />
        </Box>
        <Tile title="Disabled" value={bank.non_active_device} bg={disabledBg} flexGrow={0.9} />

        {/* larger + fixed value row size */}
        <Tile
          title="Strings"
          value={bank.voltage + " V"}
          sub={bank.amps + " A"}
          bg={stringsBg}
          flexGrow={1.6}
          valueBox={fixedValueBox}
        />
        <Tile
          title="Module Temps"
          value={bank.latest_temp + " ℃"}
          sub={bank.max_temp + " ℃"}
          bg={tempsBg}
          flexGrow={1.6}
          valueBox={fixedValueBox}
        />
      </HStack>
    </Box>
  );
};

const BatteryBanks: React.FC = () => {
  const headerColor = useColorModeValue("black", "white");
//   const banks: Bank[] = [
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
//   { name: "PCS 2 Bank 1", soc: 80, connected: 10, disabled: 0, strings: { voltage: "623.60 V", current: "33.50 A" }, temps: { t1: "27.54 ℃", t2: "31.75 ℃" } },
// ];

  const {fetchData, data : banks} = useBatteryBank();

  useEffect(() => {
    fetchData("plant_1");
  }, []);

  // console.log("DATA: ", banks)
  
  return (
    <VStack align="stretch" gap={"20px"} w="100%" h={"100%"}>
      <Text color={headerColor} fontWeight="semibold" fontSize={{ base: "16px", md: "18px" }}>
        Battery Banks
      </Text>
    <Box
      height={"880px"}
      width={"100%"}
      overflowY={"auto"}
    >
      {banks ? banks.map((b : Bank, i : number) => (
        <BatteryRow key={i} bank={b} />
      )) : <></>}
    </Box>
    </VStack>
  );
};

export default BatteryBanks;



