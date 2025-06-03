import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { EventForm } from "@/components/events/event-form"

export const metadata: Metadata = {
    title: "Create Event | Event Scheduler",
    description: "Create a new event",
}

interface CreateEventPageProps {
    searchParams: Promise<{ date?: string }>
}

export default async function CreateEventPage({ searchParams }: CreateEventPageProps) {
    const resolvedSearchParams = await searchParams

    return (
        <RouteGuard requireAuth={true}>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
                        <p className="text-gray-600 mt-2">Schedule a new event with optional recurrence</p>
                    </div>

                    <EventForm initialDate={resolvedSearchParams.date} />
                </div>
            </div>
        </RouteGuard>
    )
}
