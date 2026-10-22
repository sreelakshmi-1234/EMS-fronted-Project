import { useMemo } from "react";

import {
  Box,
  Text,
  HStack,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";

import {
  AlertTriangle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

import { useAlarmLatest } from "../../../hooks/useAlarmLatest";
import { useNavigate } from "react-router-dom";

const MeterCard = () => {
  const { rows } = useAlarmLatest();
  const navigate = useNavigate();

  /* =====================================================
     THEME
  ===================================================== */

  const primaryBg = useColorModeValue(
    "primary.light",
    "primary.dark"
  );

  const primaryColor = useColorModeValue(
    "primaryText.light",
    "primaryText.dark"
  );

  const secondaryColor = useColorModeValue(
    "secondaryText.light",
    "secondaryText.dark"
  );

  /* ---------- Device Card ---------- */

  const alarmCardBg = useColorModeValue(
    "#FFFFFF",
    "gray.700"
  );

  const alarmCardBorder = useColorModeValue(
    "#D9E2EC",
    "gray.600"
  );

  const tooltipBg = useColorModeValue(
    "#FFFFFF",
    "#1A202C"
  );

  const tooltipColor = useColorModeValue(
    "#1A202C",
    "#F7FAFC"
  );

  const tooltipMutedColor = useColorModeValue(
    "#718096",
    "#CBD5E0"
  );

  const tooltipBorder = useColorModeValue(
    "#E2E8F0",
    "#4A5568"
  );

    /* =====================================================
      SHOW ONLY FIRST 2
    ===================================================== */

  const bankAlarms = useMemo(
    () => rows.filter((row) => /_bank(?:_bank)?[_-]?\d+/i.test(row.device)),
    [rows]
  );

  const visibleAlarms = bankAlarms.slice(0, 2);
  const alarmCount = bankAlarms.length;
  const warningCount = bankAlarms.filter(
    (row) => row.severity?.toLowerCase() === "warning"
  ).length;

  return (
    <Box
      width="100%"
      height="300px"
      p="14px"
      borderRadius="12px"
      bg={primaryBg}
      color={primaryColor}
      overflow="hidden"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <HStack
        width="100%"
        height="34px"
        justifyContent="space-between"
        alignItems="center"
        mb="9px"
      >
        {/* LEFT */}
        <HStack spacing="8px">
          

          <Text
            fontSize="18px"
            fontWeight="600"
            lineHeight="1"
          >
            Active Alarm
          </Text>
        </HStack>

        {/* VIEW ALL */}

        <HStack
          spacing="2px"
          px="8px"
          height="27px"
          borderRadius="6px"
          border="1px solid"
          borderColor={useColorModeValue(
            "#CBD5E0",
            "gray.600"
          )}
          bg={useColorModeValue(
            "white",
            "whiteAlpha.100"
          )}
          cursor="pointer"
          _hover={{
            bg: useColorModeValue(
              "gray.50",
              "whiteAlpha.200"
            ),
          }}
          onClick={() =>
            navigate("/alarms/latest")
          }
        >
          <Text
            fontSize="9px"
            fontWeight="600"
          >
            View All
          </Text>

          <ChevronRight size={12} />
        </HStack>
      </HStack>

      {/* ================================================= */}
      {/* DEVICE / ALARM CARDS */}
      {/* ================================================= */}

      <Box
        display="grid"
        gridTemplateColumns="1fr"
        gap="6px"
      >
        {visibleAlarms.map((row, index) => (
          <Tooltip
            key={`${row.device}-${row.type}-${index}`}
            hasArrow
            placement="top"
            bg={tooltipBg}
            color={tooltipColor}
            border="1px solid"
            borderColor={tooltipBorder}
            borderRadius="8px"
            boxShadow="lg"
            px="12px"
            py="9px"
            maxW="260px"
            label={
              <Box fontSize="11px" lineHeight="1.55">
                <Text
                  fontSize="13px"
                  fontWeight="700"
                  mb="4px"
                  color={tooltipColor}
                >
                  Alarm Details
                </Text>
                <Text color={tooltipMutedColor}>
                  Severity: <Box as="span" color={tooltipColor} fontWeight="600">{row.severity || "Info"}</Box>
                </Text>
                <Text color={tooltipMutedColor}>
                  Status: <Box as="span" color={tooltipColor} fontWeight="600">{row.status || "ACTIVE"}</Box>
                </Text>
                <Text color={tooltipMutedColor}>
                  Tag: <Box as="span" color={tooltipColor} fontWeight="600">{row.type || "RUN"}</Box>
                </Text>
                <Text color={tooltipMutedColor}>
                  Time: <Box as="span" color={tooltipColor} fontWeight="600">{row.time || "--"}</Box>
                </Text>
                <Text color={tooltipMutedColor} noOfLines={1}>
                  Device: <Box as="span" color={tooltipColor} fontWeight="600">{row.device || "Unknown"}</Box>
                </Text>
              </Box>
            }
          >
            <Box
              height="68px"
              borderRadius="7px"
              bg={alarmCardBg}
              border="1px solid"
              borderColor={alarmCardBorder}
              px="6px"
              py="4px"
              overflow="hidden"
              position="relative"
            >
            <Box
              position="absolute"
              left="0"
              top="0"
              bottom="0"
              width="3px"
              bg="#3182CE"
              borderRadius="7px 0 0 7px"
            />

            <HStack
              justify="space-between"
              align="center"
              height="15px"
              mb="3px"
              pl="3px"
            >
              <Box
                px="5px"
                height="15px"
                display="flex"
                alignItems="center"
                borderRadius="5px"
                bg="rgba(49,130,206,0.10)"
              >
                <Text
                  fontSize="9px"
                  lineHeight="1"
                  fontWeight="500"
                  color="#3182CE"
                  whiteSpace="nowrap"
                >
                  ⓘ&nbsp; Severity:{" "}
                  <Box as="span" fontWeight="700">
                    {row.severity || "Info"}
                  </Box>
                </Text>
              </Box>

              <Tooltip
                hasArrow
                placement="top"
                label={row.status || "ACTIVE"}
                bg={tooltipBg}
                color={tooltipColor}
                border="1px solid"
                borderColor={tooltipBorder}
                borderRadius="6px"
                boxShadow="md"
                px="8px"
                py="4px"
              >
                <Box
                  width="15px"
                  height="15px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderRadius="5px"
                  bg="rgba(56,178,172,0.12)"
                  cursor="help"
                >
                  <Box
                    width="6px"
                    height="6px"
                    borderRadius="50%"
                    bg="#16A36A"
                  />
                </Box>
              </Tooltip>
            </HStack>

            <Box pl="4px">
              <HStack height="12px" spacing="5px">
                <Text
                  width="45px"
                  fontSize="9px"
                  lineHeight="12px"
                  color={secondaryColor}
                  fontWeight="500"
                >
                  ♢&nbsp; Tag
                </Text>
                <Text
                  fontSize="9px"
                  lineHeight="12px"
                  color={primaryColor}
                  fontWeight="600"
                  noOfLines={1}
                >
                  {row.type || "RUN"}
                </Text>
              </HStack>

              <HStack height="12px" spacing="5px">
                <Text
                  width="45px"
                  fontSize="9px"
                  lineHeight="12px"
                  color={secondaryColor}
                  fontWeight="500"
                >
                  ◷&nbsp; Time
                </Text>
                <Text
                  fontSize="9px"
                  lineHeight="12px"
                  color={primaryColor}
                  fontWeight="500"
                  noOfLines={1}
                >
                  {row.time || "--"}
                </Text>
              </HStack>

              <HStack height="12px" spacing="5px">
                <Text
                  width="45px"
                  fontSize="9px"
                  lineHeight="12px"
                  color={secondaryColor}
                  fontWeight="500"
                >
                  ⚙&nbsp; Device
                </Text>
                <Text
                  fontSize="9px"
                  lineHeight="12px"
                  color={primaryColor}
                  fontWeight="600"
                  noOfLines={1}
                >
                  {(() => {
                    const device = row.device || "Unknown";
                    const match = device.match(/(?:inverter|pcs)[_-]?(\d+)/i);

                    if (match) {
                      const type = device.toLowerCase().includes("pcs")
                        ? "PCS"
                        : "Inverter";

                      return `${type}-${match[1]}`;
                    }

                    return device
                      .replace(/^plant_1[_-]?/i, "")
                      .replace(/_/g, " ");
                  })()}
                </Text>
              </HStack>
            </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>

      {/* ================================================= */}
      {/* MORE DEVICES */}
      {/* ================================================= */}

      {bankAlarms.length > 2 && (
        <Box
          width="100%"
          height="18px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mt="4px"
        >
          <Text
            fontSize="9px"
            fontWeight="600"
            color={secondaryColor}
            cursor="pointer"
            _hover={{
              textDecoration: "underline",
            }}
            onClick={() =>
              navigate("/alarms/latest")
            }
          >
            +{bankAlarms.length - 2} more device
          </Text>
        </Box>
      )}

      {/* ================================================= */}
      {/* ALARM + WARNING SUMMARY */}
      {/* ================================================= */}

      <HStack
        width="100%"
        spacing="8px"
        mt={bankAlarms.length > 2 ? "5px" : "9px"}
      >
        {/* ================= ALARMS ================= */}

        <Box
          flex="1"
          height="61px"
          borderRadius="9px"
          px="9px"
          py="7px"
          bg={useColorModeValue(
            "rgba(255, 80, 80, 0.10)",
            "rgba(255, 80, 80, 0.18)"
          )}
          border="1px solid"
          borderColor={useColorModeValue(
            "rgba(255, 80, 80, 0.25)",
            "rgba(255, 100, 100, 0.22)"
          )}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "sm",
          }}
          onClick={() =>
            navigate("/alarms/latest")
          }
        >
          <HStack
            spacing="7px"
            height="100%"
            alignItems="center"
          >
            <Box
              width="28px"
              height="28px"
              minWidth="28px"
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255, 60, 60, 0.10)"
            >
              <AlertCircle
                color="#FF3030"
                size={17}
              />
            </Box>

            <Box>
              <Text
                fontSize="17px"
                fontWeight="700"
                lineHeight="16px"
              >
                {alarmCount}
              </Text>

              <Text
                fontSize="9px"
                fontWeight="500"
                color={secondaryColor}
                lineHeight="11px"
              >
                ALARMS
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* ================= WARNINGS ================= */}

        <Box
          flex="1"
          height="61px"
          borderRadius="9px"
          px="9px"
          py="7px"
          bg={useColorModeValue(
            "rgba(255, 180, 0, 0.10)",
            "rgba(255, 190, 70, 0.17)"
          )}
          border="1px solid"
          borderColor={useColorModeValue(
            "rgba(255, 180, 0, 0.25)",
            "rgba(255, 190, 70, 0.22)"
          )}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "sm",
          }}
          onClick={() =>
            navigate("/alarms/latest")
          }
        >
          <HStack
            spacing="7px"
            height="100%"
            alignItems="center"
          >
            <Box
              width="28px"
              height="28px"
              minWidth="28px"
              borderRadius="50%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="rgba(255, 180, 0, 0.10)"
            >
              <AlertTriangle
                color="#FFA500"
                size={17}
              />
            </Box>

            <Box>
              <Text
                fontSize="17px"
                fontWeight="700"
                lineHeight="16px"
              >
                {warningCount}
              </Text>

              <Text
                fontSize="9px"
                fontWeight="500"
                color={secondaryColor}
                lineHeight="11px"
              >
                WARNINGS
              </Text>
            </Box>
          </HStack>
        </Box>
      </HStack>
    </Box>
  );
};

export default MeterCard;