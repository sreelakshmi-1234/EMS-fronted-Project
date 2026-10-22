import { useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Progress,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useDevices } from "../../../hooks/useDevices";
import WidgetTitle from "../../Common/WidgetTitle";

interface BankData {
  device_id: string;
  soc: number;
  active_device: number;
  non_active_device: number;
  amps: string;
  voltage: string;
  latest_temp: number;
  max_temp: number;
  dod?: number;
  soh?: number;
  energy: {
    availableEnergy: string;
    status: string;
    storedEnergy: string;
    storedEnergyPercent: number;
    charge: string;
    discharge: string;
    deratedPower: string;
    energyDischarge: string;
    energyCharge: string;
  };
}

const formatValue = (value: number | undefined) =>
  Number(value ?? 0).toFixed(2);

/* ========
   CONNECTED / DISABLED CARD
======== */

const MetricCard = ({
  title,
  value,
  bg,
  width,
}: {
  title: string;
  value: string | number;
  bg: string;
  width: string;
}) => {
  return (
    <Box
      w={width}
      minW={width}
      maxW={width}
      h="52px"
      flexShrink={0}
      bg={bg}
      bgGradient={useColorModeValue(
        "linear(to-br, rgba(255,255,255,0.9), rgba(255,255,255,0.55))",
        "linear(to-br, rgba(255,255,255,0.08), rgba(255,255,255,0.04))"
      )}
      borderRadius="14px"
      px={1}
      py={1}
      border="1px solid rgba(255,255,255,0.45)"
      boxShadow={useColorModeValue(
        "0 6px 18px rgba(0,0,0,0.06)",
        "0 8px 20px rgba(0,0,0,0.20)"
      )}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      textAlign="center"
      overflow="hidden"
    >
      <Text
        fontSize="8px"
        color="#555"
        lineHeight="10px"
        whiteSpace="nowrap"
      >
        {title}
      </Text>

      <Text
        fontWeight="700"
        fontSize="14px"
        lineHeight="16px"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
    </Box>
  );
};

/* ========
   ENERGY STATUS
======== */

