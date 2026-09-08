import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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
