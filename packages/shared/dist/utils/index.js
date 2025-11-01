export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};
export const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
export const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
//# sourceMappingURL=index.js.map