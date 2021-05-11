import { createReducer } from '@reduxjs/toolkit'
import { replaceSponsorState, setSponsorRecipient, typeSponsorInput } from './actions'
import { Field } from '../swap/actions'

export interface SponsorState {
  readonly independentField: Field
  readonly typedValue: string
  // the typed recipient address or ENS name, or null if sponsor should go to sender
  readonly recipient: string | null
}

const initialState: SponsorState = {
  independentField: Field.INPUT,
  typedValue: '',
  recipient: null
}

export default createReducer<SponsorState>(initialState, builder =>
  builder
    .addCase(
      replaceSponsorState,
      (state, { payload: { typedValue, recipient, independentField} }) => {
        return {
          independentField,
          typedValue,
          recipient
        }
      }
    )
    .addCase(typeSponsorInput, (state, { payload: {independentField, typedValue } }) => {
      return {
        ...state,
        independentField,
        typedValue
      }
    })
    .addCase(setSponsorRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)