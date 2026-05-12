'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useState } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/shared/lib/routes';

import { acceptStructure, generateStructure } from '../api/onboarding';
import { useOnboardingPoll } from '../hooks/use-onboarding-poll';
import { isNeedsMoreInfo } from '../model/types';

import { OnboardingInputStep } from './onboarding-input-step';
import { OnboardingPreviewStep } from './onboarding-preview-step';
import { OnboardingProcessingStep } from './onboarding-processing-step';

import type {
  EditableGoal,
  EditableTeamMember,
  InputState,
  NeedsInfoData,
  OnboardingDraftResponse,
  PreviewData,
} from '../model/types';

// ─── Reducer ────────────────────────────────────────────────────────────────

type WizardStep =
  | { step: 'input'; inputState: InputState }
  | { step: 'processing'; inputState: InputState }
  | { step: 'preview'; inputState: InputState; previewData: PreviewData }
  | {
      step: 'needs_info';
      inputState: InputState;
      needsInfoData: NeedsInfoData;
    }
  | { step: 'error'; inputState: InputState; message: string }
  | { step: 'timeout'; inputState: InputState };

type WizardAction =
  | { type: 'SET_UPLOAD_TOKEN'; token: string }
  | { type: 'SET_DESCRIPTION'; value: string }
  | { type: 'LINK_ADD' }
  | { type: 'LINK_CHANGE'; index: number; value: string }
  | { type: 'LINK_REMOVE'; index: number }
  | {
      type: 'ATTACHMENT_UPLOADED';
      attachment: InputState['attachments'][number];
    }
  | { type: 'ATTACHMENT_DELETED'; id: number }
  | { type: 'GENERATE_STARTED' }
  | { type: 'POLL_RESULT'; draft: OnboardingDraftResponse }
  | { type: 'POLL_TIMEOUT' }
  | { type: 'BACK_TO_INPUT' }
  | { type: 'ORG_DESC_CHANGE'; value: string }
  | { type: 'GOAL_UPDATE'; index: number; goal: EditableGoal }
  | { type: 'GOAL_REMOVE'; index: number }
  | { type: 'MEMBER_UPDATE'; id: string; member: EditableTeamMember }
  | { type: 'MEMBER_REMOVE'; id: string }
  | { type: 'MEMBER_ADD' };

function emptyInput(): InputState {
  return { description: '', uploadToken: null, links: [], attachments: [] };
}

function reducer(state: WizardStep, action: WizardAction): WizardStep {
  const inputState = 'inputState' in state ? state.inputState : emptyInput();

  switch (action.type) {
    case 'SET_UPLOAD_TOKEN': {
      return {
        ...state,
        inputState: { ...inputState, uploadToken: action.token },
      } as WizardStep;
    }

    case 'SET_DESCRIPTION': {
      return {
        ...state,
        inputState: { ...inputState, description: action.value },
      } as WizardStep;
    }

    case 'LINK_ADD': {
      return {
        ...state,
        inputState: {
          ...inputState,
          links: [...inputState.links, ''],
        },
      } as WizardStep;
    }

    case 'LINK_CHANGE': {
      const links = inputState.links.map((l, i) => {
        return i === action.index ? action.value : l;
      });

      return { ...state, inputState: { ...inputState, links } } as WizardStep;
    }

    case 'LINK_REMOVE': {
      const links = inputState.links.filter((_, i) => {
        return i !== action.index;
      });

      return { ...state, inputState: { ...inputState, links } } as WizardStep;
    }

    case 'ATTACHMENT_UPLOADED': {
      return {
        ...state,
        inputState: {
          ...inputState,
          attachments: [...inputState.attachments, action.attachment],
        },
      } as WizardStep;
    }

    case 'ATTACHMENT_DELETED': {
      return {
        ...state,
        inputState: {
          ...inputState,
          attachments: inputState.attachments.filter((a) => {
            return a.id !== action.id;
          }),
        },
      } as WizardStep;
    }

    case 'GENERATE_STARTED': {
      return { step: 'processing', inputState };
    }

    case 'POLL_RESULT': {
      const draft = action.draft;

      if (draft.status === 'pending' || draft.status === 'processing') {
        return state;
      }

      if (draft.status === 'failed' || !draft.result) {
        return {
          step: 'error',
          inputState,
          message: draft.error ?? 'Generation failed. Please try again.',
        };
      }

      const result = draft.result;

      if (isNeedsMoreInfo(result)) {
        return {
          step: 'needs_info',
          inputState,
          needsInfoData: {
            message: result.message,
            questions: result.questions,
          },
        };
      }

      const team: EditableTeamMember[] = result.team.map((m) => {
        return {
          _id: crypto.randomUUID(),
          name: m.name,
          email: m.email,
          role: m.role,
          found_in: m.found_in,
          already_in_system: m.already_in_system,
          system_user_id: m.system_user_id,
        };
      });

      return {
        step: 'preview',
        inputState,
        previewData: {
          organization: result.organization,
          goals: result.goals,
          team,
        },
      };
    }

    case 'POLL_TIMEOUT': {
      return { step: 'timeout', inputState };
    }

    case 'BACK_TO_INPUT': {
      return { step: 'input', inputState };
    }

    case 'ORG_DESC_CHANGE': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          organization: {
            ...state.previewData.organization,
            description: action.value,
          },
        },
      };
    }

    case 'GOAL_UPDATE': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          goals: state.previewData.goals.map((g, i) => {
            return i === action.index ? action.goal : g;
          }),
        },
      };
    }

    case 'GOAL_REMOVE': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          goals: state.previewData.goals.filter((_, i) => {
            return i !== action.index;
          }),
        },
      };
    }

    case 'MEMBER_UPDATE': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          team: state.previewData.team.map((m) => {
            return m._id === action.id ? action.member : m;
          }),
        },
      };
    }

    case 'MEMBER_REMOVE': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          team: state.previewData.team.filter((m) => {
            return m._id !== action.id;
          }),
        },
      };
    }

    case 'MEMBER_ADD': {
      if (state.step !== 'preview') return state;
      return {
        ...state,
        previewData: {
          ...state.previewData,
          team: [
            ...state.previewData.team,
            {
              _id: crypto.randomUUID(),
              name: '',
              email: null,
              role: null,
              found_in: [],
              already_in_system: false,
              system_user_id: null,
            },
          ],
        },
      };
    }

    default: {
      return state;
    }
  }
}

