import React, {
  useRef,
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react';
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
  useDisclosure,
  Portal,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  Button,
} from '@chakra-ui/react';
// import { IconType } from 'react-icons';
// import { TimeWindow } from '../../../Services/TimeWindow';
import { GoClock } from "react-icons/go";
import { BsFillInfoCircleFill } from 'react-icons/bs';
// import InfoSymbol from '../InfoSymbolLayout';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { FaAngleDown } from 'react-icons/fa';
import { EnlargeHeight, EnlargeWidth } from '../../../../Services/EnlargeWidget';
import { SqeezIcon, ExpandIcon } from '../../../../assets/Icons';
import { TimeWindow } from '../../../../Services/TimeWindow';
import type { ExportFunctions } from '../../../../types/graphExport/export';
import StaleIndicator from '../../../Common/GraphStaleIndicator';

interface StaleContextType {
  missingPoints: {
    ts: number;
    seriesName?: string;
  }[];
  setMissingPoints: React.Dispatch<
    React.SetStateAction<
      {
        ts: number;
        seriesName?: string;
      }[]
    >
  >;
}

export const StaleContext =
  createContext<StaleContextType | null>(null);

export const useStaleContext = () => {
  const context = useContext(StaleContext);

  if (!context) {
    throw new Error(
      "useStaleContext must be used inside GraphLayout"
    );
  }

  return context;
};

interface GraphLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  titleLengthSVG?: number;
  titleLengthLongSVG?: number;
  initTimeTitle?: string;
  bg?: string;
  boxShadow?: string;
  border?: string;
  fullScreen?: boolean | false;
  width: string | string[] | number[];
  height: string | string[];
  mt?: string | number | any[];
  px?: string;
  overflow?: string;
  infoSymbol?: boolean;
  timeWindow?: boolean;
  onTimeWindowChange?: (config: {
    aggregation: {
      func: string;
      interval: number;
      intervalType: string;
    };
    timeRange: {
      type: "absolute" | "relative" | "last";
      startTs?: number | undefined;
      endTs?: number | undefined;
      relativeType?: string | undefined;
      interval?: number | undefined;
      intervalType?: string | undefined;
    };
    orderBy: "ASC" | "DESC";
  }) => void;
  onReset?: (Reset: boolean) => void;
  WidgetProps?: any;
  contentProps?: any;
  onExport?: ExportFunctions | null; // Optional since it might not be passed initially
  onFullscreenChange?: (value: boolean) => void;
  downloadOption?: boolean;
  inProgress?: boolean;
  preDefineTimeInvterval?: boolean;
  setCurrentWidgetInterval?: (interval: "daily" | "month" | "year") => void;
  forcePortalToBody?: boolean;
}

