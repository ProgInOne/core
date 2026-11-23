import {
  COMMON_EXERCISE_TYPES,
  createExerciseRegistry,
  type McqSingleAnswer,
  type McqSinglePublicSpec,
} from '@proginone/exercise-core';
import { screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { axeViolations, renderUi } from '../test/helpers.tsx';
import {
  choiceInitialAnswer,
  choiceNotReadyReason,
  isChoiceAnswerReady,
  parseChoicePublicSpec,
} from './choice.tsx';
import { McqSingle } from './McqSingle.tsx';

const { redactSpec } = createExerciseRegistry({ types: COMMON_EXERCISE_TYPES });

const mcqSpec: McqSinglePublicSpec = {
  options: [
    { id: 'a', text: '`8`' },
    { id: 'b', text: '`undefined`' },
    { id: 'c', text: '`null`' },
    { id: 'd', text: '오류가 발생한다' },
  ],
  codeOptions: false,
};

function Mcq({ correctOptionId }: { correctOptionId?: string }) {
  const [value, setValue] = useState<McqSingleAnswer | null>(null);
  return (
    <>
      <h2 id="prompt">result에 들어 있는 값은?</h2>
      <McqSingle
        spec={mcqSpec}
        value={value}
        onChange={setValue}
        labelledBy="prompt"
        {...(correctOptionId === undefined ? {} : { correctOptionId })}
      />
      <output data-testid="value">{value?.optionId ?? ''}</output>
    </>
  );
}

describe('McqSingle', () => {
  it('is a labelled radio group with arrow-key and number-key selection', async () => {
    const { user, container } = renderUi(<Mcq />);
    const group = screen.getByRole('radiogroup', { name: 'result에 들어 있는 값은?' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.closest('label')?.textContent)).toEqual([
      '18',
      '2undefined',
      '3null',
      '4오류가 발생한다',
    ]);

    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByTestId('value').textContent).toBe('a');
    await user.keyboard('{ArrowDown}');
    expect(screen.getByTestId('value').textContent).toBe('b');
    await user.keyboard('4');
    expect(screen.getByTestId('value').textContent).toBe('d');
    expect(document.activeElement).toBe(radios[3]);
    await user.keyboard('9');
    expect(screen.getByTestId('value').textContent).toBe('d');
    expect(await axeViolations(container)).toEqual([]);
  });

  it('marks the correct option and the learner choice after grading', () => {
    renderUi(
      <McqSingle
        spec={mcqSpec}
        value={{ optionId: 'c' }}
        onChange={() => undefined}
        correctOptionId="b"
        disabled
      />,
    );
    expect(
      screen.getByRole('radio', { name: /undefined/ }).closest('label')?.textContent,
    ).toContain('정답');
    expect(screen.getByRole('radio', { name: /null/ }).closest('label')?.textContent).toContain(
      '내가 고른 답',
    );
    expect(screen.getByRole('radio', { name: /8/ }).closest('label')?.dataset['state']).toBe(
      undefined,
    );
  });

  it('renders code options as code', () => {
    renderUi(
      <McqSingle
        spec={{ ...mcqSpec, codeOptions: true }}
        value={null}
        onChange={() => undefined}
        disabled
      />,
    );
    expect(
      screen.getByRole('radiogroup', { name: '선택지' }).querySelectorAll('code'),
    ).toHaveLength(4);
    expect(screen.getAllByRole('radio').every((r) => (r as HTMLInputElement).disabled)).toBe(true);
  });
});

describe('choice exercise model (mcq_single)', () => {
  it('validates redacted specs and rejects other types or bad input', () => {
    const raw = redactSpec('mcq_single', {
      options: [
        { id: 'a', text: '1' },
        { id: 'b', text: '2' },
        { id: 'c', text: '3' },
      ],
      correct: 'b',
      shuffle: false,
    });
    const exercise = parseChoicePublicSpec('mcq_single', raw);
    expect(exercise?.typeId).toBe('mcq_single');
    expect(JSON.stringify(exercise)).not.toContain('correct');
    expect(parseChoicePublicSpec('mcq_single', { options: 'x' })).toBeNull();
    expect(parseChoicePublicSpec('parsons', raw)).toBeNull();
  });

  it('builds initial answers and readiness', () => {
    const mcq = { typeId: 'mcq_single', spec: mcqSpec } as const;
    expect(choiceInitialAnswer(mcq)).toBeNull();
    expect(isChoiceAnswerReady(mcq, null)).toBe(false);
    expect(isChoiceAnswerReady(mcq, { optionId: 'a' })).toBe(true);
    expect(choiceNotReadyReason(mcq)).toBe('답을 먼저 골라 주세요.');
  });
});
