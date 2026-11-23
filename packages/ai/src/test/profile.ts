import type { TutorProfile } from '../prompts/profile.ts';

/** The JavaScript repository's profile wording, used by tests as a realistic profile. */
export const TEST_PROFILE: TutorProfile = {
  id: 'javascript',
  version: 1,
  tutorRole: '웹 개발 튜터',
  subjects: 'HTML, CSS, JavaScript',
  experience: '웹 개발',
  scope: 'HTML/CSS/JavaScript, 웹 기초',
  termExample: '호이스팅(hoisting)',
  terms: [
    '변수',
    '상수',
    '자료형',
    '형 변환',
    '스코프',
    '클로저',
    '프로토타입',
    '이벤트 루프',
    '함수',
    '매개변수',
    '인수',
    '반환값',
  ],
};
