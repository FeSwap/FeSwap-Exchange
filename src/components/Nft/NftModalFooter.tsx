import { Rounding, NATIVE } from '@feswap/sdk'
import React, { useContext } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { FESW } from '../../constants'
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
import { USER_BUTTON_ID, BidConfirmButton, USER_UI_INFO } from '../../state/nft/actions'
import { THOUSAND_FRACTION, ZERO_FRACTION } from '../../utils'
import { feswType } from '../../hooks/useContract'

export default function NftModalFooter({
  nftBid,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  highNftPrice,
  buttonID
}: {
  nftBid: NftBidTrade
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
  highNftPrice: boolean
  buttonID: USER_BUTTON_ID
}) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : ''
  const NATIVE_SYMBOL = chainId ? NATIVE[chainId].symbol : ''
  const RATE_WINNER = nftBid.feswaNftConfig?.feswGiveRate.toFixed(0, { groupSeparator: ',' }) ?? ''
  const RATE_BASE   = nftBid.feswaNftConfig?.feswGiveRate.divide('5').toFixed(0, { groupSeparator: ',' }) ?? ''
  const BaseGiveaway  = feswType(chainId) === "FESW-V2" 
                          ? (nftBid.parsedAmounts[USER_UI_INFO.BASE_GIVEAWAY]??ZERO_FRACTION) 
                          : ((nftBid.firtBidder) ? '0' : '500')

  const FinalGiveaway = nftBid.parsedAmounts[USER_UI_INFO.FESW_GIVEAWAY]?.greaterThan(ZERO_FRACTION) ? 
                      `== ${nftBid.parsedAmounts[USER_UI_INFO.FESW_GIVEAWAY]?.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${GORV_TOKEN_NAME}`
                      :''

  const NormalBidderPrompt = feswType(chainId) === "FESW-V2" 
                        ? `will get the base giveaway at the rate of ${RATE_BASE} ${GORV_TOKEN_NAME}/${NATIVE_SYMBOL} for the bidding price increase. `
                        : `will get 500 ${GORV_TOKEN_NAME} for each next bidding. `
  const FinalBidderPrePrompt = NormalBidderPrompt.concat( `If you win the bid, the final giveway is airdroped at the rate of ${RATE_WINNER} ${GORV_TOKEN_NAME}/${NATIVE_SYMBOL}. 
                              If failed, your payment will be returned back.`)
  const firtBidderPrompt = (nftBid.firtBidder) ? `You can always get 1000 ${GORV_TOKEN_NAME} as this NFT initial bidder. And you ` : 'You '
  const BidderPrompt = firtBidderPrompt.concat(FinalBidderPrePrompt)

  const claimPrompt = `The FESW giveway is airdroped at the rate of ${RATE_WINNER} ${GORV_TOKEN_NAME}/${NATIVE_SYMBOL}. Thanks for bidding!`
  const buyPrompt = "If new sale price is set, the NFT will be kept for sale at new price, otherwise the NFT sale will be closed."
  const FirtBidGiveaway = (nftBid.firtBidder) ? THOUSAND_FRACTION : ZERO_FRACTION

  return (
    <>
      { ((buttonID === USER_BUTTON_ID.OK_INIT_BID) || (buttonID === USER_BUTTON_ID.OK_TO_BID) 
          || (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) || (buttonID === USER_BUTTON_ID.OK_BUY_NFT) ) && chainId &&
        <AutoColumn gap="6px">
          <RowBetween align="center">
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                {(buttonID === USER_BUTTON_ID.OK_BUY_NFT) ? 'NFT New Price' : `${GORV_TOKEN_NAME} Giveaway:`}
              </TYPE.black>
              <QuestionHelper text={ (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) 
                                      ? claimPrompt 
                                      : (buttonID === USER_BUTTON_ID.OK_BUY_NFT)
                                        ? buyPrompt
                                        : BidderPrompt} />
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
              { ((buttonID === USER_BUTTON_ID.OK_INIT_BID) || (buttonID === USER_BUTTON_ID.OK_TO_BID)) ? 
                `${FirtBidGiveaway.add(BaseGiveaway).toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${GORV_TOKEN_NAME}` : null }
              { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) ? 
                `${nftBid.parsedAmounts[USER_UI_INFO.BID_FESW_GIVEAWAY]?.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${GORV_TOKEN_NAME}` : null }
              { (buttonID === USER_BUTTON_ID.OK_BUY_NFT) && 
                  ( !nftBid.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT] 
                      ? 'Not For Sale'
                      : `${nftBid.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6, undefined, Rounding.ROUND_DOWN)} ${NATIVE_SYMBOL}` ) 
              } 
            </Text>
          </RowBetween>
          { ((buttonID === USER_BUTTON_ID.OK_INIT_BID) || (buttonID === USER_BUTTON_ID.OK_TO_BID)) &&  FinalGiveaway && 
            <RowBetween align="center">
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                Possible Final Win Giveaway:
              </TYPE.black>
              <Text fontWeight={500} fontSize={14} color={theme.text1} style={{ justifyContent: 'center', alignItems: 'center',
                                                                                display: 'flex', textAlign: 'right', paddingLeft: '10px' }} >
                {FinalGiveaway}
              </Text>
            </RowBetween>
          }
        </AutoColumn>
      }
      <AutoRow>
        <ButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0px' }}
          id="confirm-swap-or-send"
          error = {highNftPrice}
        >
          <Text fontSize={20} fontWeight={500}>
            {BidConfirmButton[buttonID]}
          </Text>
        </ButtonError>
        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )}


