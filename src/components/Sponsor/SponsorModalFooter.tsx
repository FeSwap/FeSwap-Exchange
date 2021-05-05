import { Trade, TradeType, JSBI, Fraction, CurrencyAmount,Rounding } from '@uniswap/sdk'
import React, { useContext, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { TYPE } from '../../theme'
import {
  computeSlippageAdjustedAmounts,
  computeTradePriceBreakdown,
  formatExecutionPrice,
  warningSeverity
} from '../../utils/prices'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { StyledBalanceMaxMini, SwapCallbackError } from '../swap/styleds'
import {SponsorTrade} from '../../state/sponsor/hooks'
import { isAddress, calculateGasMargin, WEI_DENOM , ZERO,  ONE  } from '../../utils'

export default function SponsorModalFooter({
  sponsor,
  onConfirm,
  swapErrorMessage,
  disabledConfirm
}: {
  sponsor: SponsorTrade
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
}) {
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const theme = useContext(ThemeContext)

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <Text fontWeight={400} fontSize={14} color={theme.text2}>
            Giveaway Rate:
            <QuestionHelper text="The giveway rate keeps same for all sponsor transactions in one block, and depends on 
                                the total sponsorship reveived before current block." />
          </Text>
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
            inverted
              ? `${sponsor?.feswGiveRate?.toSignificant(6, {rounding: Rounding.ROUND_DOWN})} FESW/ETH`
              : `${sponsor?.feswGiveRate?.invert().toSignificant(6,{rounding: Rounding.ROUND_DOWN})} ETH/FESW`

            <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
              <Repeat size={14} />
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
        >
          <Text fontSize={20} fontWeight={500}>
            {'Confirm Sponosr'}
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )}