# WhatsApp Interactive Buttons Plan

## Goal
Make WhatsApp bot faster and easier to use with interactive buttons:
- Numbered menu options
- Interactive buttons for booking
- Doctor selection with availability check
- Quick access to clinic information

---

## Current vs Proposed

### Current Flow (Text-based)
```
Bot: 1️⃣ Book new appointment
     2️⃣ View my appointments
     3️⃣ Cancel an appointment
User: 1
```

### Proposed Flow (Buttons)
```
Bot: [1️⃣ Book Appointment] [2️⃣ My Appointments]
     [3️⃣ Cancel] [4️⃣ Our Doctors] [5️⃣ Help]
User: clicks "1️⃣ Book Appointment"
```

---

## Interactive Buttons Implementation

### WATI API for Interactive Messages

WATI supports these message types:
1. **Quick Reply Buttons** - Up to 3 buttons
2. **List Messages** - More options with sections

### Message Types to Implement:

#### 1. Main Menu (Quick Reply Buttons)
```
👋 Welcome to Smile Center Dental Clinic!

How can we help you today?

[1️⃣ Book Appointment] [2️⃣ My Appointments]
[3️⃣ Cancel] [4️⃣ Our Doctors] [5️⃣ Help]
```

#### 2. Select Doctor (with available slots check)
```
👨‍⚕️ Select Doctor:

1️⃣ Dr. Smith - Dentist
2️⃣ Dr. Johnson - Orthodontist  
3️⃣ Dr. Williams - Pediatric
```

#### 3. Select Date
```
📅 Select Date:

[Tomorrow] [Day After] [This Week] [Pick Date]
```

#### 4. Select Time Slot
```
⏰ Available Slots for [Date]:

[9:00 AM] [9:30 AM] [10:00 AM] [10:30 AM]
[11:00 AM] [11:30 AM] [2:00 PM] [2:30 PM]
```

#### 5. Doctor List with Specialization
```
👨‍⚕️ Our Doctors:

1️⃣ Dr. Sarah Smith
   ⭐ Dentist | 10+ years exp.

2️⃣ Dr. Michael Johnson
   ⭐ Orthodontist | 8 years exp.

3️⃣ Dr. Emily Williams
   ⭐ Pediatric Dentist | 5 years exp.
```

---

## Implementation Plan

### Phase 1: Update WATI Sender Utility

Add method for interactive buttons:

```typescript
// In wa-sender.util.ts
async sendInteractiveButtons(
  to: string, 
  message: string, 
  buttons: { id: string; title: string }[]
): Promise<void>
```

### Phase 2: Create Menu System

Update menu flow to use buttons instead of text:

- Main menu with numbered buttons
- Doctor selection with buttons
- Date selection with quick options

### Phase 3: Integrate Slot Checking

When user selects doctor:
1. Fetch available slots for that doctor
2. Show time slots as buttons
3. Only show available times

### Phase 4: Display Doctor Information

Show doctor details:
- Name
- Specialization
- Experience
- Available slots

---

## Technical Details

### WATI API Endpoint for Buttons:
```
POST /api/v1/sendSessionMessage/{phone}
```

With payload:
```json
{
  "messageText": "message",
  "buttons": [
    {"id": "1", "title": "Book Appointment"},
    {"id": "2", "title": "My Appointments"}
  ]
}
```

### Session States for Button Flow:
```typescript
export enum SessionState {
  IDLE = 'IDLE',
  SELECTING_DOCTOR = 'SELECTING_DOCTOR',
  SELECTING_DATE = 'SELECTING_DATE',
  SELECTING_SLOT = 'SELECTING_SLOT',
  CONFIRMING_BOOKING = 'CONFIRMING_BOOKING',
  // ... existing states
}
```

---

## Step-by-Step Tasks

- [ ] Task 1: Update WaSenderUtil to support buttons
- [ ] Task 2: Create button menu system
- [ ] Task 3: Implement doctor selection with buttons
- [ ] Task 4: Add slot checking to button flow
- [ ] Task 5: Create doctor info display
- [ ] Task 6: Test and refine

---

## Buttons Layout Examples

### Main Menu (3x2 grid feel)
```
[1️⃣ Book] [2️⃣ View] [3️⃣ Cancel]
[4️⃣ Doctors] [5️⃣ Help]
```

### Time Slots (2x4 grid feel)
```
[9:00 AM] [9:30 AM] [10:00 AM] [10:30 AM]
[11:00 AM] [11:30 AM] [2:00 PM] [2:30 PM]
```

---

## Success Criteria

✅ Users can book with 3-4 clicks instead of typing
✅ Clear numbered options
✅ Doctor info visible before booking
✅ Shows only available time slots
✅ Fast and intuitive UX

---

## Ready to implement?
