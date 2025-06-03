Here's a comprehensive test data collection covering all endpoints and edge cases for your Event Scheduler API:

### 1. Event Creation (POST /api/events/)

**Basic Event Types:**

```json
// 1. One-time event
{
  "title": "Doctor Appointment",
  "start": "2023-06-15T14:00:00Z",
  "end": "2023-06-15T15:00:00Z",
  "description": "Annual checkup",
  "is_recurring": false
}

// 2. Daily recurring event
{
  "title": "Morning Standup",
  "start": "2023-06-12T09:00:00Z",
  "end": "2023-06-12T09:30:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "daily",
    "interval": 1
  }
}

// 3. Weekly recurring (specific days)
{
  "title": "Team Meeting",
  "start": "2023-06-12T10:00:00Z",
  "end": "2023-06-12T11:00:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "weekly",
    "days": [0, 2, 4],  // Monday, Wednesday, Friday
    "interval": 1
  }
}

// 4. Monthly (specific position)
{
  "title": "Board Meeting",
  "start": "2023-06-15T14:00:00Z",
  "end": "2023-06-15T16:00:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "monthly",
    "byday": "FR",  // Friday
    "bysetpos": 2,  // Second Friday
    "interval": 1
  }
}
```

**Edge Cases:**

```json
// 1. With until date
{
  "title": "Summer Classes",
  "start": "2023-06-01T09:00:00Z",
  "end": "2023-06-01T11:00:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "weekly",
    "days": [1, 3],  // Tuesday, Thursday
    "until": "2023-08-31T00:00:00Z"
  }
}

// 2. With count limit
{
  "title": "Workshop Series",
  "start": "2023-06-05T18:00:00Z",
  "end": "2023-06-05T20:00:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "weekly",
    "count": 4
  }
}

// 3. Every 3rd day
{
  "title": "Water Plants",
  "start": "2023-06-01T08:00:00Z",
  "end": "2023-06-01T08:30:00Z",
  "is_recurring": true,
  "recurrence": {
    "frequency": "daily",
    "interval": 3
  }
}
```

### 2. Event Update (PUT/PATCH /api/events/{id}/)

```json
// 1. Update entire series
{
  "title": "Updated Meeting",
  "start": "2023-06-12T10:00:00Z",
  "end": "2023-06-12T11:30:00Z",
  "description": "Extended duration"
}

// 2. Update specific occurrence
{
  "title": "Special Meeting",
  "occurrence_date": "2023-06-14T10:00:00Z"
}

// 3. Partial update (PATCH)
{
  "description": "Bring your laptops"
}
```

### 3. Event Deletion (DELETE /api/events/{id}/)

```json
# 1. Delete specific occurrence
DELETE /api/events/{id}/?occurrence_date={ISO8601_datetime}
DELETE /api/events/42/?occurrence_date=2023-06-14T10:00:00Z

# 2. Delete entire series
DELETE /api/events/{id}/
DELETE /api/events/42/
```

### 4. Calendar View (GET /api/calendar/)

**Query Parameters:**

```json
# 1. Specific month view (June 2023)
/api/calendar/?start=2023-06-01T00:00:00Z&end=2023-06-30T23:59:59Z

# 2. Current month (no parameters needed)
/api/calendar/

# 3. Week view (June 12-18, 2023)
/api/calendar/?start=2023-06-12T00:00:00Z&end=2023-06-18T23:59:59Z

# 4. Custom date range
/api/calendar/?start=2023-07-01T00:00:00Z&end=2023-07-15T23:59:59Z

# 5. Single day view
/api/calendar/?start=2023-06-15T00:00:00Z&end=2023-06-15T23:59:59Z
```

### 5. Upcoming Events (GET /api/upcoming/)

**No parameters needed** - Automatically shows next 30 days

### Error Case Examples

```json
// 1. Invalid time range
{
  "title": "Invalid Event",
  "start": "2023-06-15T15:00:00Z",
  "end": "2023-06-15T14:00:00Z",
  "is_recurring": false
}

// 2. Missing recurrence rules
{
  "title": "Invalid Recurring",
  "start": "2023-06-15T14:00:00Z",
  "end": "2023-06-15T15:00:00Z",
  "is_recurring": true
}

// 3. Invalid date format
{
  "title": "Invalid Date",
  "start": "2023-06-15",
  "end": "2023-06-15T15:00:00Z",
  "is_recurring": false
}

// 4. Invalid occurrence update
{
  "title": "Updated",
  "occurrence_date": "2023-05-01T10:00:00Z"  // Past date
}
```

### Expected Responses

**Successful Creation (201):**

```json
{
  "id": 10,
  "title": "Board Meeting",
  "start": "2023-06-15T14:00:00Z",
  "end": "2023-06-15T16:00:00Z",
  "description": "",
  "is_recurring": true,
  "recurrence_rule": "RRULE:FREQ=MONTHLY;INTERVAL=1;BYDAY=FR;BYSETPOS=2",
  "recurrence_params": {
    "frequency": "monthly",
    "interval": 1,
    "byday": "FR",
    "bysetpos": 2
  }
}
```

**Error Response (400):**

```json
{
  "error": "End time must be after start time"
}
```

This collection covers:

- All basic event types (one-time, daily, weekly, monthly)
- Various recurrence patterns
- Edge cases (date limits, counts, intervals)
- Error scenarios
- Update/delete operations
- Calendar view parameters
- Response formats for success and failure

You can use these examples for:

- Manual testing
- Automated test cases
- API documentation examples
- Client-side implementation reference
