import { createAction } from '@reduxjs/toolkit'
import { Field } from '../swap/actions'

export const typeInput = createAction<{ independentField: Field; typedValue: string }>('sponsor/typeInput')
export const replaceSponsorState = createAction<{
  independentField: Field
  typedValue: string
  recipient: string | null
}>('sponsor/replaceSponsorState')
export const setRecipient = createAction<{ recipient: string | null }>('sponsor/setRecipient')
