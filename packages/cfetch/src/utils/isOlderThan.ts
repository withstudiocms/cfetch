/**
 * Determines whether a given date is older than a specified lifetime.
 *
 * @param date - The date to compare against the current time.
 * @param lifetime - The lifetime duration in the format of `${number}m` for minutes
 *                   or `${number}h` for hours (e.g., "30m" or "2h").
 * @returns `true` if the given date is older than the specified lifetime, otherwise `false`.
 */
export default function isOlderThan(date: Date, lifetime: `${number}m` | `${number}h`): boolean {
	const now = new Date();
	let milliseconds = 0;

	if (lifetime.endsWith('m')) {
		milliseconds = Number.parseInt(lifetime) * 60 * 1000; // Convert minutes to ms
	} else if (lifetime.endsWith('h')) {
		milliseconds = Number.parseInt(lifetime) * 60 * 60 * 1000; // Convert hours to ms
	}

	return date < new Date(now.getTime() - milliseconds);
}
