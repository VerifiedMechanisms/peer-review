// The peer-review questionnaire. One set of sections per track. Edit freely:
// the form renders from this file and the export uses the question ids as
// column names, so keep ids stable once reviews have been submitted.

export type Question =
  | { id: string; kind: 'scale'; label: string; help?: string; low: string; high: string; required?: boolean }
  | { id: string; kind: 'choice'; label: string; help?: string; options: string[]; required?: boolean }
  | { id: string; kind: 'text'; label: string; help?: string; rows?: number; required?: boolean }
  | { id: string; kind: 'number'; label: string; help?: string; min?: number; max?: number; required?: boolean };

export type Section = { title: string; intro?: string; questions: Question[] };

export type Track = 'RS' | 'RE';

const overall = (fitQuestion: string): Section => ({
  title: 'Overall',
  questions: [
    {
      id: 'overall_rec',
      kind: 'choice',
      label: fitQuestion,
      options: ['Strong yes', 'Yes', 'Unsure', 'No'],
      required: true,
    },
    {
      id: 'best',
      kind: 'text',
      label: 'The single strongest thing about this submission.',
      help: 'One to three sentences. Be specific: which result, which design choice, which paragraph.',
      rows: 3,
      required: true,
    },
    {
      id: 'weakest',
      kind: 'text',
      label: 'The single biggest weakness.',
      help: 'One to three sentences. A missing check, an unsupported claim, a design that does not earn its complexity.',
      rows: 3,
      required: true,
    },
    {
      id: 'for_author',
      kind: 'text',
      label: 'Anything you would be happy for us to pass on to the author, anonymously.',
      help: 'Optional. Reviews are otherwise seen only by the hiring team.',
      rows: 3,
    },
  ],
});

const aboutYourReview: Section = {
  title: 'About your review',
  questions: [
    {
      id: 'confidence',
      kind: 'scale',
      label: 'How confident are you in this assessment?',
      low: 'Low: outside what I know well',
      high: 'High: I checked the key parts myself',
      required: true,
    },
    {
      id: 'minutes',
      kind: 'number',
      label: 'Minutes spent on this review, roughly.',
      min: 1,
      max: 900,
      required: true,
    },
    {
      id: 'recognized',
      kind: 'choice',
      label: 'Do you think you know who wrote this?',
      options: ['No', 'I have a guess', 'Yes, fairly sure'],
      required: true,
    },
    {
      id: 'recognized_how',
      kind: 'text',
      label: 'If you have a guess, what gave it away?',
      help: 'Do not name the person. This only helps us anonymize better next time.',
      rows: 2,
    },
  ],
};

