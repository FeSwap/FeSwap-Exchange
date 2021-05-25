import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import NftModalHeader from './NftModalHeader'
import NftModalFooter from './NftModalFooter'
import {NftBidTrade} from '../../state/nft/hooks'
import { Field, WALLET_BALANCE, USER_BUTTON_ID } from '../../state/nft/actions'

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

//  console.log("showAcceptChanges", showAcceptChanges, nftBid, originalNftBid)
//  const showAcceptChanges  = true

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
  }, [ onAcceptChanges, recipient, showAcceptChanges, nftBid])

  const modalBottom = useCallback(() => {
    return nftBid ? (
      <NftModalFooter
        onConfirm={onConfirm}
        nftBid={nftBid}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        highNftPrice = {highNftPrice}
      />
    ) : null
  }, [ onConfirm, showAcceptChanges, swapErrorMessage, nftBid, highNftPrice])

  // text to show while loading
  const pendingText = useMemo(()=>{
      if (!nftBid) return ''
      return `Bidding ${nftBid?.parsedAmounts[WALLET_BALANCE.ETH]?.toSignificant(6)} ETH for the NFT representing
              ${nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}/${nftBid.pairCurrencies[Field.TOKEN_B]?.symbol} `
    }
    ,[nftBid])

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
         <ConfirmationModalContent
          title="Confirm Bid"
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
          />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      pendingTitle="Confirm NFT Bidding"
      submittedTitle="NFT Bidding Submitted"
    />
  )
}