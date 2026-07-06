import { format_date } from '../format_date/index.js'

/**
 * @module format_elapse
 * @remarks Creates a nice string that shows the time since the passed in date
 * @group Vanllia
 * @version 1.1.0
 * @param date - Date object, timestamp, or date string
 * @param time - Append " at {hh}:{mm}" to Today/Yesterday (default: true)
 * @param max - How many days back to format as "N days ago" before returning false (default: 3)
 * @returns Formatted time/date string Yesterday at 10:20
 *
 * @example
 * const date = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
 * format_elapse(date); // Returns: "60 minutes ago"
 *
 * const yesterday_date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
 * format_elapse(yesterday_date); // Returns: "Yesterday at HH:MM" (e.g., "Yesterday at 15:30")
 * format_elapse(yesterday_date, false); // Returns: "Yesterday"
 *
 * const three_days_ago = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
 * format_elapse(three_days_ago); // Returns: "3 days ago"
 *
 * const old_date = new Date("2023-01-01");
 * format_elapse(old_date); // Returns: false (for dates older than max)
 */

export function format_elapse(date: Date | string | number, time = true, max = 3): string | false {
	const d = typeof date === 'object' ? date : new Date(date)
	const day_miliseconds = 86400000 // 24 * 60 * 60 * 1000
	const today = new Date()
	const seconds = Math.round((today.getTime() - d.getTime()) / 1000)
	const minutes = Math.round(seconds / 60)

	// Difference in calendar days, ignoring the time of day
	const start_of_day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
	const day_diff = Math.round((start_of_day(today) - start_of_day(d)) / day_miliseconds)

	if (seconds < 5) return 'now'
	if (seconds < 60) return `${seconds} seconds ago`
	if (seconds < 90) return 'about a minute ago'
	if (minutes < 60) return `${minutes} minutes ago`
	if (day_diff === 0) return time ? format_date('Today at {hh}:{mm}', d) : 'Today'
	if (day_diff === 1) return time ? format_date('Yesterday at {hh}:{mm}', d) : 'Yesterday'
	if (day_diff <= max) return `${day_diff} days ago`

	return false
}
