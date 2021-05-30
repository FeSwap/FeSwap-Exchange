import { Rounding } from '@uniswap/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import NftModalHeader from './NftModalHeader'
import NftModalFooter from './NftModalFooter'
import {NftBidTrade} from '../../state/nft/hooks'
import { Field, USER_UI_INFO, USER_BUTTON_ID, BidConfirmTitle, BidPendingTitle, BidSubmittedTitle } from '../../state/nft/actions'


export default function ConfirmNftModal({
  nftBid,
  originalNftBid,
  onAcceptChanges,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  highNftPrice,
  buttonID
}: {
  isOpen: boolean
  nftBid: NftBidTrade | undefined
  originalNftBid: NftBidTrade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  highNftPrice: boolean
  buttonID: USER_BUTTON_ID
}) {

  const showAcceptChanges = useMemo( 
    () => Boolean( nftBid?.parsedAmounts[2] && originalNftBid?.parsedAmounts[2] &&
                   !(nftBid?.parsedAmounts[2].equalTo(originalNftBid?.parsedAmounts[2]))),
    [originalNftBid, nftBid]
  )

  const modalHeader = useCallback(() => {
    return nftBid ? (
      <NftModalHeader
        nftBid={nftBid}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
        onDismiss={onDismiss}
        buttonID = {buttonID}
      />
    ) : null
  }, [ onAcceptChanges, recipient, showAcceptChanges, nftBid, buttonID, onDismiss])

  const modalBottom = useCallback(() => {
    return nftBid ? (
      <NftModalFooter
        onConfirm={onConfirm}
        nftBid={nftBid}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        highNftPrice = {highNftPrice}
        buttonID = {buttonID}
      />
    ) : null
  }, [ onConfirm, showAcceptChanges, swapErrorMessage, nftBid, highNftPrice, buttonID])

  // text to show while loading
  const pendingText = useMemo(()=>{
      if (!nftBid) return ''
      switch (buttonID) {
        case USER_BUTTON_ID.OK_INIT_BID:
        case USER_BUTTON_ID.OK_TO_BID:
          return `Bidding ${nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6)} ETH for the NFT representing
                  ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol} `
        case USER_BUTTON_ID.OK_TO_CLAIM:
          return `Claiming NFT ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}
                  and ${nftBid.parsedAmounts[USER_UI_INFO.BID_FESW_GIVEAWAY]?.toSignificant(6,{rounding: Rounding.ROUND_DOWN})} FESW`
        case USER_BUTTON_ID.OK_FOR_SALE:
          return `Selling the NFT ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}
                  at the price of ${nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6)} ETH`
        case USER_BUTTON_ID.OK_BUY_NFT:
          return `Buying the NFT ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}
                  ${ (!nftBid.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]) 
                      ? 'and close the NFT sale'
                      : `and set the new price to be ${nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6)} ETH`
                  }`
        case USER_BUTTON_ID.OK_CHANGE_PRICE:
          return `Changing the price of NFT ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}
                  to be ${nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6)} ETH`
        case USER_BUTTON_ID.OK_CLOSE_SALE:
          return `Stop selling the NFT ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}🔗${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}`
        default:
            return ''                     
      }        
    }
    ,[nftBid, buttonID])

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
         <ConfirmationModalContent
          title={BidConfirmTitle[buttonID]}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
          />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage, buttonID]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      pendingTitle={BidPendingTitle[buttonID]}
      submittedTitle={BidSubmittedTitle[buttonID]}
    />
  )
}