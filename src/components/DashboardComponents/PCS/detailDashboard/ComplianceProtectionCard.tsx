import React from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { CheckCircleIcon } from "@chakra-ui/icons";

const protections = [
  {
    label: "Grid Code Compliance",
    status: "Compliant",
  },
  {
    label: "OVP / UVP",
    status: "OK",
  },
  {
    label: "OCP / SCP",
    status: "OK",
  },
  {
    label: "OTP",
    status: "OK",
  },
  {
    label: "Earth Fault",
    status: "OK",
  },
  {
    label: "DC Insulation",
    status: "OK",
  },
];

const ComplianceProtectionCard = () => {
  const bg = useColorModeValue("white", "#1A202C");
  const border = useColorModeValue("#E2E8F0", "#2D3748");
  const text = useColorModeValue("#1F2937", "white");
  const sub = useColorModeValue("#6B7280", "#A0AEC0");

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={border}
      borderRadius="12px"
      p={4}
      h="320px"
      maxW="100%"
      w="100%"
      display="flex"
      flexDirection="column"
    >
      <Text
        fontWeight="700"
        fontSize="15px"
        mb={4}
      >
        Compliance & Protection
      </Text>

      <VStack
        spacing={2.5}
        align="stretch"
        flex={1}
      >
        {protections.map((item) => (
          <HStack
            key={item.label}
            justify="space-between"
            spacing={2}
          >
            <HStack spacing={2}>
              <CheckCircleIcon
                color="#22C55E"
                boxSize={3}
              />

              <Text
                fontSize="11px"
                color={text}
              >
                {item.label}
              </Text>
            </HStack>

            <Text
              fontSize="11px"
              fontWeight="600"
              color="#22C55E"
            >
              {item.status}
            </Text>
          </HStack>
        ))}
      </VStack>

      <Button
        mt={4}
        h="34px"
        size="sm"
        bg="white"
        border="1px solid"
        borderColor={border}
        _hover={{
          bg: "#F8FAFC",
        }}
        fontWeight="600"
        fontSize="12px"
      >
        Protection Details
      </Button>
    </Box>
  );
};

export default ComplianceProtectionCard;
