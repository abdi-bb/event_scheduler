"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Calendar, Edit, Trash2, Plus } from "lucide-react"
import { eventApi } from "@/lib/api"
import type { CalendarEvent } from "@/types/event"
import { format, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns"
import Link from "next/link"

interface UpcomingEventsProps {
    onEventClick?: (event: CalendarEvent) => void
    onEventEdit?: (event: CalendarEvent) => void
    onEventDelete?: (event: CalendarEvent) => void
}

export function UpcomingEvents({ onEventClick, onEventEdit, onEventDelete }: UpcomingEventsProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true)
                const upcomingEvents = await eventApi.getUpcomingEvents()
                setEvents(upcomingEvents)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load events")
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [])

    const formatEventDate = (dateString: string) => {
        const date = parseISO(dateString)

        if (isToday(date)) {
            return "Today"
        } else if (isTomorrow(date)) {
            return "Tomorrow"
        } else if (isThisWeek(date)) {
            return format(date, "EEEE")
        } else {
            return format(date, "MMM d, yyyy")
        }
    }

    const formatEventTime = (startString: string, endString: string) => {
        const start = parseISO(startString)
        const end = parseISO(endString)
        return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
    }

    const handleDelete = async (event: CalendarEvent) => {
        if (confirm("Are you sure you want to delete this event?")) {
            try {
                await eventApi.deleteEvent(event.id, event.occurrence_date)
                setEvents((prev) => prev.filter((e) => !(e.id === event.id && e.occurrence_date === event.occurrence_date)))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete event")
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Events
                </CardTitle>
                <Button asChild size="sm">
                    <Link href="/events/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                {events.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No upcoming events</p>
                        <Button asChild className="mt-4" size="sm">
                            <Link href="/events/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Event
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {events.map((event) => (
                            <div
                                key={`${event.id}-${event.occurrence_date || event.start}`}
                                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 cursor-pointer" onClick={() => onEventClick?.(event)}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                                            {event.is_recurring && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Recurring
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatEventDate(event.start)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatEventTime(event.start, event.end)}
                                            </span>
                                        </div>

                                        {event.description && (
                                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.description}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Button variant="ghost" size="sm" onClick={() => onEventEdit?.(event)} asChild>
                                            <Link href={`/events/${event.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(event)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
