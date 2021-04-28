import { createReducer } from '@reduxjs/toolkit'
import { replaceSponsorState, setRecipient, typeInput } from './actions'

export interface SponsorState {
  readonly typedValue: string
  // the typed recipient address or ENS name, or null if sponsor should go to sender
  readonly recipient: string | null
}

const initialState: SponsorState = {
  typedValue: '',
  recipient: null
}

export default createReducer<SponsorState>(initialState, builder =>
  builder
    .addCase(
      replaceSponsorState,
      (state, { payload: { typedValue, recipient} }) => {
        return {
          typedValue,
          recipient
        }
      }
    )
    .addCase(typeInput, (state, { payload: {typedValue } }) => {
      return {
        ...state,
        typedValue
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
