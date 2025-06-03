import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { CalendarView } from "@/components/calendar/calendar-view"

export const metadata: Metadata = {
  title: "Dashboard | Event Scheduler",
  description: "Manage your events and schedule",
}

export default function DashboardPage() {
  return (
    <RouteGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Your Event Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your events and schedule</p>
          </div>

          <CalendarView />
        </div>
      </div>
    </RouteGuard>
  )
}