function buildInitialState(
  initialDraft: OnboardingDraftResponse | null,
): WizardStep {
  if (
    initialDraft?.status === 'pending' ||
    initialDraft?.status === 'processing'
  ) {
    return { step: 'processing', inputState: emptyInput() };
  }

  if (
    initialDraft?.status === 'completed' &&
    initialDraft.result &&
    !isNeedsMoreInfo(initialDraft.result)
  ) {
    const result = initialDraft.result;
    const team: EditableTeamMember[] = result.team.map((m) => {
      return {
        _id: crypto.randomUUID(),
        name: m.name,
        email: m.email,
        role: m.role,
        found_in: m.found_in,
        already_in_system: m.already_in_system,
        system_user_id: m.system_user_id,
      };
    });

    return {
      step: 'preview',
      inputState: emptyInput(),
      previewData: {
        organization: result.organization,
        goals: result.goals,
        team,
      },
    };
  }

  return { step: 'input', inputState: emptyInput() };
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  orgId: number;
  orgName: string;
  initialDraft: OnboardingDraftResponse | null;
}

export function OnboardingWizard({ orgId, orgName, initialDraft }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    reducer,
    initialDraft,
    buildInitialState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFilePending, setHasFilePending] = useState(false);

  const isPolling = state.step === 'processing';
  const inputState = 'inputState' in state ? state.inputState : emptyInput();

  // Generate upload token client-side to avoid SSR/hydration mismatch
  useEffect(() => {
    if (!inputState.uploadToken) {
      dispatch({ type: 'SET_UPLOAD_TOKEN', token: crypto.randomUUID() });
    }
  }, []);

  useOnboardingPoll(
    orgId,
    isPolling,
    (draft) => {
      return dispatch({ type: 'POLL_RESULT', draft });
    },
    () => {
      return dispatch({ type: 'POLL_TIMEOUT' });
    },
  );

  async function handleGenerate() {
    if (isSubmitting || hasFilePending) return;

    const payload = {
      description: inputState.description.trim(),
      ...(inputState.uploadToken &&
        inputState.attachments.length > 0 && {
          upload_token: inputState.uploadToken,
        }),
      ...(inputState.links.some(Boolean) && {
        links: inputState.links.filter(Boolean),
      }),
    };

    setIsSubmitting(true);
    dispatch({ type: 'GENERATE_STARTED' });

    const result = await generateStructure(orgId, payload);

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      dispatch({ type: 'BACK_TO_INPUT' });
    }
  }

  async function handleAccept() {
    if (state.step !== 'preview' || isSubmitting) return;

    const { previewData } = state;

    // Strip internal fields before sending to backend
    const teamPayload = previewData.team
      .filter((m) => {
        return m.name.trim();
      })
      .map(({ name, email, role }) => {
        return {
          name: name.trim(),
          ...(email ? { email } : {}),
          ...(role ? { role } : {}),
        };
      });

    const payload = {
      organization: {
        name: orgName,
        description: previewData.organization.description,
      },
      goals: previewData.goals.map((g) => {
        return {
          title: g.title,
          description: g.description,
          tasks: g.tasks.map((t) => {
            return {
              title: t.title,
              description: t.description,
              type: t.type,
              priority: t.priority,
            };
          }),
        };
      }),
      team: teamPayload,
    };

    setIsSubmitting(true);
    const result = await acceptStructure(orgId, payload);

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success('Organization setup complete!');
    router.push(ROUTES.DASHBOARD.TODAY);
  }

  function handleSkip() {
    router.push(ROUTES.DASHBOARD.TODAY);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.step === 'processing') {
    return <OnboardingProcessingStep />;
  }

  if (state.step === 'timeout') {
    return (
      <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
        <p className='text-xl font-semibold text-foreground'>
          Generation is taking longer than expected
        </p>
        <p className='text-sm text-muted-foreground max-w-sm'>
          The AI is still working. You can wait or come back later — your draft
          will be saved automatically.
        </p>
        <div className='flex gap-3'>
          <button
            type='button'
            className='text-sm text-primary hover:underline'
            onClick={() => {
              return dispatch({ type: 'GENERATE_STARTED' });
            }}
          >
            Keep waiting
          </button>
          <button
            type='button'
            className='text-sm text-muted-foreground hover:underline'
            onClick={handleSkip}
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (state.step === 'error') {
    return (
      <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
        <p className='text-xl font-semibold text-foreground'>
          Something went wrong
        </p>
        <p className='text-sm text-muted-foreground max-w-sm'>
          {state.message}
        </p>
        <div className='flex gap-3'>
          <button
            type='button'
            className='text-sm text-primary hover:underline'
            onClick={() => {
              return dispatch({ type: 'BACK_TO_INPUT' });
            }}
          >
            Try again
          </button>
          <button
            type='button'
            className='text-sm text-muted-foreground hover:underline'
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (state.step === 'preview') {
    return (
      <OnboardingPreviewStep
        data={state.previewData}
        isSubmitting={isSubmitting}
        onOrgDescriptionChange={(value) => {
          return dispatch({ type: 'ORG_DESC_CHANGE', value });
        }}
        onGoalUpdate={(index, goal) => {
          return dispatch({ type: 'GOAL_UPDATE', index, goal });
        }}
        onGoalRemove={(index) => {
          return dispatch({ type: 'GOAL_REMOVE', index });
        }}
        onMemberUpdate={(id, member) => {
          return dispatch({ type: 'MEMBER_UPDATE', id, member });
        }}
        onMemberRemove={(id) => {
          return dispatch({ type: 'MEMBER_REMOVE', id });
        }}
        onMemberAdd={() => {
          return dispatch({ type: 'MEMBER_ADD' });
        }}
        onAccept={handleAccept}
        onBack={() => {
          return dispatch({ type: 'BACK_TO_INPUT' });
        }}
      />
    );
  }

  // input | needs_info
  const needsInfoData =
    state.step === 'needs_info' ? state.needsInfoData : undefined;

  return (
    <OnboardingInputStep
      state={inputState}
      needsInfoData={needsInfoData}
      isSubmitting={isSubmitting}
      hasFilePending={hasFilePending}
      onDescriptionChange={(value) => {
        return dispatch({ type: 'SET_DESCRIPTION', value });
      }}
      onLinkAdd={() => {
        return dispatch({ type: 'LINK_ADD' });
      }}
      onLinkChange={(index, value) => {
        return dispatch({ type: 'LINK_CHANGE', index, value });
      }}
      onLinkRemove={(index) => {
        return dispatch({ type: 'LINK_REMOVE', index });
      }}
      onUploaded={(attachment) => {
        return dispatch({ type: 'ATTACHMENT_UPLOADED', attachment });
      }}
      onDeleted={(id) => {
        return dispatch({ type: 'ATTACHMENT_DELETED', id });
      }}
      onPendingChange={setHasFilePending}
      onSubmit={handleGenerate}
      onSkip={handleSkip}
    />
  );
}
