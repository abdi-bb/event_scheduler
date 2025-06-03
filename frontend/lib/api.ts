import type { Event, CreateEventRequest, CalendarEvent } from "@/types/event"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Helper function for authenticated API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
        return {} as T
    }

    return response.json()
}

// Event API functions
export const eventApi = {
    // Get all events
    getEvents: (): Promise<Event[]> => apiCall<Event[]>("/api/events/"),

    // Get calendar events for a date range
    getCalendarEvents: (start?: string, end?: string): Promise<CalendarEvent[]> => {
        const params = new URLSearchParams()
        if (start) params.append("start", start)
        if (end) params.append("end", end)

        const query = params.toString() ? `?${params.toString()}` : ""
        return apiCall<CalendarEvent[]>(`/api/calendar/${query}`)
    },

    // Get upcoming events
    getUpcomingEvents: (): Promise<CalendarEvent[]> => apiCall<CalendarEvent[]>("/api/upcoming/"),

    // Get single event
    getEvent: (id: number): Promise<Event> => apiCall<Event>(`/api/events/${id}/`),

    // Create event
    createEvent: (data: CreateEventRequest): Promise<Event> =>
        apiCall<Event>("/api/events/", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    // Update event
    updateEvent: (id: number, data: Partial<CreateEventRequest>): Promise<Event> =>
        apiCall<Event>(`/api/events/${id}/`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

    // Partially update event
    patchEvent: (id: number, data: Partial<CreateEventRequest>): Promise<Event> =>
        apiCall<Event>(`/api/events/${id}/`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    // Delete event or occurrence
    deleteEvent: (id: number, occurrenceDate?: string): Promise<void> => {
        const params = occurrenceDate ? `?occurrence_date=${occurrenceDate}` : ""
        return apiCall<void>(`/api/events/${id}/${params}`, {
            method: "DELETE",
        })
    },
}
