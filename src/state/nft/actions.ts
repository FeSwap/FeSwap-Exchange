import { createAction } from '@reduxjs/toolkit'

//export enum Field {
//  TOKEN_A = 'TOKEN_A',
//  TOKEN_B = 'TOKEN_B'
//}

export enum Field {
  TOKEN_A,
  TOKEN_B
}

export enum WALLET_BALANCE {
  ETH,
  FESW
}

export enum NFT_BID_PHASE {
  BidToStart,
  BidPhase, 
  BidDelaying,
  BidSettled,
  PoolHolding, 
  PoolForSale
}

export enum USER_BUTTON_ID {
  ERR_NO_WALLET,
  ERR_BID_ENDED,
  ERR_INPUT_VALUE,
  ERR_LOW_BALANCE,
  ERR_LOW_PRICE,
  ERR_NO_RECIPIENT,
  OK_INIT_BID,
  OK_TO_BID,
  OK_BUY_NFT,
  OK_FOR_SALE,
  OK_CHANGE_PRICE,
  OK_TO_CLAIM,
  OK_CLOSE_SALE,
  OK_STATUS
}

export const BidButtonPrompt: {[field in USER_BUTTON_ID]: string} = {
  [USER_BUTTON_ID.ERR_NO_WALLET]: 'Connect Wallet',
  [USER_BUTTON_ID.ERR_BID_ENDED]: 'Bid Completed',
  [USER_BUTTON_ID.ERR_INPUT_VALUE]: 'Enter an Amount',
  [USER_BUTTON_ID.ERR_LOW_BALANCE]: 'Insufficient ETH  Balance',
  [USER_BUTTON_ID.ERR_LOW_PRICE]: 'Low Bid Price',
  [USER_BUTTON_ID.ERR_NO_RECIPIENT]: 'Enter a recipient',
  [USER_BUTTON_ID.OK_INIT_BID]: 'Initiate a Bid',
  [USER_BUTTON_ID.OK_TO_BID]: 'Bid the NFT',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change NFT Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim NFT',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'CLose Sell',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const selectNftCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectNftCurrency')
export const typeNftInput = createAction<{ typedValue: string }>('nft/typeNftInput')
export const replaceNftState = createAction<{
  typedValue: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
}>('nft/replaceNftState')
export const setNftRecipient = createAction<{ recipient: string | null }>('nft/setNftRecipient')
