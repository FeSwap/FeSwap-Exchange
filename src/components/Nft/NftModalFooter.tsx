import { Rounding } from '@feswap/sdk'
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
import { USER_BUTTON_ID, BidConfirmButton, USER_UI_INFO } from '../../state/nft/actions'

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

  const firtBidderPrePrompt = "If you win the bid, the giveway is air-droped at the rate of 20,000 FESW/ETH. If failed, you will get"
  const firtBidderPrompt = firtBidderPrePrompt.concat( (nftBid.firtBidder) ? ' 1000 FESW as this NFT initial creator' : ' 500 FESW')
  const claimPrompt = "The FESW giveway is air-droped at the rate of 20,000 FESW/ETH. Thanks for bidding!"
  const buyPrompt = "If new sale price is set, the NFT will be kept for sale at new price, otherwise the NFT sale will be closed."

  return (
    <>
      { ((buttonID === USER_BUTTON_ID.OK_INIT_BID) || (buttonID === USER_BUTTON_ID.OK_TO_BID) 
          || (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) || (buttonID === USER_BUTTON_ID.OK_BUY_NFT) ) &&
        <AutoColumn gap="0px">
          <RowBetween align="center">
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                {(buttonID === USER_BUTTON_ID.OK_BUY_NFT) ? 'NFT New Price' : 'FESW Giveaway:'}
              </TYPE.black>
              <QuestionHelper text={ (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) 
                                      ? claimPrompt 
                                      : (buttonID === USER_BUTTON_ID.OK_BUY_NFT)
                                        ? buyPrompt
                                        : firtBidderPrompt} />
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
                `${nftBid.parsedAmounts[USER_UI_INFO.FESW_GIVEAWAY]?.toSignificant(6,{rounding: Rounding.ROUND_DOWN})} FESW` : null }
              { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) ? 
                `${nftBid.parsedAmounts[USER_UI_INFO.BID_FESW_GIVEAWAY]?.toSignificant(6,{rounding: Rounding.ROUND_DOWN})} FESW` : null }
              { (buttonID === USER_BUTTON_ID.OK_BUY_NFT) && 
                  ( !nftBid.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT] 
                      ? 'Not For Sale'
                      : `${nftBid.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(6,{rounding: Rounding.ROUND_DOWN})} ETH` ) 
              } 
            </Text>
          </RowBetween>
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


