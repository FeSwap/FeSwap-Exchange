import React from 'react'
import { Text } from 'rebass'
import { ButtonError } from '../Button'
import { AutoRow } from '../Row'
import { SwapCallbackError } from '../swap/styleds'
import {NftManageTrade} from '../../state/nft/hooks'
import { USER_BUTTON_ID, BidConfirmButton } from '../../state/nft/actions'

export default function NftMngModalFooter({
  nftManageTrx,
  onConfirm,
  swapErrorMessage,
  buttonID
}: {
  nftManageTrx: NftManageTrade
  onConfirm: () => void
  swapErrorMessage: string | undefined
  buttonID: USER_BUTTON_ID
}) {

  return (
    <>
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={false}
          style={{ margin: '10px 0 0 0px' }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={20} fontWeight={500}>
            {BidConfirmButton[buttonID]}
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )}


