import { Dimensions } from 'react-native';

// Get device dimensions
const { width, height } = Dimensions.get('window');

// Base dimensions (iPhone 8 as reference device)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Responsive sizing helpers
export const scale = (size: number): number => (width / BASE_WIDTH) * size;
export const verticalScale = (size: number): number => (height / BASE_HEIGHT) * size;
export const moderateScale = (size: number, factor = 0.5): number => size + (scale(size) - size) * factor;

// Device size breakpoints
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_SMALL_DEVICE = width < 375;
export const IS_LARGE_DEVICE = width >= 768;
export const IS_LANDSCAPE = width > height;

// Common spacing values
export const SPACING = {
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
};

// Common radius values
export const RADIUS = {
    xs: scale(4),
    sm: scale(8),
    md: scale(12),
    lg: scale(16),
    xl: scale(24),
    round: scale(999),
};

// Common typography sizes
export const FONT_SIZE = {
    xs: scale(10),
    sm: scale(12),
    md: scale(14),
    lg: scale(16),
    xl: scale(18),
    xxl: scale(20),
    xxxl: scale(24),
    display: scale(28),
    title: scale(32),
};

export default {
    scale,
    verticalScale,
    moderateScale,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    IS_SMALL_DEVICE,
    IS_LARGE_DEVICE,
    IS_LANDSCAPE,
    SPACING,
    RADIUS,
    FONT_SIZE,
};