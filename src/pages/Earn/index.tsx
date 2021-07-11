import React from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { STAKING_REWARDS_INFO, useStakingInfo } from '../../state/stake/hooks'
import { TYPE, ExternalLink } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise } from '../../components/earn/styled'
import { Countdown } from './Countdown'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
//import { JSBI } from '@feswap/sdk'
//import { BIG_INT_ZERO } from '../../constants'
import { OutlineCard } from '../../components/Card'

const PageWrapper = styled(AutoColumn)`
  max-width: 480px;
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
  const { chainId } = useActiveWeb3React()

  // staking info for connected account
  const stakingInfos = useStakingInfo()

//  console.log('AAAAAAAAAAAAA', stakingInfos)
 
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
                <TYPE.black fontWeight={600}>FeSwap liquidity mining</TYPE.black>
              </RowBetween>
              <RowBetween>
                <TYPE.black fontSize={14}>
                  Deposit your Liquidity Provider tokens to receive FESW, the FeSwap protocol governance token.
                </TYPE.black>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'black', textDecoration: 'underline' }}
                href="https://www.feswap.io/blog/fesw/"
                target="_blank"
              >
                <TYPE.black fontSize={14}>Read more about FESW ↗</TYPE.black>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </VoteCard>


      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
          <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} />
        </DataRow>

        <PoolSection>
          {stakingRewardsExist && stakingInfos?.length === 0 ? (
            <Loader style={{ margin: 'auto' }} />
          ) : !stakingRewardsExist ? (
            <OutlineCard>No active pools</OutlineCard>
          ) : stakingInfos?.length !== 0 && (
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


//<PoolSection>
//{stakingRewardsExist && stakingInfos?.length === 0 ? (
//  <Loader style={{ margin: 'auto' }} />
//) : !stakingRewardsExist ? (
//  <OutlineCard>No active pools</OutlineCard>
//) : stakingInfos?.length !== 0 && stakingInfosWithBalance.length === 0 ? (
//  <OutlineCard>No active pools</OutlineCard>
//) : (
//  stakingInfosWithBalance?.map(stakingInfo => {
//    // need to sort by added liquidity here
//    return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
//  })
//)}
//</PoolSection>