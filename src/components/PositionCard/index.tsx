import { JSBI, Pair, Percent, TokenAmount, Token } from '@feswap/sdk'
import { darken } from 'polished'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, TYPE, HideExtraSmall, ExtraSmallOnly } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonPrimary, ButtonSecondary, ButtonEmpty, ButtonUNIGradient } from '../Button'
import { transparentize } from 'polished'
import { CardNoise } from '../earn/styled'

import { useColor } from '../../hooks/useColor'

import Card, { GreyCard, LightCard } from '../Card'
import { AutoColumn, ColumnCenter, ColumnLeft } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import Row, { RowBetween, RowFixed, AutoRow } from '../Row'
import { Dots } from '../swap/styleds'
import { BIG_INT_ZERO } from '../../constants'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 3fr 3fr;
  gap: 20px;
  width: 100%;
`

const Separator = styled.div`
  width: 100%;
  height: 1px;
  margin: 0px 0px 6px 0px;
  background-color: ${({ theme }) => theme.bg5};
`

export const HoverCard = styled(Card)`
  border: 1px solid transparent;
  :hover {
    border: 1px solid ${({ theme }) => darken(0.06, theme.bg2)};
  }
`
const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
  position: relative;
  overflow: hidden;
`
//`radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `};


interface PositionCardProps {
  pair: Pair
  tokenA?: Token
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
}