const EnergyStatus = ({ energy }: { energy: BankData["energy"] }) => {
  const textColor = useColorModeValue("#0F172A", "#FFFFFF");
  const subColor = useColorModeValue("#64748B", "#A8B3C2");
  const cardBg = useColorModeValue("#F8FAFC", "rgba(255,255,255,0.04)");
  const border = useColorModeValue("#E2E8F0", "rgba(255,255,255,0.10)");

  const miniCard = (
    bg: string,
    title: string,
    value: string,
    valueColor = textColor
  ) => (
    <Box
      flex="1"
      minW="0"
      h="31px"
      borderRadius="9px"
      bg={bg}
      px={1.5}
      py={0.5}
      overflow="hidden"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      <Text
        fontSize="7px"
        color={subColor}
        lineHeight="8px"
        whiteSpace="nowrap"
      >
        {title}
      </Text>
      <Text
        fontSize="9px"
        fontWeight="800"
        color={valueColor}
        lineHeight="10px"
        whiteSpace="nowrap"
      >
        {value}
      </Text>
    </Box>
  );

  return (
    <Box
      flex="1"
      minW="0"
      maxW="100%"
      h="112px"
      borderRadius="14px"
      bg={cardBg}
      border="1px solid"
      borderColor={border}
      px={2}
      py={1}
      overflow="hidden"
    >
      <HStack
        justify="space-between"
        align="center"
        w="100%"
        h="17px"
        mb={1}
      >
        <HStack spacing={1}>
          
          <Text
            fontSize="11px"
            fontWeight="800"
            color={textColor}
            lineHeight="13px"
            whiteSpace="nowrap"
          >
            Energy Status
          </Text>
        </HStack>

        <HStack spacing={1.5}>
          <Text fontSize="7px" color={subColor} whiteSpace="nowrap">
            Available:
          </Text>
          <Text
            fontSize="8px"
            fontWeight="800"
            color="#159447"
            whiteSpace="nowrap"
          >
            {energy.availableEnergy}
          </Text>
          <Box w="1px" h="10px" bg={border} />
          <Text fontSize="7px" color={subColor} whiteSpace="nowrap">
            ●
          </Text>
          <Text
            fontSize="7px"
            fontWeight="700"
            color="#159447"
            whiteSpace="nowrap"
          >
            {energy.status}
          </Text>
        </HStack>
      </HStack>

      <HStack spacing={1} align="stretch" w="100%" h="83px" minW="0">
        <Box
          w="91px"
          minW="91px"
          maxW="91px"
          h="83px"
          borderRadius="10px"
          bg={useColorModeValue(
            "linear-gradient(135deg,#F0F8FF,#EAF4FF)",
            "rgba(40,120,220,0.10)"
          )}
          px={1.5}
          py={1}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <HStack spacing={1} mb={0.5}>
            
            <Text
              fontSize="8px"
              color={subColor}
              fontWeight="600"
              whiteSpace="nowrap"
            >
              Stored Energy
            </Text>
          </HStack>
          <HStack spacing={1} align="baseline" whiteSpace="nowrap">
            <Text
              fontSize="14px"
              fontWeight="800"
              color={textColor}
              lineHeight="18px"
            >
              {energy.storedEnergy}
            </Text>
            <Text fontSize="8px" color={subColor} lineHeight="10px">
              MWh
            </Text>
          </HStack>
          <HStack spacing={1} mt={1}>
            <Box
              flex="1"
              h="5px"
              borderRadius="full"
              bg="#D8E8F5"
              overflow="hidden"
            >
              <Box
                w={`${energy.storedEnergyPercent}%`}
                h="100%"
                borderRadius="full"
                bg="#2196F3"
              />
            </Box>
            <Text fontSize="8px" fontWeight="800" color="#2196F3">
              {energy.storedEnergyPercent}%
            </Text>
          </HStack>
        </Box>

        <VStack flex="1" spacing={1} minW="0" h="83px">
          <HStack spacing={1} w="100%" h="31px" minW="0">
            {miniCard(
              "linear-gradient(135deg,#ECFFF8,#E4FAF2)",
              "Charge",
              energy.charge,
              "#0B7F5B"
            )}
            {miniCard(
              "linear-gradient(135deg,#FFF7F0,#FFF1E7)",
              "Discharge",
              energy.discharge,
              "#111827"
            )}
            {miniCard(
              "linear-gradient(135deg,#EEF7FF,#E8F2FF)",
              "Derated Power",
              energy.deratedPower,
              "#DC2626"
            )}
          </HStack>

          <HStack spacing={1} w="100%" h="51px" minW="0">
            <Box
              flex="1"
              minW="0"
              h="51px"
              borderRadius="10px"
              bg="linear-gradient(135deg,#F5F0FF,#F0EAFF)"
              px={1.5}
              py={1}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              overflow="hidden"
            >
              <Text fontSize="7px" color={subColor} lineHeight="8px" whiteSpace="nowrap">
                Energy discharge
              </Text>
              <Text fontSize="12px" fontWeight="800" color={textColor} lineHeight="14px" whiteSpace="nowrap">
                {energy.energyDischarge}
              </Text>
            </Box>
            <Box
              flex="1"
              minW="0"
              h="51px"
              borderRadius="10px"
              bg="linear-gradient(135deg,#FFF9EA,#FFF5DC)"
              px={1.5}
              py={1}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              overflow="hidden"
            >
              <Text fontSize="7px" color={subColor} lineHeight="8px" whiteSpace="nowrap">
                Energy charge
              </Text>
              <Text fontSize="12px" fontWeight="800" color={textColor} lineHeight="14px" whiteSpace="nowrap">
                {energy.energyCharge}
              </Text>
            </Box>
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
};

/* 
   BANK SUMMARY*/

const BankSummary = () => {
  const border = useColorModeValue("#E5E7EB", "#4A5568");

  const { devices } = useDevices();

  const navigate = useNavigate();

  const bankOptions = useMemo(() => {
    const filteredDevices = (devices || []).filter((device: any) => {
      const id = String(device?.device_id || device?.name || "");

      return (
        /_bank_bank_\d+$/i.test(id) ||
        /(^|_)(bank|bank_bank)_\d+$/i.test(id)
      );
    });

    return filteredDevices.map((device: any, index: number) => {
      const deviceId = String(
        device?.device_id || device?.name || ""
      );

      const bankNumber = index + 1;
      const soc = 42 + ((bankNumber * 11) % 48);
      const storedEnergyPercent = 38 + ((bankNumber * 13) % 58);

      return {
        ...device,
        device_id: deviceId,
        soc,
        dod: 100 - soc,
        soh: 82 + ((bankNumber * 7) % 18),
        active_device: 0,
        non_active_device: 0,
        energy: {
          availableEnergy: (1.2 + ((bankNumber * 0.47) % 4.8)).toFixed(2),
          status: bankNumber % 2 === 0 ? "Charging" : "Discharging",
          storedEnergy: (2.4 + ((bankNumber * 1.37) % 15)).toFixed(2),
          storedEnergyPercent,
          charge: `${(0.4 + ((bankNumber * 0.31) % 3.5)).toFixed(2)} MW`,
          discharge: `${(0.3 + ((bankNumber * 0.27) % 3.2)).toFixed(2)} MW`,
          deratedPower: `${(0.1 + ((bankNumber * 0.09) % 0.8)).toFixed(2)} MW`,
          energyDischarge: `${(1.5 + ((bankNumber * 0.83) % 12)).toFixed(2)} MWh`,
          energyCharge: `${(1.1 + ((bankNumber * 0.61) % 10)).toFixed(2)} MWh`,
        },
      };
    });
  }, [devices]);

  return (
    <Box
      bg={useColorModeValue("white", "#1E1E1E")}
      borderRadius="16px"
      border="1px solid"
      borderColor={useColorModeValue(
        "gray.200",
        "whiteAlpha.200"
      )}
      boxShadow="sm"
      pt={2}
      px={3}
      pb={4}
      h="680px"
      w="100%"
      maxW="100%"
      minW="650px"
      overflow="hidden"
    >
      {/* Header */}
      <Box mt={0} mb={2}>
        <WidgetTitle>Banks Summary</WidgetTitle>
      </Box>

      {/* Scroll Area */}
      <Box
        h="calc(100% - 32px)"
        w="100%"
        minW="0"
        overflowY="auto"
        overflowX="hidden"
        pr={1}
      >
        <VStack
          spacing={3}
          align="stretch"
          w="100%"
          minW="0"
        >
          {bankOptions.map(
            (bank: BankData, index: number) => (
              <Box
                key={index}
                w="100%"
                maxW="100%"
                minW="0"
                overflow="hidden"
                bgGradient={useColorModeValue(
                  "linear(to-br, #ffffff, #f8fafc)",
                  "linear(to-br, #2c3144, #1f2937)"
                )}
                borderRadius="18px"
                border="1px solid"
                borderColor={border}
                px={3}
                py={2}
                boxShadow={useColorModeValue(
                  "0 8px 22px rgba(15, 23, 42, 0.08)",
                  "0 12px 30px rgba(0, 0, 0, 0.25)"
                )}
              >
                <HStack
                  align="center"
                  spacing={2}
                  w="100%"
                  maxW="100%"
                  minW="0"
                >
                  {/*  LEFT  */}
                  <Box
                    w="145px"
                    minW="145px"
                    maxW="145px"
                    flexShrink={0}
                    overflow="hidden"
                  >
                    <Text
                      fontSize="13px"
                      fontWeight="700"
                      mb={2}
                      cursor="pointer"
                      textTransform="capitalize"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      onClick={() =>
                        navigate("/batterybankk", {
                          state: {
                            currentBank:
                              bank.device_id,
                            breadcrumbSource:
                              "bess",
                          },
                          replace: true,
                        })
                      }
                    >
                      {bank.device_id
                        .replace(/^plant_\d+_/, "")
                        .replace(
                          "bank_bank",
                          "bank"
                        )
                        .replace(/_/g, " ")
                        .replace(
                          "pcs",
                          "PCS"
                        )}
                    </Text>

                    <VStack
                      spacing={0.5}
                      align="stretch"
                      w="100%"
                    >
                      {/* SOC */}
                      <HStack
                        spacing={1.5}
                        w="100%"
                      >
                        <Text
                          w="27px"
                          minW="27px"
                          fontSize="9px"
                        >
                          SoC
                        </Text>

                        <Progress
                          value={bank.soc}
                          w="60px"
                          flexShrink={0}
                          h="4px"
                          colorScheme="teal"
                          borderRadius="full"
                        />

                        <Text
                          w="42px"
                          minW="42px"
                          fontSize="9px"
                          textAlign="right"
                          whiteSpace="nowrap"
                        >
                          {formatValue(bank.soc)}%
                        </Text>
                      </HStack>

                      {/* DoD */}
                      <HStack
                        spacing={1.5}
                        w="100%"
                      >
                        <Text
                          w="27px"
                          minW="27px"
                          fontSize="9px"
                        >
                          DoD
                        </Text>

                        <Progress
                          value={
                            bank.dod ?? 60
                          }
                          w="60px"
                          flexShrink={0}
                          h="4px"
                          colorScheme="orange"
                          borderRadius="full"
                        />

                        <Text
                          w="42px"
                          minW="42px"
                          fontSize="9px"
                          textAlign="right"
                          whiteSpace="nowrap"
                        >
                          {formatValue(bank.dod)}%
                        </Text>
                      </HStack>

                      {/* SoH */}
                      <HStack
                        spacing={1.5}
                        w="100%"
                      >
                        <Text
                          w="27px"
                          minW="27px"
                          fontSize="9px"
                        >
                          SoH
                        </Text>

                        <Progress
                          value={
                            bank.soh ?? 90
                          }
                          w="60px"
                          flexShrink={0}
                          h="4px"
                          colorScheme="blue"
                          borderRadius="full"
                        />

                        <Text
                          w="42px"
                          minW="42px"
                          fontSize="9px"
                          textAlign="right"
                          whiteSpace="nowrap"
                        >
                          {formatValue(bank.soh)}%
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/*  CONNECTED  */}
                  <HStack
                    spacing={2}
                    align="stretch"
                    flexShrink={0}
                  >
                    <MetricCard
                      title="Connected"
                      value={
                        bank.active_device
                      }
                      bg="#BFF4E3"
                      width="68px"
                    />

                    <MetricCard
                      title="Disabled"
                      value={
                        bank.non_active_device
                      }
                      bg="#F3F4F6"
                      width="68px"
                    />
                  </HStack>

                  {/*  ENERGY STATUS  */}
                  <EnergyStatus energy={bank.energy} />
                </HStack>
              </Box>
            )
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default BankSummary;