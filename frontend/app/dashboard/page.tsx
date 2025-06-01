import type { Metadata } from "next"
import { RouteGuard } from "@/components/auth/route-guard"
import { Calendar, ListChecks, Plus, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dashboard | Event Scheduler",
  description: "Manage your events and account settings",
}

export default function DashboardPage() {
  return (
    <RouteGuard requireAuth={true}>
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Event Dashboard</h1>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
              <Calendar className="h-5 w-5" />
              <span>View Calendar</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
              <ListChecks className="h-5 w-5" />
              <span>Upcoming Events</span>
            </Button>
            <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
              <Clock className="h-5 w-5" />
              <span>Recurring Events</span>
            </Button>
          </div>
        </div>

        {/* Upcoming Events Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upcoming Events</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="#">View All</Link>
            </Button>
          </div>

          <div className="border rounded-md p-4 text-center text-gray-500">
            <p className="py-8">You don't have any upcoming events. Create your first event to get started!</p>
            <Button className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>
    </div>
    </RouteGuard>
  )
}
