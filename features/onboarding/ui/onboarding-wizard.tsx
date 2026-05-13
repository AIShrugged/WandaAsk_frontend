'use client';

import { useRouter } from 'next/navigation';
import { useReducer, useState } from 'react';
import { toast } from 'sonner';

import { ROUTES } from '@/shared/lib/routes';

import { acceptStructure, generateStructure } from '../api/onboarding';
import { useOnboardingPoll } from '../hooks/use-onboarding-poll';
import { UserRoleSchema } from '../model/schemas';
import {
  EMPTY_INPUT,
  buildInitialState,
  reducer,
} from '../model/wizard-reducer';

import { OnboardingInputStep } from './onboarding-input-step';
import { OnboardingPreviewStep } from './onboarding-preview-step';
import { OnboardingProcessingStep } from './onboarding-processing-step';

import type { OnboardingDraftResponse } from '../model/types';

// ─── Local helpers ────────────────────────────────────────────────────────────

interface StatusScreenProps {
  title: string;
  message: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction: { label: string; onClick: () => void };
}

function WizardStatusScreen({
  title,
  message,
  primaryAction,
  secondaryAction,
}: StatusScreenProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-6 py-16 text-center'>
      <p className='text-xl font-semibold text-foreground'>{title}</p>
      <p className='text-sm text-muted-foreground max-w-sm'>{message}</p>
      <div className='flex gap-3'>
        <button
          type='button'
          className='text-sm text-primary hover:underline focus-visible:outline-none focus-visible:underline'
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </button>
        <button
          type='button'
          className='text-sm text-muted-foreground hover:underline focus-visible:outline-none focus-visible:underline'
          onClick={secondaryAction.onClick}
        >
          {secondaryAction.label}
        </button>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  orgId: number;
  orgName: string;
  initialDraft: OnboardingDraftResponse | null;
  redirectAfterSkip?: string;
  redirectAfterAccept?: string;
}

export function OnboardingWizard({
  orgId,
  orgName,
  initialDraft,
  redirectAfterSkip,
  redirectAfterAccept,
}: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    reducer,
    initialDraft,
    buildInitialState,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFilePending, setHasFilePending] = useState(false);

  const inputState = 'inputState' in state ? state.inputState : EMPTY_INPUT;

  useOnboardingPoll(
    orgId,
    state.step === 'processing',
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

    const teamPayload = previewData.team
      .filter((m) => {
        return m.name.trim();
      })
      .map(({ name, email, role }) => {
        const parsedRole = UserRoleSchema.safeParse(role);
        return {
          name: name.trim(),
          ...(email ? { email } : {}),
          ...(parsedRole.success ? { role: parsedRole.data } : {}),
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

    toast.success('Organization set up!', {
      description: 'Your goals are ready in the issue tracker.',
      duration: 5000,
    });
    router.push(redirectAfterAccept ?? ROUTES.DASHBOARD.ISSUES_LIST);
  }

  function handleSkip() {
    router.push(redirectAfterSkip ?? ROUTES.DASHBOARD.TODAY);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (state.step === 'processing') {
    return <OnboardingProcessingStep />;
  }

  if (state.step === 'timeout') {
    return (
      <WizardStatusScreen
        title='Generation is taking longer than expected'
        message='The AI is still working. You can wait or come back later — your draft will be saved automatically.'
        primaryAction={{
          label: 'Keep waiting',
          onClick: () => {
            return dispatch({ type: 'GENERATE_STARTED' });
          },
        }}
        secondaryAction={{ label: 'Go to dashboard', onClick: handleSkip }}
      />
    );
  }

  if (state.step === 'error') {
    return (
      <WizardStatusScreen
        title='Something went wrong'
        message={state.message}
        primaryAction={{
          label: 'Try again',
          onClick: () => {
            return dispatch({ type: 'BACK_TO_INPUT' });
          },
        }}
        secondaryAction={{ label: 'Skip for now', onClick: handleSkip }}
      />
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