const GraphLayout: React.FC<GraphLayoutProps> = ({
  children,
  title,
  initTimeTitle,
  bg,
  border,
  fullScreen,
  width,
  height,
  mt,
  px,
  overflow,
  infoSymbol = false,
  timeWindow,
  onTimeWindowChange,
  onReset,
  WidgetProps,
  contentProps,
  onExport,
  onFullscreenChange,
  downloadOption = true,
  inProgress = false,
  preDefineTimeInvterval = false,
  setCurrentWidgetInterval,
  forcePortalToBody = false,
}) => {
  const iconColor = useColorModeValue('#004F86', 'white');
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Full Screen Logic
  const GraphLayoutRef = useRef<HTMLElement>(null) as React.RefObject<HTMLElement>;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [missingPoints, setMissingPoints] = useState<
    {
      ts: number;
      seriesName?: string;
    }[]
  >([]);

  // const handleFullScreen = () => {
  //   if (GraphLayoutRef.current) {
  //     if (document.fullscreenElement) {
  //       document.exitFullscreen();
  //       setIsFullscreen(false);
  //     } else {
  //       GraphLayoutRef.current.requestFullscreen();
  //       setIsFullscreen(true);
  //     }
  //   }
  // };
  const handleFullScreen = async () => {
  if (!GraphLayoutRef.current) return;

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await GraphLayoutRef.current.requestFullscreen();
  }
};

  // Handle exit fullscreen via ESC key or other methods
  // const handleFullscreenChange = () => {
  //   if (!document.fullscreenElement) {
  //     setIsFullscreen(false); // Exited fullscreen
  //   }
  // };
  const handleFullscreenChange = () => {
    const full = !!document.fullscreenElement;
    setIsFullscreen(full);
    onFullscreenChange?.(full);
  };

  // Add event listener for fullscreen change
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Interval Selection
  const [currentInterval, setCurrentInterval] =
    useState<"daily" | "month" | "year">("daily");

  function handleSelectInterval(interval: "daily" | "month" | "year"): void {
    setCurrentInterval(interval);
    if (setCurrentWidgetInterval && preDefineTimeInvterval) {
      setCurrentWidgetInterval(interval);
    }
  }

  const currentColor = useColorModeValue("secondaryText.light", "secondaryText.dark");

  return (
    <Box
      ref={GraphLayoutRef}
      position="relative"
      w={isFullscreen ? '1900px' : width}
      h={isFullscreen ? '100vh' : height}
      borderRadius="8px"
      border={border}
      bgColor={useColorModeValue('white', '#131512')}
      p={3}
      px={px}
      mt={5}
      overflow={'visible'}
      bg={bg}
      {...WidgetProps}
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        h="40px"
        minH="40px"
        mb="8px"
      >
        <HStack>
          <Box
            flex="1"
            pl={2}
            display="flex"
            alignItems="center"
            h="40px"
            overflow="hidden"
          >
            {title}
            <StaleIndicator
              hasData={true}
              missingPoints={missingPoints}
            />
          </Box>
        </HStack>

        <Flex align={'center'} gap={1}>
          {infoSymbol && <Box mr={2} cursor={"pointer"} />}

          {inProgress && <Badge fontWeight={300}>In Progress</Badge>}

          {initTimeTitle &&
            <Text color={"#9BABBD"} fontSize={"10px"} mr={2}>
              {initTimeTitle}
            </Text>
          }

          {fullScreen && (
            <IconButton
              aria-label="Fullscreen"
              icon={isFullscreen ? <SqeezIcon /> : <ExpandIcon />}
              onClick={handleFullScreen}
              variant="ghost"
              size={"xs"}
              _hover={{ bg: 'transparent', color: 'gray.500' }}
              mr={1}
            />
          )}

          {timeWindow && (
            <TimeWindow
              inFullScreen={isFullscreen}
              isOpen={isOpen}
              onClose={onClose}
              onReset={onReset || (() => { })}
              onSave={onTimeWindowChange || (() => { })}
              containerRef={GraphLayoutRef}
            >
              <GoClock color={currentColor} cursor={"pointer"} size={20} />
            </TimeWindow>
          )}

          {preDefineTimeInvterval && (
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                rounded={"none"}
                size={"xs"}
                px={"10px"}
                py={"6px"}
                fontSize={"10px"}
                fontWeight={500}
                bg={"#F5F7F8"}
                rightIcon={<FaAngleDown />}
              >
                <Text textTransform={"capitalize"}>{currentInterval}</Text>
              </MenuButton>

              <Portal containerRef={GraphLayoutRef}>
                <MenuList fontSize={"10px"} fontWeight={400} color={currentColor}>
                  <MenuItem onClick={() => handleSelectInterval("daily")}>Daily</MenuItem>
                  <MenuItem onClick={() => handleSelectInterval("month")}>Month</MenuItem>
                  <MenuItem onClick={() => handleSelectInterval("year")}>Year</MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          )}

          {/* Download Menu */}
          {downloadOption && (
            <Menu placement="bottom-end" strategy="fixed">
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={
                  <HiOutlineDotsVertical
                    size={isFullscreen ? EnlargeWidth(20) : 20}
                  />
                }
                variant="ghost"
                size="xs"
                _hover={{ bg: "transparent", color: "gray.500" }}
              />

              <MenuList>
                <MenuItem onClick={() => onExport?.exportPNG()}>
                  Download PNG
                </MenuItem>

                <MenuItem onClick={() => onExport?.exportCSV()}>
                  Download CSV
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Flex>

      <StaleContext.Provider
        value={{
          missingPoints,
          setMissingPoints,
        }}
      >
        <Box
          as="main"
          pb={6}
          height="calc(100% - 40px)"
          width="100%"
          mt={0}
          overflow="visible"
          {...contentProps}
        >
          {React.isValidElement(children) &&
            React.cloneElement(children as React.ReactElement<any>, {
              isFullscreen,
            })}
        </Box>
      </StaleContext.Provider>
    </Box>
  );
};

export default GraphLayout;
