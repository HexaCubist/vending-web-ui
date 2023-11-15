const daisyui = require('daisyui');
const typography = require('@tailwindcss/typography');
const forms = require('@tailwindcss/forms');

const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [typography, forms, daisyui],
	daisyui: {
		themes: ['fantasy', 'dark'],
		lightTheme: 'fantasy'
	}
};

module.exports = config;
