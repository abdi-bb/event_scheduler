"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameDay,
    isSameMonth,
    addMonths,
    subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"

interface SimpleCalendarProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    month?: Date
    onMonthChange?: (month: Date) => void
    modifiers?: {
        hasEvent?: Date[]
        today?: Date
    }
    modifiersClassNames?: {
        selected?: string
        today?: string
        hasEvent?: string
    }
    className?: string
}

export function SimpleCalendar({
    selected,
    onSelect,
    month: controlledMonth,
    onMonthChange,
    modifiers = {},
    modifiersClassNames = {},
    className,
}: SimpleCalendarProps) {
    const [internalMonth, setInternalMonth] = useState(new Date())
    const currentMonth = controlledMonth || internalMonth

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    // Weekday headers starting from Sunday
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    // Get all days in the month
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Add padding days to start on Sunday
    const startDay = monthStart.getDay() // 0 = Sunday
    const paddingDays = Array.from({ length: startDay }, (_, i) => {
        const paddingDate = new Date(monthStart)
        paddingDate.setDate(paddingDate.getDate() - (startDay - i))
        return paddingDate
    })

    // Add padding days to complete the last week
    const endDay = monthEnd.getDay() // 0 = Sunday
    const endPaddingDays = Array.from({ length: 6 - endDay }, (_, i) => {
        const paddingDate = new Date(monthEnd)
        paddingDate.setDate(paddingDate.getDate() + (i + 1))
        return paddingDate
    })

    const allDays = [...paddingDays, ...daysInMonth, ...endPaddingDays]

    const handlePrevMonth = () => {
        const newMonth = subMonths(currentMonth, 1)
        if (onMonthChange) {
            onMonthChange(newMonth)
        } else {
            setInternalMonth(newMonth)
        }
    }

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1)
        if (onMonthChange) {
            onMonthChange(newMonth)
        } else {
            setInternalMonth(newMonth)
        }
    }

    const handleDateClick = (date: Date) => {
        onSelect?.(date)
    }

    const isToday = (date: Date) => {
        return modifiers.today ? isSameDay(date, modifiers.today) : isSameDay(date, new Date())
    }

    const hasEvent = (date: Date) => {
        return modifiers.hasEvent?.some((eventDate) => isSameDay(date, eventDate)) || false
    }

    const isSelected = (date: Date) => {
        return selected ? isSameDay(date, selected) : false
    }

    const isCurrentMonth = (date: Date) => {
        return isSameMonth(date, currentMonth)
    }

    return (
        <div className={cn("p-3", className)}>
            {/* Header with navigation */}
            <div className="flex justify-center pt-1 relative items-center mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    className="absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    onClick={handlePrevMonth}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</div>

                <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                    onClick={handleNextMonth}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {weekdays.map((day) => (
                    <div key={day} className="h-9 w-9 flex items-center justify-center text-sm font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {allDays.map((date, index) => {
                    const dayIsToday = isToday(date)
                    const dayHasEvent = hasEvent(date)
                    const dayIsSelected = isSelected(date)
                    const dayIsCurrentMonth = isCurrentMonth(date)

                    return (
                        <button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            className={cn(
                                "h-9 w-9 p-0 font-normal text-sm rounded-md transition-colors",
                                "hover:bg-accent hover:text-accent-foreground",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                !dayIsCurrentMonth && "text-muted-foreground opacity-50",
                                dayIsSelected && "bg-green-500 text-white hover:bg-green-600",
                                dayIsToday && !dayIsSelected && "bg-yellow-500 text-white hover:bg-yellow-600",
                                dayHasEvent && !dayIsSelected && !dayIsToday && "bg-blue-500 text-white hover:bg-blue-600",
                                modifiersClassNames.selected && dayIsSelected && modifiersClassNames.selected,
                                modifiersClassNames.today && dayIsToday && !dayIsSelected && modifiersClassNames.today,
                                modifiersClassNames.hasEvent &&
                                dayHasEvent &&
                                !dayIsSelected &&
                                !dayIsToday &&
                                modifiersClassNames.hasEvent,
                            )}
                        >
                            {format(date, "d")}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
