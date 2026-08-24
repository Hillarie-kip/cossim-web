/**
 * Converts a given date (string, Date, or timestamp) to the local timezone and returns an ISO string.
 * @param {string|Date|number} dateInput - The date to convert.
 * @returns {string} Local timezone ISO string (YYYY-MM-DDTHH:mm:ss).
 */
export function toLocalISOString(dateInput) {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    // Get local date parts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Converts a given date to a formatted string in the local timezone.
 * @param {string|Date|number} dateInput - The date to convert.
 * @param {object```
/**
 * Converts a date value to a string formatted in the user's local timezone.
 * Accepts Date, string, or timestamp input.
 * @param {Date|string|number} input - The date to convert.
 * @param {Object} [options] - Formatting options.
 * @param {boolean} [options.includeSeconds=false] - Whether to include seconds in output.
 * @returns {string} Formatted local date-time string.
 */
export function formatLocalDate(input, options = {}) {
    const date = new Date(input);
    if (isNaN(date)) return '';
    const opts = { hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit' };
    if (options.includeSeconds) opts.second = '2-digit';
    // Use user's locale and timezone
    return date.toLocaleString(undefined, opts);
}

/**
 * Formats a date to YYYY-MM-DD in local timezone.
 * @param {Date|string|number} dateInput - The date to format.
 * @returns {string} Formatted date string.
 */
export function formatLocalDateOnly(dateInput) {
    if (dateInput === null || dateInput === undefined || dateInput === "") return "";

    // Preserve an existing date-only value without parsing it as UTC, which
    // could otherwise shift the calendar day in some time zones.
    if (typeof dateInput === "string") {
        const dateOnlyMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
        if (dateOnlyMatch) return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    }

    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
