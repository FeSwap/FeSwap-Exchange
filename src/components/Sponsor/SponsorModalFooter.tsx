import { Rounding } from '@feswap/sdk'
import React, { useContext, useState } from 'react'
import { RefreshCcw } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { StyledBalanceMaxMini, SwapCallbackError } from '../swap/styleds'
import {SponsorTrade} from '../../state/sponsor/hooks'
import { useActiveWeb3React } from '../../hooks'
import { FESW } from '../../constants'

export default function SponsorModalFooter({
  sponsor,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  highSponsor
}: {
  sponsor: SponsorTrade
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  highSponsor: boolean
}) {
  const { chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useContext(ThemeContext)

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              Giveaway Rate:
            </TYPE.black>
            <QuestionHelper text="The giveway rate keeps same for all sponsor transactions in the same block, and which depends on 
                                the total sponsorship reveived before that block." />
          </RowFixed>
          <Text
            fontWeight={500}
            fontSize={14}
            color={theme.text1}
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex',
              textAlign: 'right',
              paddingLeft: '10px'
            }}
          >
            {showInverted
              ? `${sponsor?.feswGiveRate?.invert().toSignificant(6, undefined, Rounding.ROUND_DOWN)} ETH/${GORV_TOKEN_NAME}`
              : `${sponsor?.feswGiveRate?.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${GORV_TOKEN_NAME}/ETH` }
            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <RefreshCcw size={14} />
            </StyledBalanceMaxMini>
          </Text>
        </RowBetween>
      </AutoColumn>
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
          error = {highSponsor}
        >
          <Text fontSize={20} fontWeight={500}>
            {'Confirm Sponsor'}
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )}