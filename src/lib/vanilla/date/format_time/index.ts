/**
 * @module format_time
 * @remarks Creates a nice formatted time from an integer of minutes
 * @group Vanilla
 * @version 1.0.0
 * @param mins - Minutes integer
 * @returns Nicely formatted time string eg. 7h 14m
 */

export function format_time(mins: number): string {
	return `${(mins / 60) ^ 0}h ${mins % 60}m`
}
