"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Edit, Trash2, Repeat, FileText, Share } from "lucide-react"
import type { Event } from "@/types/event"
import { format, parseISO } from "date-fns"
import Link from "next/link"

interface EventDetailProps {
    eventId: number
    occurrenceDate?: string
}

export function EventDetail({ eventId, occurrenceDate }: EventDetailProps) {
    const router = useRouter()
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}/`, {
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
                }

                const eventData = await response.json()
                setEvent(eventData)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load event")
            } finally {
                setLoading(false)
            }
        }

        fetchEvent()
    }, [eventId])

    const handleDelete = async () => {
        if (!event) return

        const confirmMessage =
            event.is_recurring && occurrenceDate
                ? "Are you sure you want to delete this occurrence of the event?"
                : "Are you sure you want to delete this event?"

        if (confirm(confirmMessage)) {
            try {
                setDeleting(true)
                const params = occurrenceDate ? `?occurrence_date=${occurrenceDate}` : ""
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${event.id}/${params}`, {
                    method: "DELETE",
                    credentials: "include",
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
                }

                router.push("/dashboard")
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete event")
            } finally {
                setDeleting(false)
            }
        }
    }

    const formatDateTime = (dateString: string) => {
        const date = parseISO(dateString)
        return {
            date: format(date, "EEEE, MMMM d, yyyy"),
            time: format(date, "HH:mm"),
        }
    }

    const formatRecurrenceRule = (rule?: string) => {
        if (!rule) return "No recurrence"

        // Simple parsing of common recurrence rules
        if (rule.includes("FREQ=DAILY")) return "Daily"
        if (rule.includes("FREQ=WEEKLY")) return "Weekly"
        if (rule.includes("FREQ=MONTHLY")) return "Monthly"
        if (rule.includes("FREQ=YEARLY")) return "Yearly"

        return "Custom recurrence"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <p className="text-red-600">{error || "Event not found"}</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const startDateTime = formatDateTime(event.start)
    const endDateTime = formatDateTime(event.end)

    return (
        <div className="space-y-6">
            {/* Event Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">{event.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                                {event.is_recurring && (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Repeat className="h-3 w-3" />
                                        {formatRecurrenceRule(event.recurrence_rule)}
                                    </Badge>
                                )}
                                {occurrenceDate && <Badge variant="outline">Single Occurrence</Badge>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>
                                <Share className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/events/${event.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date and Time */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Date & Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900">Start</h4>
                            <p className="text-gray-600">{startDateTime.date}</p>
                            <p className="text-gray-600">{startDateTime.time}</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900">End</h4>
                            <p className="text-gray-600">{endDateTime.date}</p>
                            <p className="text-gray-600">{endDateTime.time}</p>
                        </div>
                        {event.is_recurring && (
                            <div>
                                <h4 className="font-medium text-gray-900">Recurrence</h4>
                                <p className="text-gray-600">{formatRecurrenceRule(event.recurrence_rule)}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Description */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            Description
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {event.description ? (
                            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                        ) : (
                            <p className="text-gray-400 italic">No description provided</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
                <Button asChild>
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
