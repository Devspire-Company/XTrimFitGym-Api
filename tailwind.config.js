/** @type {import('tailwindcss').Config} */
module.exports = {
	// NOTE: Update this to include the paths to all files that contain Nativewind classes.
	content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				// Primary Colors
				'primary-red': '#E41E26',
				'primary-yellow': '#F9C513',
				'primary-gray': '#6A7B94',

				// Background Colors
				'bg-dark': '#1a1d29',
				'bg-darker': '#13161f',
				'bg-primary': '#1C1C1E',
				'bg-light': '#22252f',

				// Text Colors
				'text-primary': '#ffffff',
				'text-secondary': '#b8bcc8',

				// Success Colors
				success: '#10B981',
				'success-alt': '#22c55e',

				// Danger/Error Colors
				danger: '#EF4444',
				'danger-dark': '#DC2626',
				'danger-darker': '#B91C1C',
				'red-alt': '#ff4444',

				// Warning Colors
				warning: '#F59E0B',

				// Form Colors
				placeholder: '#6c757d',
			},
			backgroundColor: {
				// Card/modal solid (slightly lighter than bg-darker)
				'bg-primary': '#1C1C1E',
				// Modal/card with slight frosted feel (opaque)
				'bg-primary-solid': 'rgba(28, 28, 30, 0.98)',
				// Card backgrounds
				card: 'rgba(255, 255, 255, 0.06)',
				'card-light': 'rgba(255, 255, 255, 0.04)',
				'card-lighter': 'rgba(255, 255, 255, 0.05)',

				// Button backgrounds
				'button-primary': '#E41E26', // Primary button (red) - use with LinearGradient for gradient
				'button-gradient': 'linear-gradient(135deg, #E41E26, #F9C513)', // Red to yellow gradient (use GradientButton component)
				'button-secondary': 'rgba(255, 255, 255, 0.05)',
				'icon-button': 'rgba(255, 255, 255, 0.05)',

				// Yellow states
				'yellow-hover': 'rgba(249, 197, 19, 0.1)',
				'yellow-active': 'rgba(249, 197, 19, 0.15)',
				'yellow-badge': 'rgba(249, 197, 19, 0.15)',

				// Red states
				'red-overlay': 'rgba(228, 30, 38, 0.1)',

				// Modal & Overlays
				'modal-overlay': 'rgba(0, 0, 0, 0.7)',
				'panel-overlay': 'rgba(0, 0, 0, 0.5)',
				'header-nav': 'rgba(19, 22, 31, 0.95)',

				// Success states
				'success-icon': 'rgba(34, 197, 94, 0.2)',
				'success-bg': 'rgba(16, 185, 129, 0.15)',

				// Error states
				'error-icon': 'rgba(239, 68, 68, 0.2)',

				// Input backgrounds
				input: 'rgba(255, 255, 255, 0.04)',
				'input-alt': 'rgba(255, 255, 255, 0.05)',

				// Modal header
				'modal-header': 'rgba(249, 197, 19, 0.05)',

				// Delete button
				delete: 'rgba(239, 68, 68, 0.95)',
				'delete-toast': 'rgba(16, 185, 129, 0.95)',
			},
			borderColor: {
				// Card borders
				card: 'rgba(255, 255, 255, 0.1)',
				'card-hover': 'rgba(249, 197, 19, 0.3)',

				// Button borders
				button: 'rgba(255, 255, 255, 0.1)',

				// Yellow borders
				yellow: 'rgba(249, 197, 19, 0.3)',
				'yellow-hover': 'rgba(249, 197, 19, 0.3)',
				'yellow-active': 'rgba(249, 197, 19, 0.4)',

				// Input borders
				input: 'rgba(255, 255, 255, 0.1)',
				'input-focus': '#F9C513',

				// Header borders
				header: 'rgba(255, 255, 255, 0.08)',
			},
			textColor: {
				placeholder: '#6c757d',
			},
		},
	},
	plugins: [],
};
