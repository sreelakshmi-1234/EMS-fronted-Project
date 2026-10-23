// InverterDetailDashboard.tsx

import React, {
  useEffect,
  useState,
} from "react";

import { useColorModeValue, Text } from "@chakra-ui/react";
import { Select } from "chakra-react-select";

import {
  useLocation,
} from "react-router-dom";

import {
  useDevices,
} from "../hooks/useDevices";

import useTimeseriesData from "../hooks/useTimeseriesData";

import InverterHeaderCard from "../components/DashboardComponents/Inverter/InverterDetail/InverterHeaderCard";

import DCInputCard from "../components/DashboardComponents/Inverter/InverterDetail/DCInputCard";

import ACOutputCard from "../components/DashboardComponents/Inverter/InverterDetail/ACOutputCard";

import PerformanceCard from "../components/DashboardComponents/Inverter/InverterDetail/PerformanceCard";

import EnvironmentalCard from "../components/DashboardComponents/Inverter/InverterDetail/EnvironmentalCard";

import InverterStatusPanel from "../components/DashboardComponents/Inverter/InverterDetail/InverterStatusPanel";

import TemperatureCard from "../components/DashboardComponents/Inverter/InverterDetail/TemperatureCard";

import TrendChartCard from "../components/DashboardComponents/Inverter/InverterDetail/TrendChartCard";

import EnergySummaryCard from "../components/DashboardComponents/Inverter/InverterDetail/EnergySummaryCard";

import AlarmEventsCard from "../components/DashboardComponents/Inverter/InverterDetail/AlarmEventsCard";

