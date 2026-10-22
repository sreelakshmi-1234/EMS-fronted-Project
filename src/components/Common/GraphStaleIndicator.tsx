import { Text, Tooltip, Box, } from "@chakra-ui/react";

interface Props {
  ts?: number | null;
  minutes?: number;
  hasData?: boolean;
  value?: number | string | null;
  missingPoints?: {
    ts: number;
    seriesName?: string;
  }[];
}

export const StaleIndicator = ({
  hasData = true,
  missingPoints = [],
}: Props) => {
  const hasMissingPoints = missingPoints.length > 0;

  if (!hasData || !hasMissingPoints) {
    return null;
  }

  let tooltipText = "";

  if (hasMissingPoints) {
    tooltipText =
      "Data unavailable\n\n" +
      missingPoints
        .map(
          (p, index) =>
            `${index + 1}. ${
              p.seriesName ? p.seriesName + " - " : ""
            }${new Date(p.ts).toLocaleString("en-IN", {
              timeZone: "UTC",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}`
        )
        .join("\n");
  }

  return (
    <>
      <style>{`
        @keyframes blinkDanger {
          0% { opacity: 1; }
          50% { opacity: 0.2; }
          100% { opacity: 1; }
        }
      `}</style>

      <Tooltip
        label={tooltipText}
        hasArrow
        placement="top"
        openDelay={100}
        fontSize="11px"
        px={2}
        py={1}
      >
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          cursor="help"
          flexShrink={0}
          minW="18px"
          minH="18px"
          position="relative"
          zIndex={9999}
        >
          <Text
            color="yellow.400"
            fontSize="16px"
            animation="blinkDanger 1s infinite"
            lineHeight="1"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            w="18px"
            h="18px"
            flexShrink={0}
            pointerEvents="none"
          >
            ⚠
          </Text>
        </Box>
      </Tooltip>
    </>
  );
};

export default StaleIndicator;