import { Rounding } from '@uniswap/sdk'
import React, { useContext } from 'react'
// import { RefreshCcw } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { TYPE } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError } from '../swap/styleds'
import {NftBidTrade} from '../../state/nft/hooks'

export default function NftModalFooter({
  nftBid,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  highNftPrice
}: {
  nftBid: NftBidTrade
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  highNftPrice: boolean
}) {
  const theme = useContext(ThemeContext)

  const firtBidderPrePrompt = "If you win the bid, the giveway is air-droped at the rate of 20,000 FESW/ETH. If failed, you will get"
  const firtBidderPrompt = firtBidderPrePrompt.concat( (nftBid.firtBidder) ? ' 1000 FESW as this NFT initial creator' : ' 500 FESW')

  return (
    <>
      <AutoColumn gap="0px">
        <RowBetween align="center">
          <RowFixed>
            <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
              FESW Giveaway:
            </TYPE.black>
            <QuestionHelper text={firtBidderPrompt} />
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
          {`${nftBid.parsedAmounts[1]?.toSignificant(6,{rounding: Rounding.ROUND_DOWN})} FESW`}
          </Text>
        </RowBetween>
      </AutoColumn>
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
          error = {highNftPrice}
        >
          <Text fontSize={20} fontWeight={500}>
            {'Confirm Bid'}
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )}


