export interface Event {
    id: number
    title: string
    start: string
    end: string
    description: string
    is_recurring: boolean
    recurrence_rule?: string
    recurrence_params?: RecurrenceParams
}

export interface RecurrenceParams {
    frequency: "daily" | "weekly" | "monthly" | "yearly"
    interval?: number
    days?: number[]
    byday?: string
    bysetpos?: number
    until?: string
    count?: number
}

export interface CreateEventRequest {
    title: string
    start: string
    end: string
    description?: string
    is_recurring: boolean
    recurrence?: RecurrenceParams
    occurrence_date?: string
}

export interface CalendarEvent extends Event {
    occurrence_date?: string
}
