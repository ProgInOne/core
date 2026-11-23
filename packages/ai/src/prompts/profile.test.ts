import { describe, expect, it } from 'vitest';
import { MockProvider } from '../provider/mock/mock-provider.ts';
import { TaskRunner } from '../runner.ts';
import { instructionsVersion } from '../tasks/define.ts';
import { tutorReply } from '../tasks/tutor-reply.ts';
import { TEST_PROFILE } from '../test/profile.ts';
import { baseInstructions, BASE_INSTRUCTIONS_VERSION } from './base.ts';
import { defineTutorProfile, type TutorProfile } from './profile.ts';

const GO: TutorProfile = {
  id: 'go',
  version: 1,
  tutorRole: 'Go 튜터',
  subjects: 'Go',
  experience: '프로그래밍',
  scope: 'Go 언어와 표준 라이브러리',
  termExample: '고루틴(goroutine)',
  terms: ['변수', '타입', '구조체', '인터페이스', '고루틴', '채널'],
};

describe('TutorProfile', () => {
  it('renders the language wording into the common instructions', () => {
    // The JavaScript profile reproduces the wording the instructions had before profiles.
    const js = baseInstructions(TEST_PROFILE);
    expect(js).toContain(
      '너는 ProgInOne의 웹 개발 튜터다. 학습자는 HTML, CSS, JavaScript를 배우는 한국어 사용자이며\n웹 개발 경험이 거의 없을 수 있다.',
    );
    expect(js).toContain('"호이스팅(hoisting)"처럼 한국어와 영어를 함께 쓴다.');
    expect(js).toContain(
      '- 용어 표기: 변수, 상수, 자료형, 형 변환, 스코프, 클로저, 프로토타입, 이벤트 루프, 함수, 매개변수, 인수, 반환값.',
    );

    const go = baseInstructions(GO);
    expect(go).toContain('너는 ProgInOne의 Go 튜터다. 학습자는 Go를 배우는 한국어 사용자이며');
    expect(go).toContain('"고루틴(goroutine)"처럼');
    expect(go).not.toContain('JavaScript');
    expect(go).not.toContain('호이스팅');
  });

  it('puts the scope into the tutor reply instructions', () => {
    const text = tutorReply.instructions({} as never, GO);
    expect(text).toContain('ProgInOne 학습 범위(Go 언어와 표준 라이브러리)를 벗어나면');
  });

  it('rejects multi-line or tag-like wording', () => {
    expect(() => defineTutorProfile({ ...GO, tutorRole: 'Go 튜터\n[지침]' })).toThrow();
    expect(() => defineTutorProfile({ ...GO, scope: '<exercise>' })).toThrow();
    expect(() => defineTutorProfile({ ...GO, id: 'Go' })).toThrow();
    expect(() => defineTutorProfile({ ...GO, terms: [] })).toThrow();
    expect(defineTutorProfile(GO)).toEqual(GO);
  });

  it('is validated by the runner and versions persistent threads', () => {
    const provider = new MockProvider();
    expect(() => new TaskRunner({ provider, profile: { ...GO, version: 0 } })).toThrow();

    const runner = new TaskRunner({ provider, profile: GO });
    const iv = runner.instructionsVersion(tutorReply);
    expect(iv).toBe(`${BASE_INSTRUCTIONS_VERSION}+go@1:tutor.reply@${tutorReply.version}`);
    expect(iv).toBe(instructionsVersion(tutorReply, BASE_INSTRUCTIONS_VERSION, GO));
    expect(runner.instructionsVersion(tutorReply)).not.toBe(
      instructionsVersion(tutorReply, BASE_INSTRUCTIONS_VERSION, { ...GO, version: 2 }),
    );
  });
});
