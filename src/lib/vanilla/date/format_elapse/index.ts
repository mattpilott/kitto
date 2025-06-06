import { format_date } from '../format_date/index.js'

/**
 * @module format_elapse
 * @remarks Creates a nice string that shows the time since the passed in date
 * @group Vanllia
 * @version 1.0.1
 * @returns Formatted time/date string Yesterday at 10:20
 *
 * @example
 * const date = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
 * format_elapse(date); // Returns: "60 minutes ago"
 *
 * const yesterday_date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
 * format_elapse(yesterday_date); // Returns: "Yesterday at HH:MM" (e.g., "Yesterday at 15:30")
 *
 * const old_date = new Date("2023-01-01");
 * formatElapse(old_date); // Returns: false (for dates older than yesterday)
 */

export function format_elapse(date_param: Date | string | number): string | false {
	const date = typeof date_param === 'object' ? date_param : new Date(date_param)
	const day_miliseconds = 86400000 // 24 * 60 * 60 * 1000
	const today = new Date()
	const yesterday = new Date(today.getTime() - day_miliseconds)
	const seconds = Math.round((today.getTime() - date.getTime()) / 1000)
	const minutes = Math.round(seconds / 60)
	const is_today = today.toDateString() === date.toDateString()
	const is_yesterday = yesterday.toDateString() === date.toDateString()

	if (seconds < 5) return 'now'
	if (seconds < 60) return `${seconds} seconds ago`
	if (seconds < 90) return 'about a minute ago'
	if (minutes < 60) return `${minutes} minutes ago`
	if (is_today) return format_date('Today at {hh}:{mm}', date) // Today at 10:20
	if (is_yesterday) return format_date('Yesterday at {hh}:{mm}', date) // Yesterday at 10:20

	return false
}
