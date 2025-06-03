"use client"

import { useState, useEffect } from "react"
import { SimpleCalendar } from "@/components/ui/simple-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Plus } from "lucide-react"
import type { CalendarEvent } from "@/types/event"
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, isSameMonth } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CalendarViewProps {
    onEventClick?: (event: CalendarEvent) => void
}

export function CalendarView({ onEventClick }: CalendarViewProps) {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [calendarMonth, setCalendarMonth] = useState<Date>(new Date()) // Track calendar month separately
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Get events for the calendar month
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true)
                const start = startOfMonth(calendarMonth).toISOString()
                const end = endOfMonth(calendarMonth).toISOString()

                const params = new URLSearchParams()
                params.append("start", start)
                params.append("end", end)

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calendar/?${params.toString()}`, {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
                }

                const calendarEvents = await response.json()
                setEvents(calendarEvents)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load events")
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [calendarMonth])

    // Get events for the selected date
    const selectedDateEvents = events.filter((event) => {
        const eventDate = parseISO(event.start)
        return isSameDay(eventDate, selectedDate)
    })

    // Get dates that have events for calendar highlighting
    const eventDates = events.map((event) => parseISO(event.start))

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            // Update calendar month if selected date is in a different month
            if (!isSameMonth(date, calendarMonth)) {
                setCalendarMonth(date)
            }
        }
    }

    const handleEventClick = (event: CalendarEvent) => {
        const occurrenceParam = event.occurrence_date ? `?occurrence_date=${event.occurrence_date}` : ""
        router.push(`/events/${event.id}${occurrenceParam}`)
    }

    const formatTime = (dateString: string) => {
        return format(parseISO(dateString), "HH:mm")
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" />
                            Calendar
                        </CardTitle>
                        <Button asChild size="sm">
                            <Link href="/events/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Event
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <SimpleCalendar
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            className="rounded-md border"
                            modifiers={{
                                hasEvent: eventDates,
                                today: new Date(),
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Events for selected date */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Events for {format(selectedDate, "MMMM d, yyyy")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {selectedDateEvents.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                <p>No events scheduled for this day</p>
                                <Button asChild className="mt-4" size="sm">
                                    <Link href={`/events/create?date=${selectedDate.toISOString().split("T")[0]}`}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Event
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateEvents.map((event) => (
                                    <div
                                        key={`${event.id}-${event.occurrence_date || event.start}`}
                                        className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleEventClick(event)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{event.title}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {formatTime(event.start)} - {formatTime(event.end)}
                                                </p>
                                                {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                                            </div>
                                            {event.is_recurring && (
                                                <Badge variant="secondary" className="ml-2">
                                                    Recurring
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        const today = new Date()
                        setSelectedDate(today)
                        setCalendarMonth(today)
                    }}
                    className="flex items-center gap-2"
                >
                    <CalendarDays className="h-4 w-4" />
                    Today's Events
                </Button>
                <Button asChild variant="outline">
                    <Link href="/events/upcoming" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Upcoming Events
                    </Link>
                </Button>
            </div>
        </div>
    )
}
