import React, { useCallback, useMemo } from 'react'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from '../TransactionConfirmationModal'
import NftMngModalHeader from './NftMngModalHeader'
import NftMngModalFooter from './NftMngModalFooter'
import {NftManageTrade} from '../../state/nft/hooks'
import { Field, USER_BUTTON_ID, BidConfirmTitle, BidPendingTitle, BidSubmittedTitle } from '../../state/nft/actions'
import { useActiveWeb3React } from '../../hooks'

export default function ConfirmNftManageModal({
  nftManageTrx,
  originalnftManageTrx,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  buttonID
}: {
  isOpen: boolean
  nftManageTrx: NftManageTrade | undefined
  originalnftManageTrx: NftManageTrade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null 
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
  buttonID: USER_BUTTON_ID
}) {
  const { chainId } = useActiveWeb3React()
  const modalHeader = useCallback(() => {
    return nftManageTrx ? (
      <NftMngModalHeader
        nftManageTrx={nftManageTrx}
        recipient={recipient}
        buttonID = {buttonID}
      />
    ) : null
  }, [ recipient, nftManageTrx, buttonID])

  const modalBottom = useCallback(() => {
    return nftManageTrx ? (
      <NftMngModalFooter
        onConfirm={onConfirm}
        nftManageTrx={nftManageTrx}
        swapErrorMessage={swapErrorMessage}
        buttonID = {buttonID}
      />
    ) : null
  }, [ onConfirm, swapErrorMessage, nftManageTrx, buttonID])

  // text to show while loading
  const pendingText = useMemo(()=>{
      if (!nftManageTrx) return ''
      const pairSymbol = `${nftManageTrx.pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId)}🔗${nftManageTrx.pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId)}`

      switch (buttonID) {
        case USER_BUTTON_ID.OK_CREATE_PAIR:
          return `Creating the AMM liquidity pool: ${pairSymbol}.`
        case USER_BUTTON_ID.OK_CHNAGE_CONFIG:
          return `Changing the AMM liquidity pool config: ${pairSymbol}.`
      }
      return ''     
    }
    ,[nftManageTrx, buttonID, chainId])

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