const InverterDetailDashboard: React.FC = () => {

  const location = useLocation();
  const selectedDevice = location.state?.selectedDevice;
  const inverterPattern = /block_(\d+)_inverter_inverter_(\d+)$/i;
  const initialId = selectedDevice && inverterPattern.test(selectedDevice.device_id) ? selectedDevice.device_id : "";
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialId);

  const pageBg =
    useColorModeValue(
      "#f3f7fb",
      "#06172d"
    );

  const {
    devices,
  } = useDevices();

  const filteredDevices = (devices || []).filter((d: any) => inverterPattern.test(String(d.device_id || "")));

  const formatInverterName = (deviceId: string) => {
    const match = deviceId.match(/block_(\d+)_inverter_inverter_(\d+)$/i);
    if (match) {
      return `B.${match[1]}-Inverter-${match[2]}`;
    }
    return deviceId;
  };

  const formatValue = (value: any) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
  };

  // If navigated without a selected device, default to first available inverter device
  useEffect(() => {
    if ((!selectedDeviceId || selectedDeviceId === "") && filteredDevices && filteredDevices.length > 0) {
      setSelectedDeviceId(String(filteredDevices[0].device_id));
    }
  }, [filteredDevices]);

  const {
    data,
    fetchData,
  } = useTimeseriesData();

  const inverterOptions = (filteredDevices || []).map((device: any) => ({
    value: device.device_id,
    label: formatInverterName(device.device_id),
  }));

  const selectedOption = inverterOptions.find((o: any) => o.value === selectedDeviceId) || null;

  /* ================= DEVICE CONFIG ================= */

  const selectedConfig = filteredDevices?.find((d: any) => String(d.device_id).trim() === String(selectedDeviceId).trim()) || devices?.find((d: any) => String(d.device_id).trim() === String(selectedDeviceId).trim());

  /* ================= API HIT ================= */

  useEffect(() => {

    if (!selectedDeviceId) return;

    const fetchDashboardData =
      () => {

        fetchData({

          devices: {
            patterns: [],
            ids: [selectedDeviceId],
          },

          keys: [

            {
              key: "total_dc_power",
              alias:
                "Total_DC_Power",
              keyType:
                "common",
            },

            {
              key: "active_power",
              alias:
                "Active_Power",
              keyType:
                "common",
            },

            {
              key: "reactive_power",
              alias:
                "Reactive_Power",
              keyType:
                "common",
            },

            {
              key: "specific_yield",
              alias:
                "Yield_Today",
              keyType:
                "common",
            },

            {
              key: "INV_PR",
              alias:
                "PR_Percent",
              keyType:
                "common",
            },

          ],

          aggregation: {

            func: "last",

            interval: 1,

            intervalType:
              "minute",
          },

          timeRange: {

            type: "relative",

            relativeType:
              "currentDaySoFar",
          },

          orderBy: "ASC",

        } as any);

      };

    fetchDashboardData();

    const interval =
      setInterval(() => {

        fetchDashboardData();

      }, 60000);

    return () =>
      clearInterval(interval);

  }, [selectedDeviceId]);

  /* ================= DATA MAP ================= */

  const deviceData = (data as any)?.[selectedDeviceId];

  return (

    <div
      style={{

        padding: "12px",

        background: pageBg,

        minHeight: "100vh",

        display: "flex",

        flexDirection:
          "column",

        gap: "12px",
      }}
    >


      {/* ================= TOP ================= */}

      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
        <Text fontSize="13px" fontWeight="600" color={useColorModeValue("#4A5568", "#9FB4D1")}>Select Inverter:</Text>
        <Select
          size="sm"
          options={inverterOptions}
          value={selectedOption}
          onChange={(opt: any) => setSelectedDeviceId(opt?.value || "")}
          w="160px"
          minW="160px"
          h="24px"
          bg={useColorModeValue("white", "gray.700")}
          fontSize="12px"
          placeholder="Select Inverter"
          isSearchable
          maxMenuHeight={6 * 36}
          noOptionsMessage={() => "No inverters found"}
          chakraStyles={{
            container: (p: any) => ({
              ...p,
              width: "160px",
              minWidth: "160px",
              flexShrink: 0,
            }),
            control: (p: any) => ({
              ...p,
              width: "160px",
              minWidth: "160px",
            }),
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >

        <InverterHeaderCard deviceId={selectedDeviceId} data={deviceData} config={selectedConfig} />

        <div
          style={{

            display: "grid",

            gridTemplateColumns:
              "repeat(5,1fr)",

            gap: "10px",
          }}
        >

          <PerformanceCard
  title="Input DC Power"
  value={formatValue(
    deviceData
      ?.Total_DC_Power?.[
        deviceData
          ?.Total_DC_Power
          ?.length - 1
      ]?.value
  )}

  ts={
    deviceData
      ?.Total_DC_Power?.[
        deviceData
          ?.Total_DC_Power
          ?.length - 1
      ]?.ts
  }

  unit="kW"
  color="#84cc16"
/>

<PerformanceCard
  title="Output AC Power"
  value={formatValue(
    deviceData
      ?.Active_Power?.[
        deviceData
          ?.Active_Power
          ?.length - 1
      ]?.value
  )}

  ts={
    deviceData
      ?.Active_Power?.[
        deviceData
          ?.Active_Power
          ?.length - 1
      ]?.ts
  }

  unit="kW"
  color="#60a5fa"
/>

<PerformanceCard
  title="Reactive Power"
  value={formatValue(
    deviceData
      ?.Reactive_Power?.[
        deviceData
          ?.Reactive_Power
          ?.length - 1
      ]?.value
  )}

  ts={
    deviceData
      ?.Reactive_Power?.[
        deviceData
          ?.Reactive_Power
          ?.length - 1
      ]?.ts
  }

  unit="kvar"
  color="#a855f7"
/>

<PerformanceCard
  title="Yield Today"
  value={formatValue(
    deviceData
      ?.Yield_Today?.[
        deviceData
          ?.Yield_Today
          ?.length - 1
      ]?.value
  )}

  ts={
    deviceData
      ?.Yield_Today?.[
        deviceData
          ?.Yield_Today
          ?.length - 1
      ]?.ts
  }

  unit="kWh"
  color="#f59e0b"
/>

<PerformanceCard
  title="Performance Ratio"
  value={formatValue(
    deviceData
      ?.PR_Percent?.[
        deviceData
          ?.PR_Percent
          ?.length - 1
      ]?.value
  )}

  ts={
    deviceData
      ?.PR_Percent?.[
        deviceData
          ?.PR_Percent
          ?.length - 1
      ]?.ts
  }

  unit="%"
  color="#93c5fd"
/>

        </div>

      </div>

      {/* ================= MIDDLE ================= */}

      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "1fr 1.4fr 1fr",

          gap: "12px",
        }}
      >

        <DCInputCard deviceId={selectedDeviceId} />

        <ACOutputCard deviceId={selectedDeviceId} />

        <div
          style={{

            display: "flex",

            flexDirection:
              "column",

            gap: "12px",

            alignSelf:
              "start",

            marginTop:
              "-18px",
          }}
        >

          <PerformanceCard isChart deviceId={selectedDeviceId} />

          <EnvironmentalCard deviceId={selectedDeviceId} />

        </div>

      </div>

      {/* ================= LOWER ================= */}

      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "260px minmax(0, 1fr) minmax(0, 2fr)",

          gap: "12px",
        }}
      >

        <InverterStatusPanel deviceId={selectedDeviceId} />

        <TemperatureCard deviceId={selectedDeviceId} />

        <div
          style={{

            alignSelf:
              "start",
          }}
        >

          <TrendChartCard deviceId={selectedDeviceId} />

        </div>

      </div>

      {/* ================= BOTTOM ================= */}

      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "1fr 1.5fr",

          gap: "12px",
        }}
      >

        <EnergySummaryCard deviceId={selectedDeviceId} />

        <AlarmEventsCard deviceId={selectedDeviceId} />

      </div>

    </div>
  );
};

export default InverterDetailDashboard;
