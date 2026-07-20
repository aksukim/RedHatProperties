import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validator to check for disposable/fake email domains
 * This is a lightweight frontend check for immediate UX feedback
 */
export function fakeEmailValidator(): ValidatorFn {
  // Common disposable email domains for immediate frontend UI rejection
  const quickBlocklist = [
    'mailinator.com',
    '10minutemail.com',
    'yopmail.com',
    'guerrillamail.com',
    'tempmail.com',
    'throwaway.email',
    'getnada.com',
    'maildrop.cc',
    'fakeinbox.com',
    'trashmail.com'
  ];

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const domain = value.substring(value.lastIndexOf('@') + 1).toLowerCase();

    if (quickBlocklist.includes(domain)) {
      return { fakeEmail: true };
    }

    return null;
  };
}

/**
 * Validator to check for typo-squatted email domains
 */
export function typoSquatValidator(): ValidatorFn {
  const commonTypos: { [key: string]: string[] } = {
    'gmail.com': ['gmaill.com', 'gmial.com', 'gnail.com', 'gmai.com'],
    'yahoo.com': ['yahooo.com', 'yaho.com', 'yhoo.com'],
    'outlook.com': ['outlok.com', 'outloook.com', 'outlooks.com'],
    'hotmail.com': ['hotmial.com', 'hotmaill.com', 'hotmal.com']
  };

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || !value.includes('@')) {
      return null;
    }

    const domain = value.substring(value.lastIndexOf('@') + 1).toLowerCase();

    for (const [correct, typos] of Object.entries(commonTypos)) {
      if (typos.includes(domain)) {
        return { 
          typoSquat: true,
          suggestedDomain: correct,
          message: `Did you mean @${correct}?`
        };
      }
    }

    return null;
  };
}

/**
 * Validator to check if text appears to be garbage/bot-generated
 */
export function garbageTextValidator(minLetterRatio: number = 0.4): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    // Check letter to total character ratio
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const letterRatio = letterCount / trimmed.length;

    if (letterRatio < minLetterRatio) {
      return { garbageText: true };
    }

    return null;
  };
}

/**
 * Validator to check minimum word count (useful for message fields)
 */
export function minWordCountValidator(minWords: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) {
      return null;
    }

    const words = value.trim().split(/\s+/).filter((word: string) => word.length > 0);

    if (words.length < minWords) {
      return { 
        minWordCount: true,
        actualCount: words.length,
        requiredCount: minWords
      };
    }

    return null;
  };
}
