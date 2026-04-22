// ID Generator Utility
export function generateId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${randomStr}`;
}

export function generateShortId(prefix = 'id') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${randomStr}`;
}

export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
