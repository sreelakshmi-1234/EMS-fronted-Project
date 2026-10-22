import { Box, Container, Flex, HStack, VStack } from "@chakra-ui/react"
import PlantCard from "../../components/DashboardComponents/PlantViewComponents/Widgets/PlantCard";
import MeterCard from "../../components/DashboardComponents/PlantViewComponents/Widgets/MeterCard";
import PowerFlow from "../../components/DashboardComponents/PlantViewComponents/Widgets/PowerFlow";
import PlantViewTable from "../../components/DashboardComponents/PlantViewComponents/Widgets/PlantViewTable";
import PowerCurve from "../../components/DashboardComponents/PlantViewComponents/Widgets/PowerCurve";
import ChargeDischarge from "../../components/DashboardComponents/PlantViewComponents/Widgets/ChargeDischarge";
import TemperatureGraph from "../../components/DashboardComponents/PlantViewComponents/Widgets/TemperatureGraph";
import SoCGraph from "../../components/DashboardComponents/PlantViewComponents/Widgets/SoCGraph";
import BatteryBanks from "../../components/DashboardComponents/PlantViewComponents/Widgets/BatteryBanks";
import CUFBarGraph from "../../components/DashboardComponents/PlantViewComponents/Widgets/CUFBarGraph";
import PRBarGraph from "../../components/DashboardComponents/PlantViewComponents/Widgets/PRBarGraph";




const PlantViewDashboard = () => {
    return (
        <Box
            width={"100%"}
            height="fit-content"
            minHeight="0"
            overflow="hidden"
        >
            <HStack
                width={"100%"}
                height={"308px"}
                gap={'10px'}
            >
                <Box
                    width={"330px"}
                    height={"100%"}
                >
                    <PlantCard />
                </Box>
                <Box
                    width={"330px"}
                    height={"100%"}
                >
                    <MeterCard />
                </Box>
                <Box
                    width={"330px"}
                    height={"100%"}
                >
                    <PowerFlow />
                </Box>
                <Box
                    width={"820px"}
                    height={"100%"}
                >
                    <PlantViewTable />
                </Box>
            </HStack>
            <HStack
                width="100%"
                height="fit-content"
                minHeight="0"
                align="flex-start"
                gap="10px"
            >
                <VStack
                    width="1176px"
                    height="fit-content"
                    gap="10px"
                    align="stretch"
                >
                    <HStack
                        width={"100%"}
                        height={"312px"}
                        gap={"10px"}
                    >
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <PowerCurve />
                        </Box>
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <ChargeDischarge />
                        </Box>
                    </HStack>
                    <HStack
                        width={"100%"}
                        height={"312px"}
                        gap={"10px"}
                    >
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <CUFBarGraph />
                        </Box>
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <PRBarGraph />
                        </Box>
                    </HStack>
                    <HStack
                        width={"100%"}
                        height={"316px"}
                        gap={"10px"}
                    >
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <SoCGraph />
                        </Box>
                        <Box
                            width={"578px"}
                            height={"100%"}
                        >
                            <TemperatureGraph />
                        </Box>
                    </HStack>
                </VStack>   
                <Box
                    width="666px"
                    height="fit-content"
                    minHeight="0"
                    mt="40px"
                >
                    <BatteryBanks />
                </Box>
            </HStack>
        </Box>
    )
};

export default PlantViewDashboard;