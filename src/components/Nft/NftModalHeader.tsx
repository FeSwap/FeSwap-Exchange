import React, { useContext } from 'react'
import { NATIVE } from '@feswap/sdk'
import { FESW } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field, USER_UI_INFO, USER_BUTTON_ID, BidConfirmLine1, BidConfirmLine2 } from '../../state/nft/actions'
import { TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { isAddress, shortenAddress } from '../../utils'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { SwapShowAcceptChanges } from '../swap/styleds'
import {NftBidTrade} from '../../state/nft/hooks'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { Link2 } from 'react-feather'
import { CurrencyAmount } from '@feswap/sdk'

export default function NftModalHeader({
  nftBid,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
  onDismiss,
  buttonID
}: {
  nftBid: NftBidTrade
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  onDismiss: () => void
  buttonID: USER_BUTTON_ID
}) {

  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}  >
      <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
        <RowFixed>
          <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
            {BidConfirmLine1[buttonID]}
          </TYPE.body>
        </RowFixed>
        <RowFixed>
          <DoubleCurrencyLogo currency0={nftBid.pairCurrencies[Field.TOKEN_A]??undefined} 
                              currency1={nftBid.pairCurrencies[Field.TOKEN_B]??undefined} size={24} />
          <Text fontWeight={500} fontSize={24} style={{ margin: '0 0 0 6px' }} >
            {nftBid.pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId)}
          </Text>
          <Link2 fontSize={'20px'} color={theme.primary1} style={{ margin: '0 2px 0 2px' }} />
          <Text fontWeight={500} fontSize={24} >
            {nftBid.pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId)}
          </Text>
        </RowFixed>
      </RowBetween>
      {(buttonID !== USER_BUTTON_ID.OK_CLOSE_SALE) && chainId &&
        <RowBetween align="flex-end" style={{ padding: '6px 0px 6px 0px'}}>
          <RowFixed>
            <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
              {BidConfirmLine2[buttonID]}
            </TYPE.body>
          </RowFixed>
          <RowFixed>
            <TYPE.black color={theme.text1} fontSize={24}>
              { ( (buttonID === USER_BUTTON_ID.OK_INIT_BID) 
                  || (buttonID === USER_BUTTON_ID.OK_TO_BID)
                  || (buttonID === USER_BUTTON_ID.OK_FOR_SALE)
                  || (buttonID === USER_BUTTON_ID.OK_CHANGE_PRICE) ) ? 
                `${nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.toSignificant(8)} ${NATIVE[chainId].symbol}` : null}
              { ((buttonID === USER_BUTTON_ID.OK_TO_CLAIM) || (buttonID === USER_BUTTON_ID.OK_BUY_NFT)) ? 
                `${nftBid?.parsedAmounts[USER_UI_INFO.LAST_NFT_PRICE]?.toSignificant(8)} ${NATIVE[chainId].symbol}` : null}
            </TYPE.black>
          </RowFixed>
        </RowBetween>
      }
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap={'0px'}>
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <TYPE.main color={theme.primary1}> 
                NFT Price Updated. <br />
                { (buttonID < USER_BUTTON_ID.OK_INIT_BID) 
                  ? 'You need to bid again' : 'You still can continue'}
              </TYPE.main>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '10px' }}
              onClick={() => {
                          (buttonID < USER_BUTTON_ID.OK_INIT_BID) 
                          ? onDismiss() 
                          : onAcceptChanges()
                        }}
            >
              { (buttonID < USER_BUTTON_ID.OK_INIT_BID) 
                  ? 'Quit' : 'Continue'}
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      <AutoColumn justify="flex-start" gap="md" style={{ padding: '6px 0 0 0px', height: '50px' }}>
        { ((buttonID === USER_BUTTON_ID.OK_INIT_BID) || (buttonID === USER_BUTTON_ID.OK_TO_BID)) && chainId &&
          <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
            The bidding winner will earn 60% of the exchange profit corresponding to the NFT token pair. 
            No mather win or lose, each participant will also get some giveaway {FESW[chainId].symbol} tokens.  
          </TYPE.italic>
        }
        { ((buttonID === USER_BUTTON_ID.OK_FOR_SALE) || (buttonID === USER_BUTTON_ID.OK_CHANGE_PRICE)) && chainId &&
          <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
            If the NFT is sold, all yields under this NFT will also be sold at the same time. You could withdraw the yields beforehand. 
            { ( nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT] &&
                nftBid?.parsedAmounts[USER_UI_INFO.LAST_NFT_PRICE] &&
                nftBid?.parsedAmounts[USER_UI_INFO.USER_PRICE_INPUT]?.lessThan(nftBid?.parsedAmounts[USER_UI_INFO.LAST_NFT_PRICE] as CurrencyAmount) )
              ? <span><br/> <b>Your new price is lower than current price: 
                ${nftBid?.parsedAmounts[USER_UI_INFO.LAST_NFT_PRICE]?.toSignificant(6)} ${NATIVE[chainId].symbol} </b> </span>
              : null
            }
          </TYPE.italic>
        }
        { (buttonID === USER_BUTTON_ID.OK_CLOSE_SALE) &&
          <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
            This NFT could make profits fou you. Thanks for holding.
          </TYPE.italic>
        }
        { (buttonID === USER_BUTTON_ID.OK_BUY_NFT) &&
          <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
            The NFT owner will enjoy 60% of the token pair exchange profit corresponding to the NFT. 
          </TYPE.italic>
        }
        { (buttonID === USER_BUTTON_ID.OK_TO_CLAIM) &&
          <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
            As the owner of the NFT, you will earn 60% of the token pair exchange profit belonging to the FeSwap DAO of the corresponding NFT. 
          </TYPE.italic>
        }

      </AutoColumn>
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <TYPE.main>
            Output will be sent to{' '}
            <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
          </TYPE.main>
        </AutoColumn>
      ) : null}
    </AutoColumn>
  )
}