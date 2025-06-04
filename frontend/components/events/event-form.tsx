"use client"

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
import type { Event, CreateEventRequest, RecurrenceParams } from "@/types/event"
import { format, parseISO, addMinutes, differenceInMinutes } from "date-fns"

interface EventFormProps {
    event?: Event
    initialDate?: string
    occurrenceDate?: string
    onSuccess?: () => void
}

export function EventForm({ event, initialDate, occurrenceDate, onSuccess }: EventFormProps) {
    const router = useRouter()
    const [loadingOccurrence, setLoadingOccurrence] = useState(false)
    const [loadingSeries, setLoadingSeries] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Calculate the duration of the original event for occurrence editing
    const getEventDuration = () => {
        if (event?.start && event?.end) {
            const start = parseISO(event.start)
            const end = parseISO(event.end)
            return differenceInMinutes(end, start)
        }
        return 60 // Default 1 hour
    }

    // Initialize form state properly based on whether we're editing an occurrence
    const initializeFormData = () => {
        if (occurrenceDate && event) {
            // For occurrence editing, use the occurrence date but keep original duration
            const occStart = parseISO(occurrenceDate)
            const duration = getEventDuration()
            const occEnd = addMinutes(occStart, duration)

            return {
                startDate: format(occStart, "yyyy-MM-dd"),
                startTime: format(occStart, "HH:mm"),
                endDate: format(occEnd, "yyyy-MM-dd"),
                endTime: format(occEnd, "HH:mm"),
            }
        } else if (event) {
            // For regular event editing, use the event's original dates
            return {
                startDate: format(parseISO(event.start), "yyyy-MM-dd"),
                startTime: format(parseISO(event.start), "HH:mm"),
                endDate: format(parseISO(event.end), "yyyy-MM-dd"),
                endTime: format(parseISO(event.end), "HH:mm"),
            }
        } else {
            // For new events
            const defaultDate = initialDate || format(new Date(), "yyyy-MM-dd")
            return {
                startDate: defaultDate,
                startTime: "09:00",
                endDate: defaultDate,
                endTime: "10:00",
            }
        }
    }

    const formData = initializeFormData()

    // Form state
    const [title, setTitle] = useState(event?.title || "")
    const [description, setDescription] = useState(event?.description || "")
    const [startDate, setStartDate] = useState(formData.startDate)
    const [startTime, setStartTime] = useState(formData.startTime)
    const [endDate, setEndDate] = useState(formData.endDate)
    const [endTime, setEndTime] = useState(formData.endTime)

    // Recurrence state
    const [recurrenceType, setRecurrenceType] = useState<string>(() => {
        if (!event?.is_recurring) return "never"
        const params = event.recurrence_params
        if (!params) return "never"
        if (params.interval === 1 && !params.days && !params.byday && !params.bysetpos) {
            return params.frequency
        }
        return "custom"
    })

    const [showCustomRecurrence, setShowCustomRecurrence] = useState(false)
    const [customRecurrence, setCustomRecurrence] = useState<RecurrenceParams>({
        frequency: "weekly",
        interval: 1,
        days: [0],
    })

    // Initialize custom recurrence from existing event
    useEffect(() => {
        if (event?.recurrence_params) {
            setCustomRecurrence(event.recurrence_params)
        }
    }, [event])

    // Validation function
    const validateForm = () => {
        const errors: Record<string, string> = {}

        // Title validation
        if (!title.trim()) {
            errors.title = "Event title is required"
        }

        // Date/time validation
        if (!startDate) {
            errors.startDate = "Start date is required"
        }
        if (!startTime) {
            errors.startTime = "Start time is required"
        }
        if (!endDate) {
            errors.endDate = "End date is required"
        }
        if (!endTime) {
            errors.endTime = "End time is required"
        }

        // Check if end time is after start time
        if (startDate && startTime && endDate && endTime) {
            const startDateTime = new Date(`${startDate}T${startTime}:00`)
            const endDateTime = new Date(`${endDate}T${endTime}:00`)

            if (endDateTime <= startDateTime) {
                errors.endTime = "End time must be after start time"
            }
        }

        // Recurrence validation for weekly custom
        if (
            recurrenceType === "custom" &&
            customRecurrence.frequency === "weekly" &&
            (!customRecurrence.days || customRecurrence.days.length === 0)
        ) {
            errors.recurrence = "Please select at least one day for weekly recurrence"
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleUpdateOccurrence = async () => {
        if (!validateForm()) {
            setError("Please fix the validation errors below")
            return
        }

        setError(null)
        setLoadingOccurrence(true)

        try {
            if (!event || !occurrenceDate) {
                throw new Error("Missing event or occurrence date")
            }

            // For occurrence updates, we can update title, description, start, and end times
            const startDateTime = `${startDate}T${startTime}:00Z`
            const endDateTime = `${endDate}T${endTime}:00Z`

            const updateData = {
                title: title.trim(),
                description: description.trim(),
                start: startDateTime,
                end: endDateTime,
            }

            // Use PUT method with occurrence_date as query parameter
            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/events/${event.id}/?occurrence_date=${encodeURIComponent(occurrenceDate)}`

            console.log("Updating occurrence with URL:", url)
            console.log("Update data:", updateData)

            const response = await fetch(url, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error("API Error:", errorData)
                throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
            }

            onSuccess?.()
            router.push("/events/upcoming")
        } catch (err) {
            console.error("Update occurrence error:", err)
            setError(err instanceof Error ? err.message : "Failed to update occurrence")
        } finally {
            setLoadingOccurrence(false)
        }
    }

    const handleUpdateSeries = async () => {
        if (!validateForm()) {
            setError("Please fix the validation errors below")
            return
        }

        setError(null)
        setLoadingSeries(true)

        try {
            const startDateTime = `${startDate}T${startTime}:00Z`
            const endDateTime = `${endDate}T${endTime}:00Z`

            const eventData: CreateEventRequest = {
                title: title.trim(),
                description: description.trim(),
                start: startDateTime,
                end: endDateTime,
                is_recurring: recurrenceType !== "never",
            }

            // Add recurrence rules for series updates
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

            // For series updates, use PATCH method without occurrence_date in query params
            const url = event
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/events/${event.id}/`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/events/`

            const method = event ? "PATCH" : "POST"

            console.log("Updating series with URL:", url)
            console.log("Method:", method)
            console.log("Event data:", eventData)

            const response = await fetch(url, {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(eventData),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error("API Error:", errorData)
                throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`)
            }

            onSuccess?.()
            router.push("/dashboard")
        } catch (err) {
            console.error("Update series error:", err)
            setError(err instanceof Error ? err.message : "Failed to save event")
        } finally {
            setLoadingSeries(false)
        }
    }

    const handleCustomRecurrence = () => {
        setShowCustomRecurrence(true)
    }

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

            {/* Show occurrence info */}
            {event && occurrenceDate && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
                    <p className="text-sm">
                        <strong>Editing Occurrence:</strong> {format(parseISO(occurrenceDate), "EEEE, MMMM d, yyyy 'at' HH:mm")}
                    </p>
                    <p className="text-xs mt-1">
                        Updating this occurrence will create a new one-time event and cancel the original occurrence.
                    </p>
                </div>
            )}

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
                            onChange={(e) => {
                                setTitle(e.target.value)
                                if (validationErrors.title) {
                                    setValidationErrors((prev) => ({ ...prev, title: "" }))
                                }
                            }}
                            placeholder="Enter event title"
                            required
                            className={validationErrors.title ? "border-red-500" : ""}
                        />
                        {validationErrors.title && <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>}
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

                    {/* Show date/time fields for all cases now */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                                id="start-date"
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value)
                                    if (validationErrors.startDate) {
                                        setValidationErrors((prev) => ({ ...prev, startDate: "" }))
                                    }
                                }}
                                required
                                className={validationErrors.startDate ? "border-red-500" : ""}
                            />
                            {validationErrors.startDate && <p className="text-red-500 text-sm mt-1">{validationErrors.startDate}</p>}
                        </div>
                        <div>
                            <Label htmlFor="start-time">Start Time</Label>
                            <Input
                                id="start-time"
                                type="time"
                                value={startTime}
                                onChange={(e) => {
                                    setStartTime(e.target.value)
                                    if (validationErrors.startTime) {
                                        setValidationErrors((prev) => ({ ...prev, startTime: "" }))
                                    }
                                }}
                                required
                                className={validationErrors.startTime ? "border-red-500" : ""}
                            />
                            {validationErrors.startTime && <p className="text-red-500 text-sm mt-1">{validationErrors.startTime}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                                id="end-date"
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value)
                                    if (validationErrors.endDate) {
                                        setValidationErrors((prev) => ({ ...prev, endDate: "" }))
                                    }
                                }}
                                required
                                className={validationErrors.endDate ? "border-red-500" : ""}
                            />
                            {validationErrors.endDate && <p className="text-red-500 text-sm mt-1">{validationErrors.endDate}</p>}
                        </div>
                        <div>
                            <Label htmlFor="end-time">End Time</Label>
                            <Input
                                id="end-time"
                                type="time"
                                value={endTime}
                                onChange={(e) => {
                                    setEndTime(e.target.value)
                                    if (validationErrors.endTime) {
                                        setValidationErrors((prev) => ({ ...prev, endTime: "" }))
                                    }
                                }}
                                required
                                className={validationErrors.endTime ? "border-red-500" : ""}
                            />
                            {validationErrors.endTime && <p className="text-red-500 text-sm mt-1">{validationErrors.endTime}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Always show recurrence settings, but with different messaging */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Repeat className="h-5 w-5" />
                        Repeat
                    </CardTitle>
                    {occurrenceDate && (
                        <p className="text-sm text-muted-foreground">
                            Note: Changing recurrence settings will only affect the entire series, not this specific occurrence.
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={recurrenceType}
                        onValueChange={(value) => {
                            setRecurrenceType(value)
                            if (validationErrors.recurrence) {
                                setValidationErrors((prev) => ({ ...prev, recurrence: "" }))
                            }
                        }}
                    >
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

                    {validationErrors.recurrence && <p className="text-red-500 text-sm mt-2">{validationErrors.recurrence}</p>}

                    {recurrenceType === "custom" && (
                        <Button type="button" variant="outline" className="mt-4" onClick={handleCustomRecurrence}>
                            Configure Custom Recurrence
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4">
                {event && event.is_recurring && occurrenceDate ? (
                    // Show two buttons for recurring events with occurrence date
                    <>
                        <Button
                            type="button"
                            disabled={loadingOccurrence || loadingSeries}
                            className="flex items-center gap-2"
                            onClick={handleUpdateOccurrence}
                        >
                            {loadingOccurrence ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Update This Occurrence
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loadingOccurrence || loadingSeries}
                            className="flex items-center gap-2"
                            onClick={handleUpdateSeries}
                        >
                            {loadingSeries ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Update Entire Series
                        </Button>
                    </>
                ) : (
                    // Show single button for non-recurring events or new events
                    <Button
                        type="button"
                        disabled={loadingSeries}
                        className="flex items-center gap-2"
                        onClick={handleUpdateSeries}
                    >
                        {loadingSeries ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        {event ? "Update Event" : "Create Event"}
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                </Button>
            </div>

            {/* Custom Recurrence Modal */}
            {showCustomRecurrence && (
                <CustomRecurrenceDialog
                    recurrence={customRecurrence}
                    onSave={(newRecurrence) => {
                        setCustomRecurrence(newRecurrence)
                        setShowCustomRecurrence(false)
                        if (validationErrors.recurrence) {
                            setValidationErrors((prev) => ({ ...prev, recurrence: "" }))
                        }
                    }}
                    onCancel={() => setShowCustomRecurrence(false)}
                />
            )}
        </div>
    )
}

// Custom Recurrence Dialog Component (keeping the same as before)
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

    const [monthlyPattern, setMonthlyPattern] = useState<"absolute" | "relative">(
        recurrence.byday && recurrence.bysetpos ? "relative" : "absolute",
    )
    const [bysetpos, setBysetpos] = useState<number>(recurrence.bysetpos || 1)
    const [byday, setByday] = useState<string>(recurrence.byday || "MO")

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

        if (frequency === "monthly" && monthlyPattern === "relative") {
            newRecurrence.byday = byday
            newRecurrence.bysetpos = bysetpos
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

                    {frequency === "monthly" && (
                        <div>
                            <Label>Monthly Pattern</Label>
                            <RadioGroup value={monthlyPattern} onValueChange={(v) => setMonthlyPattern(v as "absolute" | "relative")}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="absolute" id="absolute" />
                                    <Label htmlFor="absolute">On the same date each month</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="relative" id="relative" />
                                    <Label htmlFor="relative">On a relative day</Label>
                                </div>
                            </RadioGroup>

                            {monthlyPattern === "relative" && (
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div>
                                        <Label>Position</Label>
                                        <Select value={bysetpos.toString()} onValueChange={(v) => setBysetpos(Number(v))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">First</SelectItem>
                                                <SelectItem value="2">Second</SelectItem>
                                                <SelectItem value="3">Third</SelectItem>
                                                <SelectItem value="4">Fourth</SelectItem>
                                                <SelectItem value="-1">Last</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Day</Label>
                                        <Select value={byday} onValueChange={setByday}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SU">Sunday</SelectItem>
                                                <SelectItem value="MO">Monday</SelectItem>
                                                <SelectItem value="TU">Tuesday</SelectItem>
                                                <SelectItem value="WE">Wednesday</SelectItem>
                                                <SelectItem value="TH">Thursday</SelectItem>
                                                <SelectItem value="FR">Friday</SelectItem>
                                                <SelectItem value="SA">Saturday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
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
