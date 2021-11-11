import React, { useContext } from 'react'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { Field, USER_BUTTON_ID, BidConfirmLine1 } from '../../state/nft/actions'
import { TYPE } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import {NftManageTrade} from '../../state/nft/hooks'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { Link2 } from 'react-feather'
import { useActiveWeb3React } from '../../hooks'

export default function NftMngModalHeader({
  nftManageTrx,
  recipient,
  buttonID
}: {
  nftManageTrx: NftManageTrade
  recipient: string | null
  buttonID: USER_BUTTON_ID
}) {

  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const pairSymbol = `${nftManageTrx.pairCurrencies[Field.TOKEN_A]?.getSymbol(
                        chainId)}🔗${nftManageTrx.pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId)}`

  return (
    <AutoColumn gap={'md'} style={{ marginTop: '20px' }}  >
      <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
        <RowFixed>
          <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
            {BidConfirmLine1[buttonID]}
          </TYPE.body>
        </RowFixed>
        <RowFixed>
          <DoubleCurrencyLogo currency0={nftManageTrx.pairCurrencies[Field.TOKEN_A]??undefined} 
                              currency1={nftManageTrx.pairCurrencies[Field.TOKEN_B]??undefined} size={24} />
          <Text fontWeight={500} fontSize={24} style={{ margin: '0 0 0 6px' }} >
            {nftManageTrx.pairCurrencies[Field.TOKEN_A]?.getSymbol(chainId)}
          </Text>
          <Link2 fontSize={'20px'} color={theme.primary1} style={{ margin: '0 2px 0 2px' }} />
          <Text fontWeight={500} fontSize={24} >
            {nftManageTrx.pairCurrencies[Field.TOKEN_B]?.getSymbol(chainId)}
          </Text>
        </RowFixed>
      </RowBetween>
      { (nftManageTrx.rateTrigger !== 0) &&
        <RowBetween align="flex-end" style={{ padding: '6px 0px 6px 0px'}}>
            <RowFixed>
              <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
                Trigger Rate:
              </TYPE.body>
            </RowFixed>
            <RowFixed>
              <TYPE.black color={theme.text1} fontSize={24}>
                {(nftManageTrx.rateTrigger/10).toFixed(1)}%
              </TYPE.black>
            </RowFixed>
          </RowBetween> }

      {recipient !== null ? (
          <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
            <TYPE.body color={theme.text1} fontWeight={400} fontSize={20}>
              Profit Receiver:
            </TYPE.body>
            <TYPE.main>
              <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient,6) : recipient}</b>
            </TYPE.main>
          </RowBetween>
        ) : null}
      <AutoColumn justify="flex-start" gap="md" style={{ padding: '6px 0 0 0px', height: '50px' }}>
        <TYPE.italic size={20} textAlign="left" style={{ width: '100%' }}>
          { (buttonID === USER_BUTTON_ID.OK_CREATE_PAIR) 
            ? <span>The AMM liquidity pool <b>{pairSymbol}</b> will be created.</span>
            : <span>You are configuring the liquidity pool <b>{pairSymbol}</b>.</span>}
          { (recipient === null) ? ` The profit will be sent to your wallet automatically.` : ` You are setting a specific profit receiver.` } 
          { (nftManageTrx.rateTrigger === 0)  
            ? <span> And general arbitrage trigger rate will be used.</span>
            : <span> And you are setting the arbitrage trigger rate to <b> {(nftManageTrx.rateTrigger/10).toFixed(1)}%</b>.</span> }                             
        </TYPE.italic>
      </AutoColumn>

    </AutoColumn>
  )
}
