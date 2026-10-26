// Every UI string lives here (CLAUDE.md, Conventions) so other languages can be added later.
export const en = {
	site: {
		name: 'Argmax',
		tagline: 'Decision making under uncertainty, with the math in plain sight.'
	},
	nav: {
		label: 'Main',
		home: 'Home',
		app: 'Tool',
		model: 'The model',
		about: 'About'
	},
	footer: {
		repository: 'Source code',
		license: 'MIT license'
	},
	pages: {
		home: { title: 'Argmax', heading: 'Argmax' },
		app: { title: 'Tool · Argmax', heading: 'Tool' },
		model: { title: 'The model · Argmax', heading: 'The model' },
		about: { title: 'About · Argmax', heading: 'About' }
	}
} as const;

export type Messages = typeof en;
