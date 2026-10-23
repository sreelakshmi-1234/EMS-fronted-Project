import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Select,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useLocation } from "react-router-dom";

import { useDevices } from "../hooks/useDevices";
import PCSOverviewCard from "../components/DashboardComponents/PCS/detailDashboard/PCSOverviewCard";
import PCSStatusCard from "../components/DashboardComponents/PCS/detailDashboard/PCSStatusCard";
import PCSModeControlCard from "../components/DashboardComponents/PCS/detailDashboard/PCSModeControlCard";
import PCSTopSummaryCards from "../components/DashboardComponents/PCS/detailDashboard/PCSTopSummaryCards";

import PowerTrendCard from "../components/DashboardComponents/PCS/detailDashboard/PowerTrendCard";
import VoltageCurrentCard from "../components/DashboardComponents/PCS/detailDashboard/VoltageCurrentCard";
import PowerAllocationCard from "../components/DashboardComponents/PCS/detailDashboard/PowerAllocationCard";
import DCSideCard from "../components/DashboardComponents/PCS/detailDashboard/DCSideCard";
import ACSideCard from "../components/DashboardComponents/PCS/detailDashboard/ACSideCard";
import EnergyCountersCard from "../components/DashboardComponents/PCS/detailDashboard/EnergyCountersCard";
import ThermalStatusCard from "../components/DashboardComponents/PCS/detailDashboard/ThermalStatusCard";
import SystemTopologyCard from "../components/DashboardComponents/PCS/detailDashboard/SystemTopologyCard";
import AlarmEventsCard from "../components/DashboardComponents/PCS/detailDashboard/AlarmEventsCard";
import HarmonicAnalysisCard from "../components/DashboardComponents/PCS/detailDashboard/HarmonicAnalysisCard";
import ComplianceProtectionCard from "../components/DashboardComponents/PCS/detailDashboard/ComplianceProtectionCard";

