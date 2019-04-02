/* eslint-disable import/prefer-default-export */

export function isValidMemberName(name: string): boolean {
  return /^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$/.test(name);
}
