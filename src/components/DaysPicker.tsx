import React, { useEffect } from "react";
import { useIntl } from "react-intl";

// project
import { getPolishHolidays } from "../utils/getHolidays";

// mui
import { Box, IconButton, Tooltip } from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DeleteOutlined } from "@mui/icons-material";

// third party
import dayjs, { Dayjs } from "dayjs";
import {
  PickersDay
} from "@mui/x-date-pickers/PickersDay";

import "dayjs/locale/pl";
import type { PickersDayProps } from "@mui/x-date-pickers/PickersDay";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

/* =====================================
   Types
===================================== */

export interface DateRange {
  start: Dayjs;
  end: Dayjs;
}

export interface MultiRangeMonthPickerProps {
  value?: DateRange[];
  defaultValue?: DateRange[];
  takenDays?: DateRange[];
  onChange?: (ranges: DateRange[]) => void;
  initialMonth: Dayjs; // this is the current year and month
  disablePast?: boolean;
  disableMonthSwitching?: boolean;
  singleClick?: boolean; // when you mark not the date range, but cherry pick single days
}

/* =====================================
   Component
===================================== */

export const MultiRangeMonthPicker: React.FC<
  MultiRangeMonthPickerProps
> = ({
  value,
  defaultValue = [],
  onChange,
  initialMonth = dayjs(),
  disablePast = false,
  disableMonthSwitching = false,
  singleClick = false
}) => {
  const isControlled = value !== undefined;
  const intl = useIntl();
  const holidays = getPolishHolidays(initialMonth.year());

  const [internalRanges, setInternalRanges] =
    React.useState<DateRange[]>(defaultValue);

  const ranges = isControlled ? value! : internalRanges;

  const [currentStart, setCurrentStart] =
    React.useState<Dayjs | null>(null);

  const [displayMonth, setDisplayMonth] =
    React.useState<Dayjs>(initialMonth);

  useEffect(()=>{
    setDisplayMonth(initialMonth);
  }, [initialMonth])

  const updateRanges = (newRanges: DateRange[]) => {
    if (!isControlled) {
      setInternalRanges(newRanges);
    }

    onChange?.(newRanges);
  };

  const handleDayClick = (date: Dayjs) => {
    const sameMonth =
      date.month() === displayMonth.month() &&
      date.year() === displayMonth.year();

    if (!sameMonth) return;
    if (disablePast && date.isBefore(dayjs(), "day")) return;

    // If first click, set currentStart
    if (!currentStart) {
      setCurrentStart(date);
      if (!singleClick) return;

      const start = date;
      const end = date;

      // Avoid duplicates
      const isAlreadySelected = ranges.some(
        (range) => range.start.isSame(start, "day") && range.end.isSame(end, "day")
      );

      if (!isAlreadySelected) {
        updateRanges([...ranges, { start, end }]);
      }

      setCurrentStart(null);
      return;
    }

    const start = currentStart.isBefore(date) ? currentStart : date;
    const end = currentStart.isBefore(date) ? date : currentStart;

    // Filter out any ranges fully inside the new range
    const newRanges = ranges.filter(
      (range) =>
        range.end.isBefore(start, "day") || range.start.isAfter(end, "day")
    );

    // Add the new range
    updateRanges([...newRanges, { start, end }]);
    setCurrentStart(null);
  };

  const clearAll = () => {
    updateRanges([]);
    setCurrentStart(null);
  };

  const DaySlot: React.FC<PickersDayProps> = (
    props
  ) => {
    const { day, outsideCurrentMonth } = props;

    const isSameMonth =
      day.month() === displayMonth.month() &&
      day.year() === displayMonth.year();

    const isInRange = (
      date: Dayjs,
      start: Dayjs,
      end: Dayjs
    ) =>
      date.isSame(start, "day") ||
      date.isSame(end, "day") ||
      (date.isAfter(start, "day") &&
        date.isBefore(end, "day"));

    const inExistingRange = ranges.some((range) =>
      isInRange(day, range.start, range.end)
    );

    const isRangeStart = ranges.some((range) =>
      range.start.isSame(day, "day")
    );

    const isRangeEnd = ranges.some((range) =>
      range.end.isSame(day, "day")
    );

    const isStartPreview =
      currentStart?.isSame(day, "day") ?? false;
    const isEndPreview = 
      currentStart && day.isAfter(currentStart, "day") && false;

    const holiday = holidays.find(h => day.isSame(h.date, "day"));

    const bgColor =
      isRangeStart || isStartPreview
        ? "primary.main"
        : isRangeEnd || isEndPreview
        ? "secondary.main"
        : inExistingRange
        ? "primary.light"
        : holiday
        ? holiday.type === "static"
          ? "#F7C625"
          : "#F78725"
        : day.day() === 0 || day.day() === 6
        ? "#d40f40"
        : undefined;

    const textColor =
      isRangeStart || isStartPreview || isRangeEnd || isEndPreview || day.day() === 0 || day.day() === 6
        ? "white"
        : holiday
        ? "black"
        : undefined;

    return (
      <PickersDay
        {...props}
        
        disabled={
          outsideCurrentMonth ||
          !isSameMonth ||
          props.disabled
        }
        onClick={() => handleDayClick(day)}
        sx={{
          borderRadius: 0,
          backgroundColor: bgColor,
          color: textColor,
          "&.MuiPickersDay-root:focus, &.MuiPickersDay-root:focus-visible, &.MuiPickersDay-root.Mui-selected": {
            backgroundColor: bgColor,
            color: textColor,
          },
        }}
      />
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pl">
      <Box>
        <DateCalendar
          key={displayMonth.format('YYYY-MM')}
          value={null}
          referenceDate={displayMonth}
          onMonthChange={(newMonth: Dayjs) => {
            if (!disableMonthSwitching) {
              setDisplayMonth(newMonth);
              setCurrentStart(null);
            }
          }}
          views={["day"]}
          disablePast={disablePast}
          slots={{
            day: DaySlot,
          }}
          sx={{
            backgroundColor: '#F7F6FF',
            borderRadius: 3,
            height: "auto",
            overflow: "visible",
            margin: 0,
            "& .MuiPickersSlideTransition-root": {
              minHeight: "230px",
            },
            "& .MuiDayCalendar-monthContainer": {
              minHeight: "230px",
            }
          }}
        />

        <Box>
          <Tooltip title={intl.formatMessage({id: 'clear'})} placement="right">
            <IconButton
              onClick={clearAll}
            >
              <DeleteOutlined fontSize={'medium'}/>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};
