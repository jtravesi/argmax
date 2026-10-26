// Every UI string lives here (CLAUDE.md, Conventions) so other languages can be added later.

/** Names used inside issue messages, already resolved from the model. */
export interface IssueContext {
	/** Human label of the field the issue points to, e.g. "Weight of “Money”". */
	field: string;
	alternative: string;
	params: Record<string, string | number>;
}

const percent = (x: string | number) => `${Math.round(Number(x) * 100)}%`;

export const en = {
	locale: 'en-US',
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
	theme: {
		auto: 'Theme: automatic',
		light: 'Theme: light',
		dark: 'Theme: dark',
		help: 'Changes between automatic (as your system), light and dark'
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
	},

	home: {
		lead: 'A step-by-step guide to deciding under uncertainty: list your options, what could happen with each and how likely it is, what you care about and how much, and get the expected utility of every option together with a sensitivity analysis.',
		purpose:
			'It is for decisions that matter and do not have an obvious answer: a job change, a move, a big purchase. The process matters more than the number: it makes your beliefs explicit and checks that they are consistent.',
		howHeading: 'How it works',
		how: [
			{
				title: 'Describe the decision',
				text: 'Your alternatives and, for each one, the outcomes that could follow and how likely you think they are.'
			},
			{
				title: 'Say what matters',
				text: 'The dimensions you care about, how much each one weighs, and a score from 0 to 10 for every outcome.'
			},
			{
				title: 'Read the result',
				text: 'The expected utility of each alternative, its risk, and how much your inputs would have to change for the ranking to change.'
			}
		],
		start: 'Get started',
		templatesHeading: 'Start from an example',
		useTemplate: 'Use this template',
		useTemplateLabel: (title: string) => `Use this template: ${title}`,
		privacy: 'Private by design: everything runs in your browser and nothing you enter leaves it.'
	},

	about: {
		authorHeading: 'Author',
		author: (name: string) => `Made by ${name}.`,
		profile: 'GitHub profile',
		repository: 'Source code on GitHub',
		license: 'MIT license',
		privacyHeading: 'Privacy',
		privacy: [
			'There is no server behind this site: no accounts, no cookies, no analytics and no requests to third parties.',
			'Anything you save lives only in this browser, and it is removed when you clear the site data.'
		],
		disclaimerHeading: 'Disclaimer',
		disclaimer:
			'Argmax is an educational tool to support reflection. It is not professional advice, whether financial, medical, legal or psychological.',
		selfHostHeading: 'Run it yourself',
		selfHost: 'Argmax is a static site. To run your own copy with Docker:',
		readme: 'More options in the README',
		contributeHeading: 'Contribute',
		contribute: 'Found a problem or have an idea?',
		issues: 'Open an issue on GitHub'
	},

	model: {
		contents: 'Contents'
	},

	app: {
		toolbar: 'Model',
		confirmTemplate: (title: string) => `Replace your saved model with the template “${title}”?`,
		newModel: 'New model',
		confirmNew: 'Start a new model? The current one will be discarded.',
		loadTemplate: 'Load template',
		confirmLoad: (title: string) => `Load “${title}”? The current model will be discarded.`,
		importJson: 'Import JSON',
		exportJson: 'Export JSON',
		share: 'Share link',
		importTooLarge: 'That file is larger than 256 KB, so it was not opened.',
		importUnreadable: 'That file could not be read.',
		importInvalid: (file: string) => `“${file}” is not a valid Argmax model. Nothing was loaded:`,
		imported: (title: string) => `Imported “${title}”.`,
		confirmImport: (title: string) => `Replace the current model with “${title}”?`,
		moreIssues: (n: number) => `…and ${n} more.`,
		dismiss: 'Dismiss',
		shareHeading: 'Share this model',
		shareWarning: 'Anyone with this link will see your whole model.',
		shareLink: 'Link to this model',
		copy: 'Copy link',
		copied: 'Link copied.',
		copyFailed: 'Your browser did not allow copying. Select the link and copy it by hand.',
		close: 'Close',
		shareTooLarge: 'This model is too large to share by link. Export it as JSON instead.',
		shareNotValid: 'Fix the errors in the model before sharing it.',
		sharedTooLarge: 'The shared link is too large to open safely, so it was ignored.',
		sharedCorrupt: 'The shared link is damaged or incomplete, so it was ignored.',
		sharedInvalid: 'The shared link does not contain a valid Argmax model. Nothing was loaded:',
		sharedHeading: 'A model was shared with you',
		sharedPrompt: (title: string) =>
			`The link contains “${title}”. You also have a model saved in this browser. What would you like to do?`,
		sharedReplace: 'Replace my model with it',
		sharedView: 'Just view it (read-only)',
		readOnly: (title: string) =>
			`You are viewing “${title}”, which was shared with you. It is read-only, and your saved model has not changed.`,
		keepShared: 'Keep it as my model',
		backToMine: 'Back to my model',
		saved: 'Saved in this browser.',
		notSaved: (n: number) =>
			`Not saved yet: ${n === 1 ? '1 problem needs' : `${n} problems need`} fixing.`,
		storageUnavailable:
			'This browser does not allow saving. The tool still works, but your model will be lost when you close the page.',
		savedInvalid: 'A saved model could not be read and was ignored.'
	},

	wizard: {
		stepsLabel: 'Steps',
		stepOf: (n: number, total: number) => `Step ${n} of ${total}`,
		hasErrors: 'has errors',
		back: 'Back',
		next: 'Next',
		seeResults: 'See results',
		issuesHeading: 'Check this step',
		errorsHere: 'Errors',
		warningsHere: 'Warnings',
		steps: {
			decision: 'The decision',
			dimensions: 'Dimensions',
			alternatives: 'Alternatives',
			states: 'States and probabilities',
			scores: 'Scores',
			results: 'Results'
		},
		remove: 'Remove',
		sum: (pct: number) => `Sum: ${pct}%`,
		sumUnknown: 'Sum: —',
		sumOk: 'adds up to 100%',
		sumOff: 'does not add up to 100%',
		normalize: 'Normalize',
		decision: {
			help: 'Phrase the decision as a question.',
			title: 'Title',
			titlePlaceholder: 'Should I…?',
			description: 'Description (optional)',
			horizon: 'Time horizon (optional)',
			horizonPlaceholder: 'e.g. 1 year'
		},
		dimensions: {
			help: [
				'A weight says how much going from the worst (0) to the best (10) on that dimension is worth compared with the others. It is not how important the dimension is in the abstract.',
				'Trick: imagine two scenarios that differ only on two dimensions, one at its best and the other at its worst. Which swing would you rather have, and by how much?'
			],
			name: 'Name',
			weight: 'Weight (%)',
			weightOf: (name: string) => `Weight of ${name} (%)`,
			nameOf: (n: number) => `Name of dimension ${n}`,
			add: 'Add dimension',
			common: 'Common dimensions',
			chips: [
				'Money',
				'Wellbeing',
				'Learning',
				'Freedom',
				'Health',
				'Relationships',
				'Career progression'
			],
			removeOf: (name: string) => `Remove dimension ${name}`,
			empty: 'No dimensions yet.',
			limit: 'Up to 10 dimensions.'
		},
		alternatives: {
			help: 'Is there an option you are not considering?',
			nameOf: (n: number) => `Name of alternative ${n}`,
			add: 'Add alternative',
			removeOf: (name: string) => `Remove alternative ${name}`,
			limit: 'Between 2 and 8 alternatives.'
		},
		states: {
			help: [
				'States are the possible outcomes if you choose this alternative. They must be mutually exclusive; 3 or 4 per alternative are usually enough.',
				'Unsure about a probability? Ask yourself which outcome you would bet money on.',
				'Read percentages as frequencies: 30% means 3 times out of 10.'
			],
			alternativesLabel: 'Alternative',
			name: 'Outcome',
			probability: 'Probability (%)',
			nameOf: (n: number, alt: string) => `Outcome ${n} of ${alt}`,
			probabilityOf: (name: string) => `Probability of ${name} (%)`,
			add: 'Add state',
			removeOf: (name: string) => `Remove state ${name}`,
			empty: 'No states yet.',
			limit: 'Up to 8 states per alternative.'
		},
		scores: {
			help: 'Score each outcome on each dimension.',
			scale: 'Scale: 0 terrible · 5 neutral · 10 excellent',
			state: 'Outcome',
			utility: 'u(a, s)',
			utilityLong: 'Utility of the outcome',
			scoreOf: (state: string, dimension: string) => `Score of ${state} on ${dimension}`,
			noStates: 'Add states to this alternative first.',
			noDimensions: 'Add dimensions first.'
		},
		blocked: 'Fix the errors in the steps marked above to see the results.'
	},

	results: {
		verdict: 'Verdict',
		winner: (name: string) => `${name} has the highest expected utility.`,
		eu: 'Expected utility',
		gap: (gap: string, name: string) => `${gap} ahead of ${name}`,
		robustness: {
			clear: 'Clear decision',
			moderate: 'Moderate decision',
			close: 'Close call: the inputs decide'
		},
		warnings: 'Warnings',
		ranking: 'Ranking',
		rankingChart: 'Expected utility per alternative, on a scale from 0 to 10',
		breakdown: 'Breakdown per alternative',
		state: 'Outcome',
		probability: 'Probability',
		utility: 'u(a, s)',
		contribution: 'Contribution',
		total: 'Expected utility',
		contributionsChart: (alt: string) =>
			`Contributions of each outcome to the expected utility of ${alt}`,
		risk: 'Risk profile',
		riskHelp:
			'These indicators do not change the recommendation. They show whether an alternative wins by consistency or by its tail.',
		tau: 'Threshold τ for a bad outcome',
		alternative: 'Alternative',
		worst: 'Worst case',
		best: 'Best case',
		stdDev: 'σ',
		stdDevLong: 'Standard deviation',
		euShort: 'EU',
		pBelowTau: (tau: string) => `P(u < ${tau})`,
		rangeChart: 'Range of utilities per alternative: worst case, expected utility and best case',
		chartTable: 'The same values are in the table.',
		profile: 'Expected profile',
		profileHelp:
			'The average score you expect on each dimension, x̄(a, d). It does not depend on the weights.',
		dimension: 'Dimension',
		dominance: (a: string, b: string) => `${a} beats ${b} whatever the weights.`,
		dominanceHelp:
			'It scores at least as well on every dimension of the expected profile, and better on at least one.',
		whatIf: 'What if…',
		whatIfHelp:
			'Move a weight or a probability to see how the ranking would change. The others are rescaled proportionally. Your model is not changed.',
		whatIfWeights: 'Weights',
		whatIfProbabilities: (alt: string) => `Probabilities of ${alt}`,
		whatIfRanking: 'What-if ranking',
		whatIfChanged: (name: string) => `With these values, ${name} comes first.`,
		whatIfSame: 'The first alternative does not change.',
		reset: 'Reset',
		weightOf: (dim: string) => `Weight of ${dim}`,
		probabilityOf: (state: string, alt: string) => `Probability of ${state} (${alt})`,
		tipping: 'Tipping points',
		tippingWeightsHelp: (runnerUp: string, winner: string) =>
			`The weight of each dimension at which ${runnerUp} would tie with ${winner}, the others rescaled proportionally. Beyond it, the order changes.`,
		tippingProbabilitiesHelp: (runnerUp: string, winner: string) =>
			`The probability of each outcome of the top two at which ${runnerUp} and ${winner} would tie.`,
		current: 'Current',
		tippingPoint: 'Tipping point',
		noWeightChanges: 'No weight changes the order',
		noProbabilityChanges: 'No probability changes the order',
		side: {
			above: (value: string) => `above ${value}`,
			below: (value: string) => `below ${value}`,
			at: (value: string) => `at ${value}`
		},
		outcomeOf: (state: string, alt: string) => `${state} (${alt})`,
		tornado: 'Tornado',
		tornadoHelp: (winner: string, runnerUp: string, h: string) =>
			`How the gap between ${winner} and ${runnerUp} changes when each weight or probability moves ±${h} (the others rescaled). A bar that crosses 0 means that input alone can change the winner.`,
		tornadoH: 'Range explored',
		tornadoChart: (winner: string, runnerUp: string) =>
			`Tornado diagram of the gap between ${winner} and ${runnerUp} for each input`,
		parameter: 'Input',
		range: 'Range explored',
		gapAtLow: 'Gap at the low end',
		gapAtHigh: 'Gap at the high end',
		winnerChanges: 'Winner changes?',
		yes: (name: string) => `Yes: ${name}`,
		no: 'No',
		reminder:
			'The model does not decide for you. If the result does not match your intuition, ask yourself what you are modeling wrong, or what is biasing your intuition.'
	},

	unnamed: {
		dimension: (n: number) => `Dimension ${n}`,
		alternative: (n: number) => `Alternative ${n}`,
		state: (n: number) => `State ${n}`
	},
	quoted: (name: string) => `“${name}”`,

	fields: {
		title: 'Title',
		description: 'Description',
		horizon: 'Time horizon',
		dimensions: 'Dimensions',
		alternatives: 'Alternatives',
		model: 'Model',
		nameOf: (thing: string) => `Name of ${thing}`,
		weightOf: (dim: string) => `Weight of ${dim}`,
		statesOf: (alt: string) => `States of ${alt}`,
		stateOf: (state: string, alt: string) => `${state} of ${alt}`,
		probabilityOf: (state: string, alt: string) => `Probability of ${state} (${alt})`,
		scoresOf: (state: string, alt: string) => `Scores of ${state} (${alt})`,
		scoreOf: (state: string, alt: string, dim: string) => `Score of ${state} (${alt}) on ${dim}`
	},

	issues: {
		'too-few-alternatives': () => 'Add at least 2 alternatives.',
		'no-dimensions': () => 'Add at least 1 dimension.',
		'no-states': (c: IssueContext) => `${c.alternative} needs at least 1 state.`,
		'weight-invalid': (c: IssueContext) => `${c.field} must be a number of at least 0.`,
		'weights-sum-zero': () => 'At least one weight must be above 0.',
		'probability-invalid': (c: IssueContext) => `${c.field} must be a number of at least 0.`,
		'probabilities-sum-zero': (c: IssueContext) =>
			`${c.alternative}: at least one probability must be above 0.`,
		'score-out-of-range': (c: IssueContext) => `${c.field} must be between 0 and 10.`,
		'scores-mismatch': (c: IssueContext) => `${c.field} must have exactly one score per dimension.`,
		'weights-not-normalized': (c: IssueContext) =>
			`Weights add up to ${percent(c.params.sum)}; they are normalized to 100%.`,
		'probabilities-not-normalized': (c: IssueContext) =>
			`${c.alternative}: probabilities add up to ${percent(c.params.sum)}; they are normalized to 100%.`,
		'single-state': (c: IssueContext) =>
			`${c.alternative} has a single state, so it carries no uncertainty.`,
		'zero-weight': (c: IssueContext) => `${c.field} has weight 0, so it has no effect.`,
		'invalid-json': () => 'The file is not valid JSON.',
		'unsupported-version': () => 'This model was made with an unsupported version of Argmax.',
		'forbidden-key': (c: IssueContext) => `${c.field}: this name is not allowed.`,
		'duplicate-id': (c: IssueContext) => `${c.field} is duplicated.`,
		'invalid-type': (c: IssueContext) => `${c.field} has the wrong type.`,
		'too-small': (c: IssueContext) => {
			const min = Number(c.params.minimum);
			if (c.params.kind === 'text')
				return min <= 1 ? `${c.field} is required.` : `${c.field} is too short.`;
			if (c.params.kind === 'list') return `${c.field}: at least ${min}.`;
			return `${c.field} must be at least ${min}.`;
		},
		'too-big': (c: IssueContext) => {
			const max = Number(c.params.maximum);
			if (c.params.kind === 'text') return `${c.field} is too long (up to ${max} characters).`;
			if (c.params.kind === 'list') return `${c.field}: at most ${max}.`;
			return `${c.field} must be at most ${max}.`;
		},
		'unrecognized-key': (c: IssueContext) => `${c.field} is not part of a model.`,
		invalid: (c: IssueContext) => `${c.field} is not valid.`
	}
} as const;

export type Messages = typeof en;
