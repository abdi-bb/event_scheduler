import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { EventDetail } from "@/components/events/event-detail"

export const metadata: Metadata = {
    title: "Event Details | Event Scheduler",
    description: "View event details",
}

interface EventDetailPageProps {
    params: { id: string }
    searchParams: { occurrence_date?: string }
}

export default function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
    const eventId = Number.parseInt(params.id)

    return (
        <RouteGuard requireAuth={true}>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <EventDetail eventId={eventId} occurrenceDate={searchParams.occurrence_date} />
                </div>
            </div>
        </RouteGuard>
    )
}
