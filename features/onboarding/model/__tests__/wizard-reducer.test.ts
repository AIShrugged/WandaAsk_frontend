import { buildInitialState, EMPTY_INPUT } from '../wizard-reducer';

import type { OnboardingDraftResponse } from '../types';

const WRONG_STEP = 'wrong step';

const COMPLETE_RESULT: OnboardingDraftResponse['result'] = {
  organization: { name: 'Acme Corp', description: 'We build things' },
  goals: [
    {
      title: 'Goal 1',
      description: 'First goal',
      tasks: [
        {
          title: 'Task 1',
          description: 'Do it',
          type: 'development',
          priority: 1,
        },
      ],
    },
  ],
  team: [
    {
      name: 'Alice',
      email: 'alice@acme.com',
      role: 'Engineer',
      found_in: ['description'],
      already_in_system: false,
      system_user_id: null,
    },
  ],
};

const NEEDS_INFO_RESULT: OnboardingDraftResponse['result'] = {
  needs_more_info: true,
  message: 'Please provide more details.',
  questions: ['What problem do you solve?', 'Who is your audience?'],
};

function makeDraft(
  overrides: Partial<OnboardingDraftResponse>,
): OnboardingDraftResponse {
  return {
    id: 1,
    status: 'completed',
    error: null,
    result: null,
    ...overrides,
  };
}

describe('buildInitialState', () => {
  describe('null / no draft (fallback)', () => {
    it('returns input step when draft is null', () => {
      const result = buildInitialState(null);
      expect(result.step).toBe('input');
    });

    it('returns input step when draft status is "failed"', () => {
      const result = buildInitialState(makeDraft({ status: 'failed' }));
      expect(result.step).toBe('input');
    });

    it('returns input step when status is "completed" but result is null', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: null }),
      );
      expect(result.step).toBe('input');
    });
  });

  describe('in-flight draft', () => {
    it('returns processing step when status is "pending"', () => {
      const result = buildInitialState(makeDraft({ status: 'pending' }));
      expect(result.step).toBe('processing');
    });

    it('returns processing step when status is "processing"', () => {
      const result = buildInitialState(makeDraft({ status: 'processing' }));
      expect(result.step).toBe('processing');
    });

    it('uses EMPTY_INPUT as inputState for processing step', () => {
      const result = buildInitialState(makeDraft({ status: 'pending' }));
      if (result.step !== 'processing') throw new Error(WRONG_STEP);
      expect(result.inputState.description).toBe('');
      expect(result.inputState.links).toHaveLength(0);
      expect(result.inputState.attachments).toHaveLength(0);
    });
  });

  describe('completed with full result (preview)', () => {
    it('returns preview step when status is "completed" and result is a complete draft', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: COMPLETE_RESULT }),
      );
      expect(result.step).toBe('preview');
    });

    it('maps organization fields into previewData', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: COMPLETE_RESULT }),
      );
      if (result.step !== 'preview') throw new Error(WRONG_STEP);
      expect(result.previewData.organization.name).toBe('Acme Corp');
      expect(result.previewData.organization.description).toBe(
        'We build things',
      );
    });

    it('maps goals into previewData', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: COMPLETE_RESULT }),
      );
      if (result.step !== 'preview') throw new Error(WRONG_STEP);
      expect(result.previewData.goals).toHaveLength(1);
      expect(result.previewData.goals[0].title).toBe('Goal 1');
    });

    it('maps team members with generated _id field', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: COMPLETE_RESULT }),
      );
      if (result.step !== 'preview') throw new Error(WRONG_STEP);
      expect(result.previewData.team).toHaveLength(1);
      expect(typeof result.previewData.team[0]._id).toBe('string');
      expect(result.previewData.team[0]._id.length).toBeGreaterThan(0);
      expect(result.previewData.team[0].name).toBe('Alice');
    });
  });

  describe('completed with needs_more_info result', () => {
    it('returns needs_info step when result has needs_more_info: true', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: NEEDS_INFO_RESULT }),
      );
      expect(result.step).toBe('needs_info');
    });

    it('populates needsInfoData.message from result', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: NEEDS_INFO_RESULT }),
      );
      if (result.step !== 'needs_info') throw new Error(WRONG_STEP);
      expect(result.needsInfoData.message).toBe('Please provide more details.');
    });

    it('populates needsInfoData.questions from result', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: NEEDS_INFO_RESULT }),
      );
      if (result.step !== 'needs_info') throw new Error(WRONG_STEP);
      expect(result.needsInfoData.questions).toEqual([
        'What problem do you solve?',
        'Who is your audience?',
      ]);
    });

    it('uses EMPTY_INPUT as inputState for needs_info step', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: NEEDS_INFO_RESULT }),
      );
      if (result.step !== 'needs_info') throw new Error(WRONG_STEP);
      expect(result.inputState.description).toBe('');
      expect(result.inputState.links).toHaveLength(0);
      expect(result.inputState.attachments).toHaveLength(0);
    });

    it('preserves questions array order', () => {
      const questions = ['Q2', 'Q1', 'Q3'];
      const result = buildInitialState(
        makeDraft({
          status: 'completed',
          result: { needs_more_info: true, message: 'msg', questions },
        }),
      );
      if (result.step !== 'needs_info') throw new Error(WRONG_STEP);
      expect(result.needsInfoData.questions).toEqual(['Q2', 'Q1', 'Q3']);
    });
  });

  describe('edge cases', () => {
    it('returns needs_info when questions array is empty', () => {
      const result = buildInitialState(
        makeDraft({
          status: 'completed',
          result: { needs_more_info: true, message: 'msg', questions: [] },
        }),
      );
      expect(result.step).toBe('needs_info');
    });

    it('returns needs_info when message is an empty string', () => {
      const result = buildInitialState(
        makeDraft({
          status: 'completed',
          result: {
            needs_more_info: true,
            message: '',
            questions: ['Q1'],
          },
        }),
      );
      expect(result.step).toBe('needs_info');
    });

    it('does NOT return preview step when result has needs_more_info: true', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: NEEDS_INFO_RESULT }),
      );
      expect(result.step).not.toBe('preview');
    });

    it('returns preview step when result has no needs_more_info property', () => {
      const result = buildInitialState(
        makeDraft({ status: 'completed', result: COMPLETE_RESULT }),
      );
      expect(result.step).toBe('preview');
    });

    it('inputState uploadToken is a non-empty string', () => {
      expect(typeof EMPTY_INPUT.uploadToken).toBe('string');
      expect((EMPTY_INPUT.uploadToken ?? '').length).toBeGreaterThan(0);
    });
  });
});
