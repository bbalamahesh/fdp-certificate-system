export const SECURITY_QUESTIONS = [
  'What was your first school name?',
  'What is your mother\'s maiden name?',
  'What is your favorite teacher\'s name?',
  'What city were you born in?',
  'What is your favorite book?',
] as const

export type SecurityQuestion = (typeof SECURITY_QUESTIONS)[number]
