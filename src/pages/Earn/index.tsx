import React, { useContext } from 'react'
import { ChainId } from '@feswap/sdk'
import { AutoColumn } from '../../components/Column'
import styled, { ThemeContext }  from 'styled-components'
import { STAKING_REWARDS_INFO, useStakingInfo } from '../../state/stake/hooks'
import { TYPE, ExternalLink } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import { EmptyProposals } from '../Pool'
import { FESW } from '../../constants'

const PageWrapper = styled(AutoColumn)`
  max-width: 560px;
  width: 100%;
`

export const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
  overflow: hidden;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`


export const NETWORK_NAME: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]:            '',
  [ChainId.RINKEBY]:            '',
  [ChainId.ROPSTEN]:            '',
  [ChainId.GÖRLI]:              '',
  [ChainId.KOVAN]:              '',
  [ChainId.BSC]:                'on Binance Smart Chain',
  [ChainId.BSC_TESTNET]:        'on Binance Smart Chain testnet',
  [ChainId.MATIC]:              'on Ploygon mainnet',
  [ChainId.MATIC_TESTNET]:      'on Ploygon testnet',
  [ChainId.HARMONY]:            'on Harmony mainnet',
  [ChainId.HARMONY_TESTNET]:    'on Harmony testnet',
  [ChainId.FANTOM]:             'on Fantom mainnet',
  [ChainId.FANTOM_TESTNET]:     'on Fantom testnet',
  [ChainId.HECO]:               'on Huobi ECO Chain',
  [ChainId.HECO_TESTNET]:       'on Huobi ECO Chain Test',
  [ChainId.ARBITRUM]:           'on Arbitrum mainnet',
  [ChainId.ARBITRUM_TESTNET]:   'on Arbitrum testnet',
  [ChainId.AVALANCHE]:          'on Avalanche mainnet',
  [ChainId.AVALANCHE_TESTNET]:  'on Avalanche testnet',
  [ChainId.OKEX]:               '',
  [ChainId.OKEX_TESTNET]:       '',
  [ChainId.PALM]:               '',
  [ChainId.PALM_TESTNET]:       '',
  [ChainId.MOONBEAM]:           '',
  [ChainId.MOONRIVER]:          '',
  [ChainId.XDAI]:               '',
  [ChainId.CELO]:               ''
}


export default function Earn() {
  const { account, chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const DAO_NAME = (GORV_TOKEN_NAME==='FESW') ? 'FeSwap' : 'FeSwap'
  const Network = chainId ? NETWORK_NAME[chainId] : ''

  const theme = useContext(ThemeContext)

  // staking info for connected account
  const stakingInfos = useStakingInfo()

  /**
   * only show staking cards with balance
   * @todo only account for this if rewards are inactive
   */
//  const stakingInfosWithBalance = stakingInfos?.filter(s => JSBI.greaterThan(s.stakedAmount[0].raw, BIG_INT_ZERO))

  // toggle copy if rewards are inactive
  const stakingRewardsExist = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0)

  return (
    <PageWrapper gap="lg" justify="center">
        <VoteCard>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.black fontWeight={600}>{DAO_NAME} liquidity mining</TYPE.black>
              </RowBetween>
              <RowBetween>
                <TYPE.black fontSize={14}>
                  To reward providing liquidity, {GORV_TOKEN_NAME}, the {DAO_NAME} protocol governance token <b>{Network}</b>, 
                  are distributed based on depositing liquidity tokens.
                </TYPE.black>
              </RowBetween>
              <ExternalLink
                style={{ color: 'black', textDecoration: 'underline' }}
                href="https://www.feswap.io/docs"
                target="_blank"
              >
                <TYPE.black fontSize={14}>Read more about {GORV_TOKEN_NAME} ↗</TYPE.black>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </VoteCard>


      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
        </DataRow>

        <PoolSection>
          { (!account) 
            ? ( <EmptyProposals>
                  <TYPE.body fontWeight={500} mr="4px" textAlign="center" fontSize={16} color={theme.text3} > 
                    Connect to a Wallet to Mine {GORV_TOKEN_NAME} tokens
                  </TYPE.body> 
                </EmptyProposals>)
            : stakingRewardsExist && stakingInfos?.length === 0 
              ? (<Loader style={{ margin: 'auto' }} />) 
              : (!stakingRewardsExist) 
                ? ( <EmptyProposals>No active pools</EmptyProposals>) 
                : stakingInfos?.length !== 0 && (
                    stakingInfos?.map(stakingInfo => {
                    // need to sort by added liquidity here
                    return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
                  })
                )}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}