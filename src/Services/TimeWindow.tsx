import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    ModalOverlay,
    Popover,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Portal,
    Select,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useRef, useState, useEffect } from "react";

interface TimeWindowProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: {
        aggregation: {
            func: string;
            interval: number;
            intervalType: string;
        };
        timeRange: {
            type: "absolute" | "relative" | "last";
            startTs?: number;
            endTs?: number;
            relativeType?: string;
            interval?: number;
            intervalType?: string;
        };
        orderBy: "ASC" | "DESC";
    }) => void;
    onReset: (reset: boolean) => void;
    children?: React.ReactNode;
    inFullScreen?: boolean;
    containerRef?: React.RefObject<HTMLElement>;
}

// Time Setting Options
const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const week = 7 * day;
const month = 30 * day;
const quarter = 3 * month;
const year = 4 * quarter;

export const TimeWindow: React.FC<TimeWindowProps> = ({
    onClose,
    onSave,
    onReset,
    children,
    containerRef,
}) => {
    const OverlayOne = () => (
        <ModalOverlay
            bg="blackAlpha.300"
            backdropFilter="blur(10px) hue-rotate(90deg)"
        />
    );

    const [overlay] = useState(<OverlayOne />);

    const [isOpen, setIsOpen] = useState(false);
    const popoverContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const closeOnPageScroll = (event: Event) => {
            const target = event.target;
            if (target instanceof Node && popoverContentRef.current?.contains(target)) return;
            setIsOpen(false);
        };

        window.addEventListener("scroll", closeOnPageScroll, true);
        return () => window.removeEventListener("scroll", closeOnPageScroll, true);
    }, [isOpen]);

    // Aggregation State
    const [aggFunc, setAggFunc] = useState<string>("none");
    const [aggInterval, setAggInterval] = useState<number>(5);
    const [aggIntervalType, setAggIntervalType] = useState<string>("minute");

    // Time Range State
    const [timeRangeType, setTimeRangeType] = useState<"absolute" | "relative" | "last">("absolute");

    // Absolute
    const [fromTime, setFromTime] = useState<string>("");
    const [toTime, setToTime] = useState<string>("");

    // Relative
    const [relativeType, setRelativeType] = useState<string>("currentDaySoFar");

    // Last
    const [lastInterval, setLastInterval] = useState<number>(7);
    const [lastIntervalType, setLastIntervalType] = useState<string>("day");

    // Order By
    const [orderBy, setOrderBy] = useState<"ASC" | "DESC">("DESC");

    // Valid intervals for aggregation (based on selected time range)
    const [validAggIntervals, setValidAggIntervals] = useState<Array<{ value: number; label: string; type: string }>>([]);

    const allAggIntervals = [
        { label: "1 Minute", value: 1, type: "minute" },
        { label: "5 Minute", value: 5, type: "minute" },
        { label: "10 Minute", value: 10, type: "minute" },
        { label: "15 Minute", value: 15, type: "minute" },
        { label: "30 Minute", value: 30, type: "minute" },
        { label: "1 Hour", value: 1, type: "hour" },
        { label: "2 Hour", value: 2, type: "hour" },
        { label: "5 Hour", value: 5, type: "hour" },
        { label: "10 Hour", value: 10, type: "hour" },
        { label: "12 Hour", value: 12, type: "hour" },
        { label: "1 Day", value: 1, type: "day" },
        { label: "1 Week", value: 1, type: "week" },
        { label: "1 Month", value: 1, type: "month" },
    ];

    // Relative options
    const relativeOptions = [
        { label: "Today So Far", value: "currentDaySoFar" },
        { label: "Yesterday", value: "yesterday" },
        { label: "This Week So Far", value: "currentWeekSoFar" },
        { label: "This Month So Far", value: "currentMonthSoFar" },
        { label: "This Quater So Far", value: "currentQuarterSoFar" },
    ];

    // Last interval types
    const lastIntervalTypes = [
        { label: "Minute", value: "minute" },
        { label: "Hour", value: "hour" },
        { label: "Day", value: "day" },
    ];

    // Calculate time range in ms for filtering valid aggregation intervals
    useEffect(() => {
        let rangeMs = 0;

        if (timeRangeType === "absolute" && fromTime && toTime) {
            const from = new Date(fromTime).getTime();
            const to = new Date(toTime).getTime();
            rangeMs = to - from;
        } else if (timeRangeType === "relative") {
            switch (relativeType) {
                case "currentDaySoFar":
                    rangeMs = new Date().getTime() - new Date().setHours(0, 0, 0, 0);
                    break;
                case "yesterday":
                    rangeMs = day;
                    break;
                case "last7Days":
                    rangeMs = 7 * day;
                    break;
                case "last30Days":
                    rangeMs = 30 * day;
                    break;
                case "currentMonthSoFar":
                    const now = new Date();
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    rangeMs = now.getTime() - startOfMonth.getTime();
                    break;
                case "lastMonth":
                    rangeMs = month;
                    break;
                default:
                    rangeMs = 0;
            }
        } else if (timeRangeType === "last") {
            switch (lastIntervalType) {
                case "minute":
                    rangeMs = lastInterval * minute;
                    break;
                case "hour":
                    rangeMs = lastInterval * hour;
                    break;
                case "day":
                    rangeMs = lastInterval * day;
                    break;
                case "week":
                    rangeMs = lastInterval * week;
                    break;
                case "month":
                    rangeMs = lastInterval * month;
                    break;
            }
        }

        if (aggFunc === "none") {
            setValidAggIntervals([]);
        } else if (aggFunc == "last") {
            const filtered = [
                { label: "1 Minute", value: 1, type: "minute" },
                { label: "1 Hour", value: 1, type: "hour" },
                { label: "1 Day", value: 1, type: "day" },
            ]
            setValidAggIntervals(filtered);

        } else {
            const filtered = allAggIntervals.filter((opt) => {
                const intervalMs =
                    opt.type === "minute" ? opt.value * minute :
                        opt.type === "hour" ? opt.value * hour :
                            opt.type === "day" ? opt.value * day :
                                opt.type === "week" ? opt.value * week :
                                    opt.type === "month" ? opt.value * month : 0;

                if (rangeMs === 0) return true;

                // Hide too-fine intervals for large ranges
                if (rangeMs > 2 * day && intervalMs === 5 * minute) return false;
                if (rangeMs > 3 * day && intervalMs === 10 * minute) return false;
                if (rangeMs > 7 * day && intervalMs === 15 * minute) return false;
                if (rangeMs > 7 * day && intervalMs === 30 * minute) return false;
                if (rangeMs > 29 * day && intervalMs === hour) return false;
                if (rangeMs > 1.5 * month && intervalMs === 2 * hour) return false;
                if (rangeMs > 3 * month && intervalMs === 5 * hour) return false;
                if (rangeMs > 5 * month && intervalMs === 10 * hour) return false;
                if (rangeMs > 6 * month && intervalMs === 12 * hour) return false;
                if (rangeMs > 8 * month && intervalMs === day) return false;
                if (rangeMs > year && intervalMs === week) return false;

                return true;
            });

            setValidAggIntervals(filtered);
        }
    }, [fromTime, toTime, timeRangeType, relativeType, lastInterval, lastIntervalType, aggFunc]);

    const handleSave = () => {
        let timeRange: any = { type: timeRangeType };

        if (timeRangeType === "absolute") {
            timeRange.startTs = fromTime ? new Date(fromTime).getTime() : undefined;
            timeRange.endTs = toTime ? new Date(toTime).getTime() : undefined;
        } else if (timeRangeType === "relative") {
            timeRange.relativeType = relativeType;
        } else if (timeRangeType === "last") {
            timeRange.interval = lastInterval;
            timeRange.intervalType = lastIntervalType;
        }

        onSave({
            aggregation: {
                func: aggFunc,
                interval: aggInterval,
                intervalType: aggIntervalType,
            },
            timeRange,
            orderBy,
        });

        setIsOpen(false);
    };

    const handleReset = () => {
        onReset(true);
        setAggFunc("none");
        setAggInterval(5);
        setAggIntervalType("minute");
        setTimeRangeType("absolute");
        setFromTime("");
        setToTime("");
        setRelativeType("currentDaySoFar");
        setLastInterval(7);
        setLastIntervalType("day");
        setOrderBy("DESC");
        setIsOpen(false);
    };

    // Resizing Logic
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            const baseWidth = 1920;
            const baseHeight = 1080;
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;

            const widthScale = currentWidth / baseWidth;
            const heightScale = currentHeight / baseHeight;
            const scaleFactor = Math.max(widthScale, heightScale);

            setScale(scaleFactor);
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, []);

    return (
        <Popover
            isOpen={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            placement="bottom-end"
            strategy="fixed"
            gutter={8}
            flip={true}
            boundary="clippingParents"
            modifiers={[
                {
                    name: "preventOverflow",
                    options: {
                        rootBoundary: "viewport",
                        tether: false,
                        altAxis: true,
                        padding: {
                            top: 80,
                            bottom: 16,
                            left: 8,
                            right: 8,
                        },
                    },
                },
            ]}
        >

            <PopoverTrigger>
                <Box as="span" display="inline-block">
                    {children}
                </Box>
            </PopoverTrigger>
            <Portal>
            <PopoverContent
                ref={popoverContentRef}
                color={useColorModeValue("#062D59", "#FFF")}
                bg={useColorModeValue("#fff", "#131512")}
                zIndex={9999}
                maxHeight="70vh"
                overflowY="auto"
                sx={{
                    transform: "scale(0.75)",
                    transformOrigin: "top right",
                    fontSize: "11px",
                    minWidth: "260px",
                    maxWidth: "260px",
                    ".chakra-popover__header": { fontSize: "12px" },
                    ".chakra-popover__body": { fontSize: "11px" },
                    ".chakra-form__label": { fontSize: "11px" },
                    ".chakra-input, .chakra-select": {
                        height: "28px",
                        fontSize: "11px",
                    },
                    ".chakra-popover__footer button": {
                        height: "28px",
                        fontSize: "11px",
                    },
                }}
            >
                <PopoverHeader fontWeight={700} fontSize={14}>Time Window</PopoverHeader>
                <PopoverCloseButton />

                <PopoverBody
                    zIndex={9999}
                >
                    {/* AGGREGATION */}
                    <FormControl isRequired mb={4}>
                        <FormLabel fontWeight={600} fontSize={14}>Aggregation Function</FormLabel>
                        <Select
                            fontSize={12}
                            height={7}
                            value={aggFunc}
                            onChange={(e) => setAggFunc(e.target.value)}
                        >
                            <option value="avg">AVG</option>
                            <option value="min">MIN</option>
                            <option value="max">MAX</option>
                            <option value="sum">SUM</option>
                            <option value="last">LAST</option>
                            <option value={"none"}>NONE</option>
                        </Select>
                    </FormControl>

                    {aggFunc !== "none" && (
                        <FormControl isRequired mb={4}>
                            <FormLabel fontWeight={600}>Aggregation Interval</FormLabel>
                            <Select
                                value={`${aggInterval}-${aggIntervalType}`}
                                onChange={(e) => {
                                    const [val, type] = e.target.value.split("-");
                                    setAggInterval(parseInt(val));
                                    setAggIntervalType(type);
                                }}
                            >
                                {validAggIntervals.map((opt) => (
                                    <option key={`${opt.value}-${opt.type}`} value={`${opt.value}-${opt.type}`}>
                                        {opt.label}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {/* TIME RANGE TABS */}
                    <Tabs variant="line" mb={4} isLazy>
                        <TabList mb={4}>
                            <Tab fontSize={14} onClick={() => setTimeRangeType("absolute")}>Absolute</Tab>
                            <Tab fontSize={14} onClick={() => setTimeRangeType("relative")}>Relative</Tab>
                            <Tab fontSize={14} onClick={() => setTimeRangeType("last")}>Last</Tab>
                        </TabList>

                        <TabPanels mt={-2}>
                            {/* ABSOLUTE */}
                            <TabPanel>
                                <FormControl isRequired mb={2}>
                                    <FormLabel fontWeight={600} fontSize={14}>From</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={fromTime}
                                        onChange={(e) => setFromTime(e.target.value)}
                                    />
                                </FormControl>
                                <FormControl isRequired mb={2}>
                                    <FormLabel fontWeight={600} fontSize={14}>To</FormLabel>
                                    <Input
                                        type="datetime-local"
                                        value={toTime}
                                        onChange={(e) => setToTime(e.target.value)}
                                    />
                                </FormControl>
                            </TabPanel>

                            {/* RELATIVE */}
                            <TabPanel>
                                <FormControl isRequired>
                                    <FormLabel fontWeight={600} fontSize={14}>Preset Range</FormLabel>
                                    <Select
                                        value={relativeType}
                                        onChange={(e) => setRelativeType(e.target.value)}
                                    >
                                        {relativeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TabPanel>

                            {/* LAST */}
                            <TabPanel>
                                <FormControl isRequired mb={2}>
                                    <FormLabel fontWeight={600} fontSize={14}>Last</FormLabel>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={lastInterval}
                                        onChange={(e) => setLastInterval(parseInt(e.target.value) || 1)}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontWeight={600} fontSize={14}>Unit</FormLabel>
                                    <Select
                                        value={lastIntervalType}
                                        onChange={(e) => setLastIntervalType(e.target.value)}
                                    >
                                        {lastIntervalTypes.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>

                    {/* ORDER BY */}
                    <FormControl isRequired mt={-2} mb={2}>
                        <FormLabel fontWeight={600} fontSize={14}>Order By</FormLabel>
                        <Select
                            fontSize={12}
                            height={7}
                            value={orderBy}
                            onChange={(e) => setOrderBy(e.target.value !== "ASC" ? "DESC" : e.target.value)}
                        >
                            <option value="ASC">Ascending (ASC)</option>
                            <option value="DESC">Descending (DESC)</option>
                        </Select>
                    </FormControl>
                </PopoverBody>

                <PopoverFooter display={"flex"} justifyContent={"space-between"}>
                    <Button color={"#FF4646"} fontWeight={400} fontSize={14} variant={"ghost"} mr={3} onClick={handleReset}>
                        Reset
                    </Button>
                    <Box>
                        <Button
                            fontWeight={400}
                            variant={"ghost"}
                            bg={useColorModeValue("#062D59", "#fff")}
                            rounded={"none"}
                            color={useColorModeValue("#fff", "#062D59")}
                            mr={3}
                            onClick={handleSave}
                            fontSize={14}
                        >
                            Save
                        </Button>
                        <Button
                            fontWeight={400}
                            fontSize={14}
                            variant={"ghost"}
                            color={useColorModeValue("#062D59", "#fff")}
                            onClick={() => setIsOpen(false)}
                        >
                            Close
                        </Button>
                    </Box>
                </PopoverFooter>
            </PopoverContent>
            </Portal>
        </Popover>
    );
};