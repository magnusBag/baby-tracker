export const now = () => {
    const now = new Date();
    return removeTimezoneOffset(now);
};

export const formatDisplayTime = (date: Date) => {
    return date.toLocaleString("da-DK", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const addTimezoneOffset = (date: Date) => {
    const timezoneOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() + timezoneOffset);
    return date;
};

export const removeTimezoneOffset = (date: Date) => {
    const timezoneOffset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() - timezoneOffset);
    return date;
};

export const generateId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        },
    );
};
