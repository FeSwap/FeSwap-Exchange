import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT'
}

export const typeInput = createAction<{ typedValue: string }>('sponsor/typeInput')
export const replaceSponsorState = createAction<{
  typedValue: string
  recipient: string | null
}>('sponsor/replaceSponsorState')
export const setRecipient = createAction<{ recipient: string | null }>('sponsor/setRecipient')
