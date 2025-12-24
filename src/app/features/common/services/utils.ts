import { AbstractControl, FormArray, FormControl, FormGroup } from "@angular/forms";

export type Dictionary<K extends string | number | symbol, V> = {
    [key in K]: V;
};

export type UndefinedOrNull<T> = T | null | undefined;

function hasAny (actual: string[], expected: string[]): boolean {
    const has = expected.some(e => actual.some(a => e.toLowerCase() == a.toLowerCase()));
    return has;
}

function hasAll (actual: string[], expected: string[]): boolean {
    const has = expected.every(e => actual.some(a => e.toLowerCase() == a.toLowerCase()));
    return has;
}

function moveArrayItem<T>(arr: T[], oldIndex: number, newIndex: number): T[] {
    arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
    return arr;
};

function createGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function groupBy<T, K extends keyof any>(arr: T[], key: (i: T) => K) {
  return arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

function isNumber(value: string | number): boolean {
   return ((value != null) &&
           (value !== '') &&
           !isNaN(Number(value.toString())));
}

/**
 * Parse date as utc and returns in local time.
 * @param datetime YYYY-MM-DD hh-mm-ss.
 * @returns Local Date Time.
 */
function paraseDateTimeAsUTC(dateTime: string): Date {
  return new Date(Date.parse(dateTime) - new Date().getTimezoneOffset() * 60000);
}

/**
 * Convert local date to utc and apply format.
 * @param dateTime Date time in local.
 * @returns YYYY-MM-DD hh-mm-ss.
 */
function toUTCDateTimeString(dateTime: Date): string {
  const utc = new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000);

  const year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(utc);
  const month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(utc);
  const day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(utc);
  const hours = new Intl.DateTimeFormat('en', { hour: '2-digit', hour12: false }).format(utc);
  const minutes = new Intl.DateTimeFormat('en', { minute: '2-digit', hour12: false }).format(utc);
  const seconds = new Intl.DateTimeFormat('en', { second: '2-digit', hour12: false }).format(utc);

  const formatted = `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;

  return formatted;
}

function getRem(): number {
  // Get the computed font-size of the body element
  // const bodyFontSize = window.getComputedStyle(document.body).getPropertyValue('font-size');

  // Convert the font-size to a number (remove "px" at the end)
  // const bodyFontSizeNum = parseFloat(bodyFontSize);

  // Get the root font-size (default is usually 16px)
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

  // Calculate the rem value
  // const remValue = bodyFontSizeNum / rootFontSize;
  const remValue = rootFontSize / 16.0;

  return remValue;
}

function toRem(value: number): string {
  const remValue = (value / 16) + 'rem'; 
  return remValue;
}

function isEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.00001;
}

function unique<T>(arr: T[]): T[] {
  return arr.filter((name, index) => arr.indexOf(name) === index);
}

function booleanOrDefault(value: UndefinedOrNull<boolean>, defaultValue: boolean): boolean {
  return value ?? defaultValue;
}

function findInvalidControls(formGroup: any, path: string[] = []): string[] {
  const invalidPaths: string[] = [];

  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);
    const currentPath = [...path, key];

    if (control instanceof FormGroup) {
      invalidPaths.push(...findInvalidControls(control, currentPath));
    } else if (control instanceof FormArray) {
      control.controls.forEach((ctrl, index) => {
        if (ctrl instanceof FormGroup || ctrl instanceof FormArray) {
          invalidPaths.push(...findInvalidControls(ctrl, [...currentPath, String(index)]));
        } else if (ctrl.invalid) {
          invalidPaths.push([...currentPath, String(index)].join('.'));
        }
      });
    } else if (control && control.invalid) {
      invalidPaths.push(currentPath.join('.'));
    }
  });

  return invalidPaths;
}

function removeFormControlError(control: AbstractControl, errorKey: string) {
  if (control?.hasError(errorKey)) {
    const errors = { ...control.errors };
    delete errors[errorKey];

    control.setErrors(Object.keys(errors).length ? errors : null);
    control.updateValueAndValidity();
  }
}

export { hasAny, hasAll, moveArrayItem, createGUID, groupBy, isNumber, getRem, toRem, isEqual, unique, booleanOrDefault, findInvalidControls, removeFormControlError }