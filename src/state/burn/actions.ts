import { createAction } from '@reduxjs/toolkit'

export enum Field {
  PAIR_AB = 'PAIR_AB',
  PAIR_BA = 'PAIR_BA',  
}

export enum Amount {
  PERCENTAGE = 'PERCENTAGE',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B'
}

export const typeInput = createAction<{ field: Field; percentage: number }>('burn/typeInputBurn')
