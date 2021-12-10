import { createReducer } from '@reduxjs/toolkit'
import { BigNumber } from '@ethersproject/bignumber'
import { Fraction } from '@feswap/sdk'
import { replaceNftState, setNftRecipient, typeNftInput, typeTriggerRate, selectNftCurrency } from './actions'
import { Field } from './actions'

export interface PairBidInfo {
  readonly tokenA: string
  readonly tokenB: string
  readonly currentPrice: BigNumber
  readonly timeCreated: BigNumber
  readonly lastBidTime: BigNumber
  readonly poolState: number 
}

export interface FeswaPairInfo {
  readonly tokenIDPairNft:  BigNumber
  readonly ownerPairNft:    string
  readonly pairBidInfo:     PairBidInfo 
}

export interface FeswaNftConfig {
  readonly feswGiveRate:          Fraction
  readonly AirdropFirstBidder:    Fraction
  readonly AirdropRateForWinner:  Fraction 
  readonly MinPriceIncrease:      Fraction
  readonly SaleStartTime:         BigNumber
}

export interface NftState {
  readonly typedValue: string
  readonly rateTrigger: number
  readonly [Field.TOKEN_A]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.TOKEN_B]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

const initialState: NftState = {
  typedValue: '',
  rateTrigger: 0,
  [Field.TOKEN_A]: {
    currencyId: ''
  },
  [Field.TOKEN_B]: {
    currencyId: ''
  },
  recipient: null
}


export default createReducer<NftState>(initialState, builder =>
  builder
    .addCase(replaceNftState, (state, { payload: { typedValue, rateTrigger, recipient, inputCurrencyId, outputCurrencyId } }) => {
      return {
        [Field.TOKEN_A]: {
          currencyId: inputCurrencyId
        },
        [Field.TOKEN_B]: {
          currencyId: outputCurrencyId
        },
        typedValue: typedValue,
        rateTrigger: rateTrigger,
        recipient
      }
    })
    .addCase(selectNftCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.TOKEN_A ? Field.TOKEN_B : Field.TOKEN_A
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId }
        }
      }
    })
    .addCase(typeNftInput, (state, { payload: {typedValue } }) => {
      return {
        ...state,
        typedValue
      }
    })
    .addCase(typeTriggerRate, (state, { payload: {rateTrigger } }) => {
      return {
        ...state,
        rateTrigger
      }
    })
    .addCase(setNftRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)