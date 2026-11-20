// Intl.supportedValuesOf is ES2022; the client targets ES2020 libs, so read it loosely.
const supportedValuesOf = (Intl as { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf;

/** IANA time zone names for gym time zone pickers. */
export const TIME_ZONE_OPTIONS: string[] = supportedValuesOf ? supportedValuesOf('timeZone') : ['America/Los_Angeles'];
