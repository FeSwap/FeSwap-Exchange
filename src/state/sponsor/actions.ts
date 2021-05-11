import { createAction } from '@reduxjs/toolkit'
import { Field } from '../swap/actions'

export const typeSponsorInput = createAction<{ independentField: Field; typedValue: string }>('sponsor/typeSponsorInput')
export const replaceSponsorState = createAction<{
  independentField: Field
  typedValue: string
  recipient: string | null
}>('sponsor/replaceSponsorState')
export const setSponsorRecipient = createAction<{ recipient: string | null }>('sponsor/setSponsorRecipient')
