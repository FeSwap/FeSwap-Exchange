import React, { useCallback } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import NftModalHeader from './NftModalHeader'
import NftModalFooter from './NftModalFooter'
import {NftBidTrade} from '../../state/nft/hooks'
// import { Field } from '../../state/nft/actions'

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
  highSponsor
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
  highSponsor: boolean
}) {

//  const showAcceptChanges = useMemo(
//    () => Boolean(nftBid?.feswGiveRate && originalNftBid?.feswGiveRate && 
//                  !nftBid.feswGiveRate.equalTo(originalNftBid.feswGiveRate)),
//    [originalNftBid, nftBid]
//  )
  const showAcceptChanges = false

  const modalHeader = useCallback(() => {
    return nftBid ? (
      <NftModalHeader
        nftBid={nftBid}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
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
        highSponsor = {highSponsor}
      />
    ) : null
  }, [ onConfirm, showAcceptChanges, swapErrorMessage, nftBid, highSponsor])

  // text to show while loading
  const pendingText = 'TO DO'
  
//  `Sponsoring ${nftBid?.pairTokens[Field.TOKEN_A]?.toSignificant(6)} ETH,
//                      and will receive ${nftBid?.pairTokens[Field.TOKEN_B]?.toSignificant(6)} FESW as the giveaway`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
         <ConfirmationModalContent
          title="Confirm Sponsor"
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
      pendingTitle="Confirm Sponsor"
      submittedTitle="Sponsor Submitted"
    />
  )
}