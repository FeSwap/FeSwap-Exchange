import { currencyEquals, Trade, JSBI } from '@uniswap/sdk'
import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import SponsorModalHeader from './SponsorModalHeader'
import SponsorModalFooter from './SponsorModalFooter'
import {SponsorTrade} from '../../state/sponsor/hooks'
import { Field } from '../../state/swap/actions'

export default function ConfirmSwapModal({
  sponsor,
  originalSponsor,
  onAcceptChanges,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash
}: {
  isOpen: boolean
  sponsor: SponsorTrade | undefined
  originalSponsor: SponsorTrade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(sponsor?.feswGiveRate && originalSponsor?.feswGiveRate && 
                  !sponsor.feswGiveRate.equalTo(originalSponsor.feswGiveRate)),
    [originalSponsor, sponsor]
  )

  const modalHeader = useCallback(() => {
    return sponsor ? (
      <SponsorModalHeader
        sponsor={sponsor}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null
  }, [ onAcceptChanges, recipient, showAcceptChanges, sponsor])

  const modalBottom = useCallback(() => {
    return sponsor ? (
      <SponsorModalFooter
        onConfirm={onConfirm}
        sponsor={sponsor}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
      />
    ) : null
  }, [ onConfirm, showAcceptChanges, swapErrorMessage, sponsor])

  // text to show while loading
  const pendingText = `Swapping ${sponsor?.parsedAmounts[Field.INPUT]?.toSignificant(6)} for ETH
                                ${sponsor?.parsedAmounts[Field.OUTPUT]?.toSignificant(6)} FESW`

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title="Confirm Swap"
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
    />
  )
}