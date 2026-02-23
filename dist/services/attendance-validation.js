import User from '../database/models/user/user-schema.js';
/**
 * Fetches from MongoDB the set of card numbers (attendanceId) and person name variants
 * that are considered valid (registered users). Used to filter out ghost/corrupt records
 * written by IVMS-4200 on reconnect (e.g. "Jack Williams" with wrong metadata).
 */
export async function getValidAttendanceIdentifiers() {
    const users = await User.find({})
        .select('firstName middleName lastName attendanceId')
        .lean();
    const validCardNos = new Set();
    const validPersonNames = new Set();
    const displayNameByCardNo = new Map();
    for (const u of users) {
        const first = (u.firstName || '').trim();
        const middle = (u.middleName || '').trim();
        const last = (u.lastName || '').trim();
        const full = `${first} ${middle} ${last}`.trim().replace(/\s+/g, ' ');
        const firstLast = `${first} ${last}`.trim();
        const lastFirst = `${last}, ${first}`.trim();
        if (u.attendanceId != null) {
            const cardStr = String(u.attendanceId);
            validCardNos.add(cardStr);
            if (full)
                displayNameByCardNo.set(cardStr, full);
            else if (firstLast)
                displayNameByCardNo.set(cardStr, firstLast);
        }
        if (full)
            validPersonNames.add(full);
        if (firstLast && firstLast !== full)
            validPersonNames.add(firstLast);
        if (lastFirst)
            validPersonNames.add(lastFirst);
        if (first)
            validPersonNames.add(first);
        if (last)
            validPersonNames.add(last);
    }
    return { validCardNos, validPersonNames, displayNameByCardNo };
}
/**
 * Returns true if the attendance record belongs to a registered user (matched by cardNo or personName).
 */
export function isAttendanceRecordValid(record, ids) {
    const cardNo = record.cardNo != null && record.cardNo !== '' ? String(record.cardNo).trim() : null;
    const personName = (record.personName || '').trim();
    if (cardNo && ids.validCardNos.has(cardNo))
        return true;
    if (personName && ids.validPersonNames.has(personName))
        return true;
    // Case-insensitive match for personName (IVMS may change case)
    const personLower = personName.toLowerCase();
    for (const name of ids.validPersonNames) {
        if (name.toLowerCase() === personLower)
            return true;
    }
    return false;
}
/**
 * Optionally replace personName with the display name from MongoDB when we have a match by cardNo.
 * This corrects IVMS-corrupted personName (e.g. "Jack Williams") while keeping the rest of the record.
 */
export function correctPersonNameFromCardNo(record, ids) {
    const cardNo = record.cardNo != null && record.cardNo !== '' ? String(record.cardNo).trim() : null;
    if (cardNo) {
        const displayName = ids.displayNameByCardNo.get(cardNo);
        if (displayName)
            return displayName;
    }
    return record.personName || '';
}
