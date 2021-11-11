import { JSBI, Pair, Percent, TokenAmount, Token, Rounding } from '@feswap/sdk'
import { darken } from 'polished'
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components'
import { useTotalSupply } from '../../data/TotalSupply'

import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE, HideExtraSmall, ExtraSmallOnly } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { ButtonPrimary, ButtonEmpty, ButtonUNIGradient } from '../Button'
import { transparentize } from 'polished'
import { CardNoise } from '../earn/styled'

import { useColor } from '../../hooks/useColor'

import Card, { GreyCard, LightCard } from '../Card'
import { AutoColumn, ColumnCenter, ColumnLeft } from '../Column'
// import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import Row, { RowBetween, RowFixed, AutoRow } from '../Row'
import { Dots } from '../swap/styleds'
import { BIG_INT_ZERO } from '../../constants'
import { useCurrencyFromToken } from '../../hooks/Tokens'
import { FESW } from '../../constants'

export const FixedHeightRow = styled(RowBetween)`
  height: 28px;
`

const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 3fr 3fr;
  gap: 20px;
  width: 100%;
`
const FullPositionWrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 4fr 4fr;
  gap: 5px;
  width: 100%;
`

const TextWrapper = styled(Text)`
  font-size:  16px;
  font-weight: 400;
`

