import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';

@Injectable()
export class DateParserUtil {

    /**
     * Extremely simple NLP-like date parsing.
     * Enhances base Dayjs parsing with relative terms like "tomorrow", "next monday", etc.
     */
    parseWhatsAppDateInput(input: string): string | null {
        const text = input.trim().toLowerCase();
        let targetDate = dayjs();

        if (text === 'tomorrow' || text === 'tmr') {
            targetDate = targetDate.add(1, 'day');
            return targetDate.format('YYYY-MM-DD');
        }

        if (text === 'today') {
            return targetDate.format('YYYY-MM-DD');
        }

        // Check if it's a day of the week
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const abbreviations = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

        for (let i = 0; i < 7; i++) {
            if (text.includes(days[i]) || text.includes(abbreviations[i])) {
                // Find next occurrence of this day
                let currentDay = targetDate.day();
                let daysToAdd = i - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7; // Next week
                if (text.includes('next')) daysToAdd += 7;

                targetDate = targetDate.add(daysToAdd, 'day');
                return targetDate.format('YYYY-MM-DD');
            }
        }

        // Try standard parsing
        const parsed = dayjs(input);
        if (parsed.isValid()) {
            return parsed.format('YYYY-MM-DD');
        }

        return null; // Could not parse
    }
}
