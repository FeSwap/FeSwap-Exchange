import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import SponsorModalHeader from './SponsorModalHeader'
import SponsorModalFooter from './SponsorModalFooter'
import {SponsorTrade} from '../../state/sponsor/hooks'
import { Field } from '../../state/swap/actions'
import { useActiveWeb3React } from '../../hooks'
import { FESW } from '../../constants'

export default function ConfirmSponsorModal({
  sponsor,
  originalSponsor,
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
  sponsor: SponsorTrade | undefined
  originalSponsor: SponsorTrade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  highSponsor: boolean
}) {
  const { chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : ''

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
        highSponsor = {highSponsor}
      />
    ) : null
  }, [ onConfirm, showAcceptChanges, swapErrorMessage, sponsor, highSponsor])

  // text to show while loading
  const pendingText = `Sponsoring ${sponsor?.parsedAmounts[Field.INPUT]?.toSignificant(6)} ETH,
                      and will receive ${sponsor?.parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${GORV_TOKEN_NAME} as the giveaway`

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