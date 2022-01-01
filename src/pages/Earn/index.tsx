import { ChainId } from '@feswap/sdk'
import React, { useContext } from 'react'
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
import { FESW, NETWORK_NAME } from '../../constants'
import { Text } from 'rebass'

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
                  To reward providing liquidity, {GORV_TOKEN_NAME}, the {DAO_NAME} protocol governance token on <b>{Network}</b>, 
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
                ? ( <EmptyProposals>
                    {chainId === ChainId.MATIC 
                    ? <TYPE.black textAlign="center" fontSize={15} style={{ width: '100%' }}>
                        <Text><strong>Liquidity mining will start off from: </strong></Text>
                        <Text fontSize={18} color={theme.primary1}><strong>2021-12-15 15:00:00 (UTC+8)</strong></Text><br/>
                        <Text><strong>Five Liquidity pools will be open for mining: </strong></Text>
                        <Text fontSize={18} color={theme.primary1}><strong>MATIC/USDC, WETH/MATIC, WETH/USDC</strong></Text>
                        <Text fontSize={18} color={theme.primary1}><strong>MATIC/USDT, MATIC/FESW@M</strong></Text>
                      </TYPE.black>
                    : 'No active pools'}
                    </EmptyProposals>) 
                : stakingInfos?.length !== 0 && (
                    (chainId === ChainId.MAINNET)
                    ? <TYPE.black textAlign="center" fontSize={24} style={{ width: '100%' }}>
                        <Text><strong>Liquidity Mining Ended! </strong></Text>
                        <Text fontSize={16} color={theme.primary1}>Totally 40M FESW distributed!</Text>
                      </TYPE.black>
                    : stakingInfos?.map(stakingInfo => {
                      // need to sort by added liquidity here
                      return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
                    }))
            }
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}