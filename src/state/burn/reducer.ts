import { createReducer } from '@reduxjs/toolkit'
import { Field, typeInput } from './actions'

export interface BurnState {
  readonly Percentage_AB: number,
  readonly Percentage_BA: number
}

const initialState: BurnState = {
  Percentage_AB: 0,
  Percentage_BA: 0
}

export default createReducer<BurnState>(initialState, builder =>
  builder.addCase(typeInput, (state, { payload: { field, percentage } }) => {
    if (field === Field.PAIR_AB) 
      return {
        ...state,
        Percentage_AB: percentage
      } 
    else 
      return {
        ...state,
        Percentage_BA: percentage
      }
  })
)
