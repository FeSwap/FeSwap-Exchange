import { createAction } from '@reduxjs/toolkit'

export enum Field {
  TOKEN_A,
  TOKEN_B
}

export enum WALLET_BALANCE {
  ETH,
  FESW
}

export enum NFT_BID_TYPE {
  FESW,
  YESW
}

export enum USER_UI_INFO {
  USER_PRICE_INPUT,
  BASE_GIVEAWAY,
  FESW_GIVEAWAY,
  LAST_NFT_PRICE,
  BID_FESW_GIVEAWAY
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
  ERR_NO_SERVICE,
  ERR_NO_START,
  ERR_NO_TOKENS,
  ERR_BID_ENDED,
  ERR_INPUT_VALUE,
  ERR_LOW_BALANCE,
  ERR_LOW_PRICE,
  ERR_LOW_BUY_PRICE,
  ERR_NO_RECIPIENT,
  OK_INIT_BID,
  OK_TO_BID,
  OK_TO_REBID,
  OK_BUY_NFT,
  OK_FOR_SALE,
  OK_CHANGE_PRICE,
  OK_TO_CLAIM,
  OK_CLOSE_SALE,
  OK_JUMP_BID,
  OK_CREATE_PAIR,
  OK_CHNAGE_CONFIG,
  OK_STATUS
}

export const BidButtonPrompt: {[field in USER_BUTTON_ID]: string} = {
  [USER_BUTTON_ID.ERR_NO_WALLET ]: 'Connect Wallet',
  [USER_BUTTON_ID.ERR_NO_SERVICE]: 'NO Service',
  [USER_BUTTON_ID.ERR_NO_START ]: 'Bid Not Started',
  [USER_BUTTON_ID.ERR_NO_TOKENS ]: 'Select Token Pair',
  [USER_BUTTON_ID.ERR_BID_ENDED]: 'Bid Completed',
  [USER_BUTTON_ID.ERR_INPUT_VALUE]: 'Enter the Price',
  [USER_BUTTON_ID.ERR_LOW_BALANCE]: 'Insufficient ETH Balance',
  [USER_BUTTON_ID.ERR_LOW_PRICE]: 'Low Bid Price',
  [USER_BUTTON_ID.ERR_LOW_BUY_PRICE]: 'Low Buy Price',
  [USER_BUTTON_ID.ERR_NO_RECIPIENT]: 'Enter a recipient',
  [USER_BUTTON_ID.OK_INIT_BID]: 'Initiate a Bid',
  [USER_BUTTON_ID.OK_TO_BID]: 'Bid the NFT',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Re-Bid the NFT',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change NFT Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim NFT',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Close NFT Sale',
  [USER_BUTTON_ID.OK_JUMP_BID]: 'Skip to Bid',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Create NFT Swap Pool',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Update NFT Pool Config',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidConfirmTitle: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Confirm NFT Bid',
  [USER_BUTTON_ID.OK_TO_BID]: 'Confirm NFT Bid',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Confirm NFT Re-Bid',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Confirm Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Confirm Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change NFT Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim NFT',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Confirm to Close NFT Sale',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Create NFT Pool',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Config NFT Pool',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidPendingTitle: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Confirming NFT Bid',
  [USER_BUTTON_ID.OK_TO_BID]: 'Confirming NFT Bid',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Confirming NFT Re-Bid',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Confirming Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Confirming Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change NFT Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim NFT',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Close NFT Sale',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Create NFT Pool',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Config NFT Pool',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidSubmittedTitle: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'NFT Bid Submitted',
  [USER_BUTTON_ID.OK_TO_BID]: 'NFT Bid Submitted',
  [USER_BUTTON_ID.OK_TO_REBID]: 'NFT Re-Bid Submitted',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Confirm Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Confirm Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change NFT Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'NFT Claim Submmitted',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Close NFT Sale',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Create NFT Pool',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Config NFT Pool',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidConfirmLine1: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Bidding NFT:',
  [USER_BUTTON_ID.OK_TO_BID]: 'Bidding NFT:',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Re-Bidding NFT:',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'NFT to Buy:',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'NFT to Sell:',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'NFT to Change:', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Your own NFT:',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Target NFT Sale:',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'NFT Pool:',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'NFT Pool:',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidConfirmLine2: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Bidding price:',
  [USER_BUTTON_ID.OK_TO_BID]: 'Bidding price:',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Re-Bidding price:',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Buying Price:',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'NFT Sell Price:',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'New NFT Price:', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Final Price:',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Close Sale:',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Trigger Rate:',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Trigger Rate:',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const BidConfirmButton: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Confirm Bid',
  [USER_BUTTON_ID.OK_TO_BID]: 'Confirm Bid',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Confirm Re-Bid',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'Buy NFT',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Sell NFT',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'Change Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim NFT',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'Close NFT Sale',
  [USER_BUTTON_ID.OK_CREATE_PAIR]: 'Create NFT Pool',
  [USER_BUTTON_ID.OK_CHNAGE_CONFIG]: 'Config NFT Pool ',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const userInputTitle: {[field: number]: string} = {
  [USER_BUTTON_ID.OK_INIT_BID]: 'Bid Price',
  [USER_BUTTON_ID.OK_TO_BID]: 'Bid Price',
  [USER_BUTTON_ID.OK_TO_REBID]: 'Re-Bid Price',
  [USER_BUTTON_ID.OK_BUY_NFT]: 'NFT New Sale Price',
  [USER_BUTTON_ID.OK_FOR_SALE]: 'Selling Price',
  [USER_BUTTON_ID.OK_CHANGE_PRICE]: 'NFT New Price', 
  [USER_BUTTON_ID.OK_TO_CLAIM]: 'Claim FESW',
  [USER_BUTTON_ID.OK_CLOSE_SALE]: 'NFT New Price',
  [USER_BUTTON_ID.OK_STATUS]: 'NO Action'
}

export const selectNftCurrency = createAction<{ field: Field; currencyId: string }>('swap/selectNftCurrency')
export const typeNftInput = createAction<{ typedValue: string }>('nft/typeNftInput')
export const typeTriggerRate = createAction<{ rateTrigger: number }>('nft/typeTriggerRate')
export const replaceNftState = createAction<{
  typedValue: string
  rateTrigger: number
  inputCurrencyId?: string
  outputCurrencyId?: string
  recipient: string | null
}>('nft/replaceNftState')
export const setNftRecipient = createAction<{ recipient: string | null }>('nft/setNftRecipient')
