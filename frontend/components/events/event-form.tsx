"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Repeat, Save } from "lucide-react"
import { eventApi } from "@/lib/api"
import type { Event, CreateEventRequest, RecurrenceParams } from "@/types/event"
import { format, parseISO } from "date-fns"

interface EventFormProps {
    event?: Event
    initialDate?: string
    onSuccess?: () => void
}

export function EventForm({ event, initialDate, onSuccess }: EventFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state
    const [title, setTitle] = useState(event?.title || "")
    const [description, setDescription] = useState(event?.description || "")
    const [startDate, setStartDate] = useState(
        event?.start ? format(parseISO(event.start), "yyyy-MM-dd") : initialDate || format(new Date(), "yyyy-MM-dd"),
    )
    const [startTime, setStartTime] = useState(event?.start ? format(parseISO(event.start), "HH:mm") : "09:00")
    const [endDate, setEndDate] = useState(
        event?.end ? format(parseISO(event.end), "yyyy-MM-dd") : initialDate || format(new Date(), "yyyy-MM-dd"),
    )
    const [endTime, setEndTime] = useState(event?.end ? format(parseISO(event.end), "HH:mm") : "10:00")

    // Recurrence state
    const [recurrenceType, setRecurrenceType] = useState<string>(
        event?.is_recurring ? event.recurrence_params?.frequency || "weekly" : "never",
    )
    const [showCustomRecurrence, setShowCustomRecurrence] = useState(false)
    const [customRecurrence, setCustomRecurrence] = useState<RecurrenceParams>({
        frequency: "weekly",
        interval: 1,
        days: [1], // Monday by default
    })

    // Initialize custom recurrence from existing event
    useEffect(() => {
        if (event?.recurrence_params) {
            setCustomRecurrence(event.recurrence_params)
        }
    }, [event])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const startDateTime = `${startDate}T${startTime}:00Z`
            const endDateTime = `${endDate}T${endTime}:00Z`

            // Validate times
            if (new Date(endDateTime) <= new Date(startDateTime)) {
                throw new Error("End time must be after start time")
            }

            const eventData: CreateEventRequest = {
                title,
                description,
                start: startDateTime,
                end: endDateTime,
                is_recurring: recurrenceType !== "never",
            }

            // Add recurrence rules
            if (recurrenceType !== "never") {
                if (recurrenceType === "custom") {
                    eventData.recurrence = customRecurrence
                } else {
                    eventData.recurrence = {
                        frequency: recurrenceType as "daily" | "weekly" | "monthly" | "yearly",
                        interval: 1,
                    }
                }
            }

            if (event) {
                await eventApi.updateEvent(event.id, eventData)
            } else {
                await eventApi.createEvent(eventData)
            }

            onSuccess?.()
            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save event")
        } finally {
            setLoading(false)
        }
    }

    const handleCustomRecurrence = () => {
        setShowCustomRecurrence(true)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            {/* Basic Event Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Event Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter event title"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Enter event description"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="end-time">End Time</Label>
                            <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recurrence Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Repeat className="h-5 w-5" />
                        Repeat
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={recurrenceType} onValueChange={setRecurrenceType}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="never" id="never" />
                            <Label htmlFor="never">Never</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="daily" id="daily" />
                            <Label htmlFor="daily">Every day</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="weekly" id="weekly" />
                            <Label htmlFor="weekly">Every week</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="monthly" id="monthly" />
                            <Label htmlFor="monthly">Every month</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yearly" id="yearly" />
                            <Label htmlFor="yearly">Every year</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom">Custom</Label>
                        </div>
                    </RadioGroup>

                    {recurrenceType === "custom" && (
                        <Button type="button" variant="outline" className="mt-4" onClick={handleCustomRecurrence}>
                            Configure Custom Recurrence
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {event ? "Update Event" : "Create Event"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>

            {/* Custom Recurrence Modal/Dialog would go here */}
            {showCustomRecurrence && (
                <CustomRecurrenceDialog
                    recurrence={customRecurrence}
                    onSave={(newRecurrence) => {
                        setCustomRecurrence(newRecurrence)
                        setShowCustomRecurrence(false)
                    }}
                    onCancel={() => setShowCustomRecurrence(false)}
                />
            )}
        </form>
    )
}

// Custom Recurrence Dialog Component
interface CustomRecurrenceDialogProps {
    recurrence: RecurrenceParams
    onSave: (recurrence: RecurrenceParams) => void
    onCancel: () => void
}

function CustomRecurrenceDialog({ recurrence, onSave, onCancel }: CustomRecurrenceDialogProps) {
    const [frequency, setFrequency] = useState(recurrence.frequency)
    const [interval, setInterval] = useState(recurrence.interval || 1)
    const [selectedDays, setSelectedDays] = useState<number[]>(recurrence.days || [])
    const [endType, setEndType] = useState<"forever" | "until" | "count">("forever")
    const [endDate, setEndDate] = useState("")
    const [count, setCount] = useState(10)

    const weekdays = [
        { value: 0, label: "Sunday" },
        { value: 1, label: "Monday" },
        { value: 2, label: "Tuesday" },
        { value: 3, label: "Wednesday" },
        { value: 4, label: "Thursday" },
        { value: 5, label: "Friday" },
        { value: 6, label: "Saturday" },
    ]

    const handleDayToggle = (day: number) => {
        setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
    }

    const handleSave = () => {
        const newRecurrence: RecurrenceParams = {
            frequency,
            interval,
        }

        if (frequency === "weekly" && selectedDays.length > 0) {
            newRecurrence.days = selectedDays
        }

        if (endType === "until" && endDate) {
            newRecurrence.until = `${endDate}T23:59:59Z`
        } else if (endType === "count") {
            newRecurrence.count = count
        }

        onSave(newRecurrence)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle>Custom Recurrence</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Repeat every</Label>
                            <Select value={interval.toString()} onValueChange={(v) => setInterval(Number.parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                            {num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Period</Label>
                            <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Day(s)</SelectItem>
                                    <SelectItem value="weekly">Week(s)</SelectItem>
                                    <SelectItem value="monthly">Month(s)</SelectItem>
                                    <SelectItem value="yearly">Year(s)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {frequency === "weekly" && (
                        <div>
                            <Label>Repeat on</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {weekdays.map((day) => (
                                    <div key={day.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`day-${day.value}`}
                                            checked={selectedDays.includes(day.value)}
                                            onCheckedChange={() => handleDayToggle(day.value)}
                                        />
                                        <Label htmlFor={`day-${day.value}`} className="text-sm">
                                            {day.label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <Label>Ends</Label>
                        <RadioGroup value={endType} onValueChange={(v) => setEndType(v as any)}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="forever" id="forever" />
                                <Label htmlFor="forever">Never</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="until" id="until" />
                                <Label htmlFor="until">On date</Label>
                                {endType === "until" && (
                                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="ml-2" />
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="count" id="count" />
                                <Label htmlFor="count">After</Label>
                                {endType === "count" && (
                                    <Input
                                        type="number"
                                        value={count}
                                        onChange={(e) => setCount(Number.parseInt(e.target.value))}
                                        className="ml-2 w-20"
                                        min="1"
                                    />
                                )}
                                {endType === "count" && <span className="text-sm">occurrences</span>}
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button onClick={handleSave} className="flex-1">
                            Save
                        </Button>
                        <Button variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