export function MinimalPositionCard({ pair, tokenA, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const iftokenAFirst = tokenA?.equals(pair.token0)
  const [token0, token1] = iftokenAFirst ? [pair.token0, pair.token1] : [pair.token1, pair.token0]

  const currency0 = showUnwrapped ? token0 : unwrappedToken(token0)
  const currency1 = showUnwrapped ? token1 : unwrappedToken(token1)

  const userPoolBalance0 = useTokenBalance(account ?? undefined, iftokenAFirst ? pair.liquidityToken0 : pair.liquidityToken1)
  const totalPoolTokens0 = useTotalSupply(iftokenAFirst ? pair.liquidityToken0 : pair.liquidityToken1)

  const userPoolBalance1 = useTokenBalance(account ?? undefined, iftokenAFirst ? pair.liquidityToken1 : pair.liquidityToken0 )
  const totalPoolTokens1 = useTotalSupply(iftokenAFirst ? pair.liquidityToken1 : pair.liquidityToken0)

  const poolTokenPercentage0 =
    !!userPoolBalance0 && !!totalPoolTokens0 && JSBI.greaterThanOrEqual(totalPoolTokens0.raw, userPoolBalance0.raw)
      ? new Percent(userPoolBalance0.raw, totalPoolTokens0.raw)
      : undefined

  const poolTokenPercentage1 =
    !!userPoolBalance1 && !!totalPoolTokens1 && JSBI.greaterThanOrEqual(totalPoolTokens1.raw, userPoolBalance1.raw)
      ? new Percent(userPoolBalance1.raw, totalPoolTokens1.raw)
      : undefined

  const [token00Deposited, token01Deposited] =
    !!pair &&
    !!totalPoolTokens0 &&
    !!userPoolBalance0 &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens0.raw, userPoolBalance0.raw)
      ? [
          pair.getLiquidityValue(token0, totalPoolTokens0, userPoolBalance0, false),
          pair.getLiquidityValue(token1, totalPoolTokens0, userPoolBalance0, false)
        ]
      : [undefined, undefined]

  const [token10Deposited, token11Deposited] =
    !!pair &&
    !!totalPoolTokens1 &&
    !!userPoolBalance1 &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens1.raw, userPoolBalance1.raw)
      ? [
          pair.getLiquidityValue(token1, totalPoolTokens1, userPoolBalance1, false),
          pair.getLiquidityValue(token0, totalPoolTokens1, userPoolBalance1, false)
        ]
      : [undefined, undefined]

  return (
    <>
      { ( ( userPoolBalance0 && JSBI.greaterThan(userPoolBalance0.raw, JSBI.BigInt(0) ) ) || 
          ( userPoolBalance1 && JSBI.greaterThan(userPoolBalance1.raw, JSBI.BigInt(0) ) ) )
      ? (
        <GreyCard border={border}>
          <ColumnCenter>
            <Text fontWeight={500} fontSize={16} >
              Your position
            </Text>
            <Separator />
          </ColumnCenter>
          <CardWrapper>
            <Row>
              <ColumnLeft style={{ margin: '0 1 0 1em', width: '100%' }} >
                <RowFixed>
                  <Text fontWeight={500} fontSize={14}>
                  <strong>Sub-Pools</strong>
                  </Text>
                </RowFixed>
                <Text fontWeight={500} fontSize={14}>
                  <strong>Pool Liquidity</strong>
                </Text>
                <Text fontWeight={500} fontSize={14}>
                  Your Liquidity
                </Text>
                <Text fontSize={14} fontWeight={500} >
                  Pool Share
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {currency0.symbol}:
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {currency1.symbol}:
                </Text>
              </ColumnLeft>
            </Row>
            <Row>
              <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={false} size={14} />
                  <Text fontWeight={500} fontSize={14}>
                    <strong>{currency0.symbol}/{currency1.symbol}</strong>
                  </Text>
                </RowFixed>
                <Text fontWeight={500} fontSize={14}>
                  <strong>{totalPoolTokens0 ? totalPoolTokens0.toSignificant(6) : '-'}</strong>
                </Text>
                <Text fontWeight={500} fontSize={14}>
                  {userPoolBalance0 ? userPoolBalance0.toSignificant(6) : '-'}
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {poolTokenPercentage0 ? poolTokenPercentage0.toFixed(2) + '%' : '-'}
                </Text>
                {token00Deposited ? (
                      <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                        {token00Deposited?.toSignificant(6)}
                      </Text>
                  ) : ('-')}

                {token01Deposited ? (
                      <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                        {token01Deposited?.toSignificant(6)}
                      </Text>
                  ) : ('-')}

              </ColumnCenter>
            </Row>
            <Row>
              <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currency1} currency1={currency0} margin={false} size={14} />
                  <Text fontWeight={500} fontSize={14}>
                    <strong>{currency1.symbol}/{currency0.symbol}</strong>
                  </Text>
                </RowFixed>
                <Text fontWeight={500} fontSize={14}>
                  <strong>{totalPoolTokens1 ? totalPoolTokens1.toSignificant(6) : '-'}</strong>
                </Text>
                <Text fontWeight={500} fontSize={14}>
                  {userPoolBalance1 ? userPoolBalance1.toSignificant(4) : '-'}
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {poolTokenPercentage1 ? poolTokenPercentage1.toFixed(2) + '%' : '-'}
                </Text>
                {token11Deposited ? (
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token11Deposited?.toSignificant(6)}
                  </Text>
                ) : (
                  '-'
                )}
                {token10Deposited ? (
                  <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                    {token10Deposited?.toSignificant(6)}
                  </Text>
                ) : (
                  '-'
                )}
              </ColumnCenter>
            </Row>
          </CardWrapper>
        </GreyCard>
       ) : (
        <LightCard>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            <span role="img" aria-label="wizard-icon">
              ⭐️
            </span>{' '}
            By adding liquidity you&apos;ll earn the arbitrage profit of all trades on this pair proportional to your share of the pool, 
            which could be around 0.25-1.0%. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
          </TYPE.subHeader>
        </LightCard>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border, stakedBalance }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userDefaultPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken0)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken0)

  // if staked balance balance provided, add to standard liquidity amount
  const userPoolBalance = stakedBalance ? userDefaultPoolBalance?.add(stakedBalance) : userDefaultPoolBalance

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false)
        ]
      : [undefined, undefined]

  const backgroundColor = useColor(pair?.token0)

  return (
    <StyledPositionCard border={border} bgColor={backgroundColor}>
      <CardNoise />
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <AutoRow gap="8px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={500} fontSize={20}>
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
            </Text>
            {!!stakedBalance && (
              <ButtonUNIGradient as={Link} to={`/uni/${currencyId(currency0)}/${currencyId(currency1)}`}>
                <HideExtraSmall>Earning FESW</HideExtraSmall>
                <ExtraSmallOnly>
                  <span role="img" aria-label="bolt">
                    ⚡
                  </span>
                </ExtraSmallOnly>
              </ButtonUNIGradient>
            )}
          </AutoRow>

          <RowFixed gap="8px">
            <ButtonEmpty
              padding="6px 8px"
              borderRadius="12px"
              width="fit-content"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? (
                <>
                  Manage
                  <ChevronUp size="20" style={{ marginLeft: '10px' }} />
                </>
              ) : (
                <>
                  Manage
                  <ChevronDown size="20" style={{ marginLeft: '10px' }} />
                </>
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                Your total pool tokens:
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              </Text>
            </FixedHeightRow>
            {stakedBalance && (
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={500}>
                  Pool tokens in rewards pool:
                </Text>
                <Text fontSize={16} fontWeight={500}>
                  {stakedBalance.toSignificant(4)}
                </Text>
              </FixedHeightRow>
            )}
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  Pooled {currency0.symbol}:
                </Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token0Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  Pooled {currency1.symbol}:
                </Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {token1Deposited?.toSignificant(6)}
                  </Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <Text fontSize={16} fontWeight={500}>
                Your pool share:
              </Text>
              <Text fontSize={16} fontWeight={500}>
                {poolTokenPercentage
                  ? (poolTokenPercentage.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage.toFixed(2)) + '%'
                  : '-'}
              </Text>
            </FixedHeightRow>

            <ButtonSecondary padding="8px" borderRadius="8px">
              <ExternalLink
                style={{ width: '100%', textAlign: 'center' }}
                href={`https://info.feswap.io/account/${account}`}
              >
                View accrued fees and analytics<span style={{ fontSize: '11px' }}>↗</span>
              </ExternalLink>
            </ButtonSecondary>
            {userDefaultPoolBalance && JSBI.greaterThan(userDefaultPoolBalance.raw, BIG_INT_ZERO) && (
              <RowBetween marginTop="10px">
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  as={Link}
                  to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                  width="48%"
                >
                  Add
                </ButtonPrimary>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  as={Link}
                  width="48%"
                  to={`/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
                >
                  Remove
                </ButtonPrimary>
              </RowBetween>
            )}
            {stakedBalance && JSBI.greaterThan(stakedBalance.raw, BIG_INT_ZERO) && (
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                as={Link}
                to={`/uni/${currencyId(currency0)}/${currencyId(currency1)}`}
                width="100%"
              >
                Manage Liquidity in Rewards Pool
              </ButtonPrimary>
            )}
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
