import React, { useContext } from 'react'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field, WALLET_BALANCE, USER_BUTTON_ID } from '../../state/nft/actions'
import { TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { isAddress, shortenAddress } from '../../utils'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { SwapShowAcceptChanges } from '../swap/styleds'
import {NftBidTrade} from '../../state/nft/hooks'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { Link2 } from 'react-feather'

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

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}  >
      <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
        <RowFixed>
          <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
            Bidding NFT:
          </TYPE.body>
        </RowFixed>
        <RowFixed>
          <DoubleCurrencyLogo currency0={nftBid.pairCurrencies[Field.TOKEN_A]??undefined} 
                              currency1={nftBid.pairCurrencies[Field.TOKEN_B]??undefined} size={24} />
          <Text fontWeight={500} fontSize={24} style={{ margin: '0 0 0 6px' }} >
            {nftBid.pairCurrencies[Field.TOKEN_A]?.symbol}
          </Text>
          <Link2 fontSize={'20px'} color={theme.primary1} style={{ margin: '0 2px 0 2px' }} />
          <Text fontWeight={500} fontSize={24} >
            {nftBid.pairCurrencies[Field.TOKEN_B]?.symbol}
          </Text>
        </RowFixed>
      </RowBetween>
      <RowBetween align="flex-end" style={{ padding: '6px 0px 6px 0px'}}>
        <RowFixed>
          <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
            Bidding price:
          </TYPE.body>
        </RowFixed>
        <RowFixed>
          <TYPE.black color={theme.text1} fontSize={24}>
            {nftBid?.parsedAmounts[WALLET_BALANCE.ETH]?.toSignificant(8)} ETH
           </TYPE.black>
        </RowFixed>
      </RowBetween>
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
        <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
          The bidding winner will own 60% of the token pair exchange profit corresponding to the NFT. 
          No mather win or lose, each participant will get some giveaway FESW tokens.  
        </TYPE.italic>
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

