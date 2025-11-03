"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.generateId = exports.formatDateTime = exports.formatDate = void 0;
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
exports.formatDateTime = formatDateTime;
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
//# sourceMappingURL=index.js.map