"use client"

import { useState, useEffect, use } from "react"
import { RouteGuard } from "@/components/auth/route-guard"
import { EventForm } from "@/components/events/event-form"
import type { Event } from "@/types/event"

interface EditEventPageProps {
    params: Promise<{ id: string }>
}

export default function EditEventPage({ params }: EditEventPageProps) {
    const resolvedParams = use(params)
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const eventId = Number.parseInt(resolvedParams.id)

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

    if (loading) {
        return (
            <RouteGuard requireAuth={true}>
                <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    </div>
                </div>
            </RouteGuard>
        )
    }

    if (error || !event) {
        return (
            <RouteGuard requireAuth={true}>
                <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center py-8">
                            <p className="text-red-600">{error || "Event not found"}</p>
                        </div>
                    </div>
                </div>
            </RouteGuard>
        )
    }

    return (
        <RouteGuard requireAuth={true}>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
                        <p className="text-gray-600 mt-2">Update your event details and recurrence settings</p>
                    </div>

                    <EventForm event={event} />
                </div>
            </div>
        </RouteGuard>
    )
}
