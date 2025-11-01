import { createTheme, MantineColorsTuple } from '@mantine/core';

// Custom forest green color palette
const forestGreen: MantineColorsTuple = [
  '#f0f7f4',
  '#e1f0e8',
  '#c3e0d1',
  '#a1cfb7',
  '#7fbf9a',
  '#5daf7c',
  '#3d9f5e', // Primary forest green
  '#2d8448',
  '#1d6b32',
  '#0d521c'
];

// Light gray color palette for accents
const lightGray: MantineColorsTuple = [
  '#fafafa',
  '#f5f5f5',
  '#eeeeee',
  '#e0e0e0',
  '#bdbdbd',
  '#9e9e9e',
  '#757575',
  '#616161',
  '#424242',
  '#212121'
];

export const theme = createTheme({
  primaryColor: 'forestGreen',
  colors: {
    forestGreen,
    lightGray,
  },
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600',
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: 500,
          transition: 'all 0.2s ease',
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          borderColor: '#e0e0e0',
          '&:focus': {
            borderColor: '#3d9f5e',
            boxShadow: '0 0 0 2px rgba(61, 159, 94, 0.1)',
          },
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          borderColor: '#e0e0e0',
          '&:focus': {
            borderColor: '#3d9f5e',
            boxShadow: '0 0 0 2px rgba(61, 159, 94, 0.1)',
          },
        },
      },
    },
    Paper: {
      styles: {
        root: {
          borderRadius: '12px',
          border: '1px solid #f0f0f0',
        },
      },
    },
  },
});