export const questionnaire: Record<Track, Section[]> = {
  RS: [
    {
      title: 'Part one: reading the run',
      intro: 'The author was asked to pick out, from about 200 agent-generated theorems, the results that matter and to explain why.',
      questions: [
        {
          id: 'rs_p1_selection',
          kind: 'scale',
          label: 'Did the author pick out the results that matter and make a case for them?',
          low: 'Lists results without a case for the choice',
          high: 'A clear, well-argued selection, with reasons for what was set aside',
          required: true,
        },
        {
          id: 'rs_p1_understanding',
          kind: 'scale',
          label: 'Does the writeup show the author’s own understanding rather than paraphrase?',
          low: 'Reads like the repository text',
          high: 'Own notation, own argument, correct restatements',
          required: true,
        },
        {
          id: 'rs_p1_note',
          kind: 'text',
          label: 'One thing they got right, or missed, in Part one.',
          rows: 2,
        },
      ],
    },
    {
      title: 'Part two: results of their own',
      intro: 'New upper or lower bounds on H*, or a new way of thinking about the problem, that the run did not produce.',
      questions: [
        {
          id: 'rs_p2_novelty',
          kind: 'scale',
          label: 'How much is genuinely new relative to the run?',
          low: 'Nothing beyond the run',
          high: 'A substantial new result or reframing',
          required: true,
        },
        {
          id: 'rs_p2_check',
          kind: 'choice',
          label: 'Did you check the main new claim?',
          options: ['Checked in detail and it holds', 'Skimmed, looks plausible', 'Found a gap or an error', 'Could not follow it'],
          required: true,
        },
        {
          id: 'rs_p2_claim',
          kind: 'text',
          label: 'State the main new claim in one or two sentences, and describe any gap or error you found.',
          rows: 4,
          required: true,
        },
        {
          id: 'rs_p2_significance',
          kind: 'scale',
          label: 'If it holds, how much does it advance the question of what H* depends on?',
          low: 'Marginal',
          high: 'Changes how I think about the problem',
          required: true,
        },
        {
          id: 'rs_formal',
          kind: 'choice',
          label: 'Formal verification of the new results.',
          options: ['Verified in Lean and checkable', 'Claimed, but not checkable from the writeup', 'None'],
          required: true,
        },
      ],
    },
    {
      title: 'Communication',
      questions: [
        {
          id: 'rs_clarity',
          kind: 'scale',
          label: 'Could a mech interp researcher who knows only the problem setup follow this writeup?',
          low: 'Hard to follow',
          high: 'Clear and precise throughout',
          required: true,
        },
      ],
    },
    overall('Would you want to work with this person on this problem?'),
    aboutYourReview,
  ],
  RE: [
    {
      title: 'Part one: the collaboration design',
      intro: 'The author had to make Qwen and GPT-OSS work together to solve problems and prove them in Lean 4.',
      questions: [
        {
          id: 're_design_summary',
          kind: 'text',
          label: 'Describe the collaboration design in one sentence, in your own words.',
          rows: 2,
          required: true,
        },
        {
          id: 're_design_clarity',
          kind: 'scale',
          label: 'Is the design explained well enough that you could reimplement it?',
          low: 'Would have to guess at most of it',
          high: 'Could rebuild it from the writeup alone',
          required: true,
        },
        {
          id: 're_simplicity',
          kind: 'scale',
          label: 'Is the complexity justified by score or insight?',
          low: 'Complicated without visible payoff',
          high: 'As simple as it can be for what it achieves',
          required: true,
        },
      ],
    },
    {
      title: 'Part two: does the pair beat either model alone?',
      intro: 'The author was asked to compare Qwen solo, GPT-OSS solo and the collaboration, report per-problem results, account for confounders, and show transcripts as evidence.',
      questions: [
        {
          id: 're_conditions',
          kind: 'scale',
          label: 'Are the solo and collaboration conditions compared fairly?',
          help: 'Matched budgets, the same problems, per-problem results, repeated runs where noise matters.',
          low: 'Conditions differ in ways that decide the result',
          high: 'A fair, budget-matched comparison',
          required: true,
        },
        {
          id: 're_evidence',
          kind: 'scale',
          label: 'Are the claims backed by transcripts and per-problem data rather than asserted?',
          low: 'Asserted',
          high: 'Every claim points at evidence',
          required: true,
        },
        {
          id: 're_insight',
          kind: 'scale',
          label: 'Did you learn where collaboration helps and what each model contributes?',
          low: 'Nothing beyond the headline number',
          high: 'A clear picture of who does what and where it breaks',
          required: true,
        },
        {
          id: 're_honesty',
          kind: 'scale',
          label: 'Are limitations, confounders and null results reported candidly?',
          low: 'Headline first, caveats missing',
          high: 'Candid, including what did not work',
          required: true,
        },
        {
          id: 're_p2_note',
          kind: 'text',
          label: 'What is the main empirical finding, and do you believe it? Note any confounder the author missed.',
          rows: 4,
          required: true,
        },
      ],
    },
    {
      title: 'Communication',
      questions: [
        {
          id: 're_clarity',
          kind: 'scale',
          label: 'Is the writeup clear? Could you follow the design, the results and the reasoning without the code?',
          low: 'Hard to follow',
          high: 'Clear and precise throughout',
          required: true,
        },
      ],
    },
    overall('Would you want this person building the framework you rely on?'),
    aboutYourReview,
  ],
};

export function allQuestions(track: Track): Question[] {
  return questionnaire[track].flatMap((s) => s.questions);
}

export function missingRequired(track: Track, answers: Record<string, unknown>): string[] {
  return allQuestions(track)
    .filter((q) => q.required)
    .filter((q) => {
      const v = answers[q.id];
      return v === undefined || v === null || v === '' || (typeof v === 'string' && v.trim() === '');
    })
    .map((q) => q.id);
}
