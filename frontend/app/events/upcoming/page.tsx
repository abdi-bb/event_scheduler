import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { UpcomingEvents } from "@/components/events/upcoming-events"

export const metadata: Metadata = {
    title: "Upcoming Events | Event Scheduler",
    description: "View your upcoming events",
}

export default function UpcomingEventsPage() {
    return (
        <RouteGuard requireAuth={true}>
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Upcoming Events</h1>
                        <p className="text-gray-600 mt-2">View and manage your upcoming events</p>
                    </div>

                    <UpcomingEvents />
                </div>
            </div>
        </RouteGuard>
    )
}