const Separator = styled.div`
  width: 100%;
  height: 1px;
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
  stakedBalance0?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
  stakedBalance1?: TokenAmount // optional balance to indicate that liquidity is deposited in mining pool
}

export function MinimalPositionCard({ pair, tokenA, showUnwrapped = false, border }: PositionCardProps) {
  const { account, chainId } = useActiveWeb3React()

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
                  {currency0.getSymbol(chainId)}:
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {currency1.getSymbol(chainId)}:
                </Text>
              </ColumnLeft>
            </Row>
            <Row>
              <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={false} size={14} />
                  <Text fontWeight={500} fontSize={14}>
                    <strong>{currency0.getSymbol(chainId)}/{currency1.getSymbol(chainId)}</strong>
                  </Text>
                </RowFixed>
                <Text fontWeight={500} fontSize={14}>
                  <strong>{totalPoolTokens0 ? totalPoolTokens0.toSignificant(6) : '-'}</strong>
                </Text>
                <Text fontWeight={500} fontSize={14}>
                  {userPoolBalance0 ? userPoolBalance0.toSignificant(6) : '-'}
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  { poolTokenPercentage0 
                    ? (poolTokenPercentage0.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage0.toFixed(2)) + '%'
                    : '-'}
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
                    <strong>{currency1.getSymbol(chainId)}/{currency0.getSymbol(chainId)}</strong>
                  </Text>
                </RowFixed>
                <Text fontWeight={500} fontSize={14}>
                  <strong>{totalPoolTokens1 ? totalPoolTokens1.toSignificant(6) : '-'}</strong>
                </Text>
                <Text fontWeight={500} fontSize={14}>
                  {userPoolBalance1 ? userPoolBalance1.toSignificant(6) : '-'}
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  { poolTokenPercentage1 
                    ? (poolTokenPercentage1.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage1.toFixed(2)) + '%'
                    : '-'}
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
            By adding liquidity you&apos;ll earn the arbitrage profits coming frm all the trades on this pair, which is proportional to your share
            of the pool, and is equivalent to commision rate of 0.25-1.0%. Profits are added to the pool, and can be claimed by withdrawing your liquidity.
          </TYPE.subHeader>
        </LightCard>
      )}
    </>
  )
}

export default function FullPositionCard({ pair, border, stakedBalance0, stakedBalance1 }: PositionCardProps) {
  const { account, chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : ''

//  const currency0 = unwrappedToken(pair.token0)
//  const currency1 = unwrappedToken(pair.token1)

  const currency0 = useCurrencyFromToken(pair.token0)??undefined
  const currency1 = useCurrencyFromToken(pair.token1)??undefined

  const [showMore, setShowMore] = useState(false)

  const [stakedBalance0Inline, stakedBalance1Inline] = useMemo(() => {
    if(!stakedBalance0 || !stakedBalance1) return [stakedBalance0, stakedBalance1]
    if( (stakedBalance0.token.address === pair.liquidityToken1.address ) &&
        (stakedBalance1.token.address === pair.liquidityToken0.address ) ) return [stakedBalance1, stakedBalance0]
    return  [stakedBalance0, stakedBalance1] 
    }, [stakedBalance0, stakedBalance1, pair])

  const [token0, token1] = [pair.token0, pair.token1]

  // if staked balance balance provided, add to standard liquidity amount
  const userDefaultPoolBalance0 = useTokenBalance(account ?? undefined, pair.liquidityToken0)
  const userPoolBalance0 = stakedBalance0Inline ? userDefaultPoolBalance0?.add(stakedBalance0Inline) : userDefaultPoolBalance0
  const totalPoolTokens0 = useTotalSupply(pair.liquidityToken0)

  const userDefaultPoolBalance1 = useTokenBalance(account ?? undefined, pair.liquidityToken1)
  const userPoolBalance1 = stakedBalance1Inline ? userDefaultPoolBalance1?.add(stakedBalance1Inline) : userDefaultPoolBalance1
  const totalPoolTokens1 = useTotalSupply(pair.liquidityToken1)

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

  const backgroundColor = useColor(pair?.token0)

  return (
    <StyledPositionCard border={border} bgColor={backgroundColor}>
      <CardNoise />
      <AutoColumn gap="12px" style={{paddingBottom:'2px'}}> 
        <FixedHeightRow>
          <AutoRow gap="8px">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} />
            <Text fontWeight={500} fontSize={20}>
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.getSymbol(chainId)}🔗${currency1.getSymbol(chainId)}`}
            </Text>
            { (!!stakedBalance0Inline || !!stakedBalance1Inline) && (
              <ButtonUNIGradient as={Link} to={`/fesw/${currencyId(currency0)}/${currencyId(currency1)}`}>
                <HideExtraSmall>Mining {GORV_TOKEN_NAME}</HideExtraSmall>
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
                  <ChevronUp size="40px" style={{ marginLeft: '10px' }} />
                </>
              ) : (
                <>
                  Manage
                  <ChevronDown size="40px" style={{ marginLeft: '10px' }} />
                </>
              )}
            </ButtonEmpty>
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <ColumnCenter>
              <Separator />
            </ColumnCenter>

            <FullPositionWrapper>
              <Row>
                <ColumnLeft style={{ margin: '0 0 0 8px', width: '100%' }} >
                  <RowFixed>
                    <TextWrapper>
                      <strong>Sub-Pools</strong>
                    </TextWrapper>
                  </RowFixed>
                  <TextWrapper>
                    <strong>Pool Tokens</strong>
                  </TextWrapper>
                  <TextWrapper>
                    My Tokens
                  </TextWrapper>
                  {(!!stakedBalance0Inline || !!stakedBalance1Inline) && (
                    <TextWrapper>
                      My Stakes
                    </TextWrapper>
                  )}
                  <TextWrapper>
                    My Share
                  </TextWrapper>
                  <TextWrapper>
                    My {currency0?.getSymbol(chainId)}
                  </TextWrapper>
                  <TextWrapper>
                    My {currency1?.getSymbol(chainId)}
                  </TextWrapper>
                </ColumnLeft>
              </Row>
              <Row>
                <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                  <RowFixed>
                    <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={false} size={16} />
                    <TextWrapper>
                      <strong>{currency0?.getSymbol(chainId)}/{currency1?.getSymbol(chainId)}</strong>
                    </TextWrapper>
                  </RowFixed>
                  <TextWrapper>
                    <strong>{totalPoolTokens0 ? totalPoolTokens0.toSignificant(6) : '-'}</strong>
                  </TextWrapper>
                  <TextWrapper>
                    {userPoolBalance0 ? userPoolBalance0.toSignificant(6) : '-'}
                  </TextWrapper>
                  {(!!stakedBalance0Inline || !!stakedBalance1Inline) && (
                    <TextWrapper>
                      {!!stakedBalance0Inline ? stakedBalance0Inline.toSignificant(4) : '-'}
                    </TextWrapper>
                  )}
                  <TextWrapper>
                    { poolTokenPercentage0 
                      ? (poolTokenPercentage0.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage0.toFixed(2)) + '%'
                      : '-'}
                  </TextWrapper>
                  {token00Deposited ? (
                        <TextWrapper>
                          {token00Deposited?.toSignificant(6, undefined, Rounding.ROUND_HALF_UP)}
                        </TextWrapper>
                    ) : ('-')}

                  {token01Deposited ? (
                        <TextWrapper>
                          {token01Deposited?.toSignificant(6, undefined, Rounding.ROUND_HALF_UP)}
                        </TextWrapper>
                    ) : ('-')}

                </ColumnCenter>
              </Row>
              <Row>
                <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                  <RowFixed>
                    <DoubleCurrencyLogo currency0={currency1} currency1={currency0} margin={false} size={16} />
                    <TextWrapper>
                      <strong>{currency1?.getSymbol(chainId)}/{currency0?.getSymbol(chainId)}</strong>
                    </TextWrapper>
                  </RowFixed>
                  <TextWrapper>
                    <strong>{totalPoolTokens1 ? totalPoolTokens1.toSignificant(6) : '-'}</strong>
                  </TextWrapper>
                  <TextWrapper>
                    {userPoolBalance1 ? userPoolBalance1.toSignificant(6) : '-'}
                  </TextWrapper>
                  {(!!stakedBalance0Inline || !!stakedBalance1Inline) && (
                    <TextWrapper>
                      {!!stakedBalance1Inline ? stakedBalance1Inline.toSignificant(4) : '-'}
                    </TextWrapper>
                  )}
                  <TextWrapper>
                    { poolTokenPercentage1 
                      ? (poolTokenPercentage1.toFixed(2) === '0.00' ? '<0.01' : poolTokenPercentage1.toFixed(2)) + '%'
                      : '-'}
                  </TextWrapper>
                  {token11Deposited ? (
                    <TextWrapper>
                      {token11Deposited?.toSignificant(6, undefined, Rounding.ROUND_HALF_UP)}
                    </TextWrapper>
                  ) : (
                    '-'
                  )}
                  {token10Deposited ? (
                    <TextWrapper>
                      {token10Deposited?.toSignificant(6, undefined, Rounding.ROUND_HALF_UP)}
                    </TextWrapper>
                  ) : (
                    '-'
                  )}
                </ColumnCenter>
              </Row>
            </FullPositionWrapper>

            { ( (userPoolBalance0 && JSBI.greaterThan(userPoolBalance0.raw, BIG_INT_ZERO)) ||
                (userPoolBalance1 && JSBI.greaterThan(userPoolBalance1.raw, BIG_INT_ZERO)) )
              && (
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

            { ( ( stakedBalance0Inline && JSBI.greaterThan(stakedBalance0Inline.raw, BIG_INT_ZERO) ) ||
                ( stakedBalance1Inline && JSBI.greaterThan(stakedBalance1Inline.raw, BIG_INT_ZERO) ) ) && (
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                as={Link}
                to={`/fesw/${currencyId(currency0)}/${currencyId(currency1)}`}
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


//<ButtonSecondaryPosition padding="8px" borderRadius="8px">
//<ExternalLink
//  style={{ width: '100%', textAlign: 'center' }}
//  href={`https://info.feswap.io/account/${account}`}
//>
//  View accrued fees and analytics<span style={{ fontSize: '11px' }}> ↗</span>
//</ExternalLink>
//</ButtonSecondaryPosition>