const PCSDetail = () => {
  const location = useLocation();
  const selectedDevice = location.state?.selectedDevice;

  const bg = useColorModeValue("#F5F7FA", "#0F172A");

  const deviceName = selectedDevice?.name || "PCS-01";
  const deviceModel =
    selectedDevice?.rawData?.Model?.value || "Hopewind HPPS-2500B";
  const deviceBlock =
    selectedDevice?.rawData?.Block?.value || "Power Block 1";
  const initialDeviceId = String(
    selectedDevice?.device_id || selectedDevice?.deviceId || ""
  );

  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>(
    initialDeviceId || deviceName
  );

  const { devices } = useDevices();

  const formatDeviceLabel = (deviceId: string) => {
    const pcsMatch = String(deviceId).match(/_pcs_pcs_(\d+)$/i);
    if (pcsMatch) return `PCS-${pcsMatch[1]}`;

    const fallbackMatch = String(deviceId).match(/pcs_(\d+)$/i);
    if (fallbackMatch) return `PCS-${fallbackMatch[1]}`;

    return String(deviceId || "PCS-01");
  };

  const deviceOptions = React.useMemo(() => {
    const filteredDevices = (devices || []).filter((device: any) => {
      const id = String(device?.device_id || device?.name || "");
      return /_pcs_pcs_\d+$/i.test(id) || /(^|_)(pcs|pcs_pcs)_\d+$/i.test(id);
    });

    const mappedOptions = filteredDevices.map((device: any) => {
      const deviceId = String(device?.device_id || device?.name || "");
      const label = formatDeviceLabel(deviceId);

      return {
        value: deviceId,
        label,
        name: label,
        deviceId,
        model: device?.Model?.value || device?.model || deviceModel,
        block: device?.Block?.value || device?.block || deviceBlock,
      };
    });

    if (mappedOptions.length > 0) {
      return mappedOptions;
    }

    return [
      {
        value: initialDeviceId || deviceName,
        label: deviceName,
        name: deviceName,
        deviceId: initialDeviceId || deviceName,
        model: deviceModel,
        block: deviceBlock,
      },
    ];
  }, [devices, deviceName, deviceModel, deviceBlock]);

  useEffect(() => {
    if (!selectedDeviceKey && deviceOptions.length > 0) {
      setSelectedDeviceKey(deviceOptions[0].value);
      return;
    }

    if (
      deviceOptions.length > 0 &&
      !deviceOptions.some((option) => option.value === selectedDeviceKey)
    ) {
      setSelectedDeviceKey(deviceOptions[0].value);
    }
  }, [deviceOptions, selectedDeviceKey]);

  const selectedDeviceConfig = deviceOptions.find(
    (option) => option.deviceId === selectedDeviceKey
  ) || deviceOptions[0];

  return (
    <Box bg={bg} px={4} pt={4} pb={0}>
      <Flex justify="flex-start" mb={4}>
        <Flex align="center" gap={2}>
          <Text fontSize="12px" fontWeight="600" color={useColorModeValue("#64748B", "#94A3B8")}>
            Select Device
          </Text>
          <Select
            size="sm"
            w="180px"
            value={selectedDeviceKey}
            onChange={(event) => setSelectedDeviceKey(event.target.value)}
            bg={useColorModeValue("white", "#1E293B")}
            borderColor={useColorModeValue("#CBD5E1", "#475569")}
          >
            {deviceOptions.map((option) => (
              <option key={option.deviceId} value={option.deviceId}>
                {option.label}
              </option>
            ))}
          </Select>
        </Flex>
      </Flex>
      <Grid
        templateColumns="300px 1fr"
        gap={4}
        alignItems="start"
      >
        {/* ================= LEFT ================= */}
        <VStack
          spacing={4}
          align="stretch"
        >
          <PCSOverviewCard
            name={selectedDeviceConfig.name}
            model={selectedDeviceConfig.model}
            block={selectedDeviceConfig.block}
          />

          <PCSStatusCard />

          <PCSModeControlCard />
        </VStack>

        {/* ================= RIGHT ================= */}
        <VStack
          spacing={4}
          align="stretch"
          w="100%"
        >
          {/* Top Summary */}
          <PCSTopSummaryCards deviceId={selectedDeviceConfig?.deviceId || selectedDeviceKey} />

          {/* Charts */}
          <Grid
            templateColumns="1.35fr 1.35fr 0.8fr"
            gap={4}
            alignItems="stretch"
          >
            <Box mt={-5}>
              <PowerTrendCard deviceId={selectedDeviceConfig?.deviceId || selectedDeviceKey} />
            </Box>

            <Box mt={-5}>
              <VoltageCurrentCard deviceId={selectedDeviceConfig?.deviceId || selectedDeviceKey} />
            </Box>

            <PowerAllocationCard />
          </Grid>

          {/* Bottom Cards */}
          <Grid
            templateColumns="0.7fr 0.7fr 1fr 1.6fr"
            gap={4}
            alignItems="stretch"
          >
            <DCSideCard />

            <ACSideCard />

            <EnergyCountersCard />

            <ThermalStatusCard />
          </Grid>

          </VStack>
      </Grid>

      {/* Last Row Full Width */}
      <Grid
        mt={4}
        w="100%"
        templateColumns="minmax(0, 1.45fr) minmax(0, 1fr) minmax(0, 1.14fr) 230px"
        gap={4}
        alignItems="stretch"
      >
        <Box gridColumn="span 1">
          <SystemTopologyCard selectedDeviceName={selectedDeviceConfig?.name || selectedDeviceKey} />
        </Box>

        <AlarmEventsCard />

        <Box mt={-5}>
          <HarmonicAnalysisCard deviceId={selectedDeviceConfig?.deviceId || selectedDeviceKey} />
        </Box>

        <ComplianceProtectionCard />
      </Grid>
    </Box>
  );
};

export default PCSDetail;
