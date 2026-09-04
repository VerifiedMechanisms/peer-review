// The peer-review questionnaire, shared by both tracks. It started from the
// NeurIPS 2025 reviewer form (neurips.cc/Conferences/2025/ReviewerGuidelines)
// and was cut down and reworded for a take-home submission. Edit freely: the form
// renders from this file and the export uses the question ids as column
// names, so keep ids stable once reviews have been submitted.

export type Question =
  | { id: string; kind: 'scale'; label: string; help?: string; low: string; high: string; required?: boolean }
  | { id: string; kind: 'choice'; label: string; help?: string; options: string[]; layout?: 'row' | 'column'; required?: boolean }
  | { id: string; kind: 'text'; label: string; help?: string; rows?: number; required?: boolean }
  | { id: string; kind: 'number'; label: string; help?: string; min?: number; max?: number; required?: boolean };

export type Section = { title: string; intro?: string; questions: Question[] };

export type Track = 'RS' | 'RE';

const fourPoint = ['4: excellent', '3: good', '2: fair', '1: poor'];

const base: Section[] = [
  {
    title: '',
    questions: [
      {
        id: 'summary',
        kind: 'text',
        label: 'Summary',
        help: 'Briefly summarize the submission and its contributions. Note that this is not the place to critique the submission.',
        rows: 6,
        required: true,
      },
      {
        id: 'strengths',
        kind: 'text',
        label: 'Strengths',
        help: 'Please provide a thorough assessment of the submission’s strengths in Part 1 and 2 separately.',
        rows: 6,
        required: true,
      },
      {
        id: 'weaknesses',
        kind: 'text',
        label: 'Weaknesses',
        help: 'Please provide a thorough assessment of the submission’s weaknesses in Part 1 and 2 separately.',
        rows: 6,
        required: true,
      },
      {
        id: 'quality',
        kind: 'choice',
        label: 'Quality',
        help: 'Is the submission technically sound? Are claims well supported (e.g., by theoretical analysis or experimental results)?',
        options: fourPoint,
        required: true,
      },
      {
        id: 'clarity',
        kind: 'choice',
        label: 'Clarity',
        help: 'Is the submission clearly written? Is it well organized? Does it adequately inform the reader?',
        options: fourPoint,
        required: true,
      },
      {
        id: 'originality',
        kind: 'choice',
        label: 'Originality',
        help: 'Does the work provide new insights or deepen understanding?',
        options: fourPoint,
        required: true,
      },
      {
        id: 'overall_score',
        kind: 'choice',
        layout: 'column',
        label: 'Overall score',
        options: [
          'Excellent: Fully answers the task with strong evidence and clear writing.',
          'Good: Answers the task, with minor gaps in evidence or clarity.',
          'Satisfactory: Addresses the task, but evidence or writing falls short.',
        ],
        required: true,
      },
      {
        id: 'anything_else',
        kind: 'text',
        label: 'Anything else you would like us to know?',
        rows: 4,
      },
    ],
  },
];

// Each track asks, under Strengths, for a ranking of its own three areas.
function withHelp(sections: Section[], id: string, help: string): Section[] {
  return sections.map((s) => ({
    ...s,
    questions: s.questions.map((q) => (q.id === id ? { ...q, help } : q)),
  }));
}

export const questionnaire: Record<Track, Section[]> = {
  RS: withHelp(
    base,
    'strengths',
    'Please provide a thorough assessment of the submission’s strengths in Part 1 and 2 separately. In addition, rank the following areas from strongest to weakest and briefly justify the ranking: mechanistic interpretability, mathematics, and technical writing.',
  ),
  RE: withHelp(
    base,
    'strengths',
    'Please provide a thorough assessment of the submission’s strengths in Part 1 and 2 separately. In addition, rank the following areas from strongest to weakest and briefly justify the ranking: multi-agent scaffolding, behavioural science, and technical writing.',
  ),
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
