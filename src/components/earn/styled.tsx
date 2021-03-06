import React from 'react'
import styled from 'styled-components'
import { AutoColumn } from '../Column'
import { TokenAmount } from '@feswap/sdk'

import uImage from '../../assets/images/big_unicorn.png'
import xlUnicorn from '../../assets/images/xl_uni.png'
import noise from '../../assets/images/noise.png'
import { Text } from 'rebass'
import { LightCard, PageCard } from '../Card'
import { transparentize } from 'polished'

export const TextBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  width: fit-content;
  justify-self: flex-end;
`

export const DataCard = styled(AutoColumn)<{ disabled?: boolean }>`
  border-radius: 10px;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
`

export const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
  overflow: hidden;
`

//background: radial-gradient(76.02% 75.41% at 1.84% 0%, #ff007a 0%, #2172e5 100%);

export const CardBGImage = styled.span<{ desaturate?: boolean }>`
  background: url(${uImage});
  width: 1000px;
  height: 600px;
  position: absolute;
  border-radius: 12px;
  opacity: 0.4;
  top: -100px;
  left: -100px;
  transform: rotate(-15deg);
  user-select: none;

  ${({ desaturate }) => desaturate && `filter: saturate(0)`}
`

export const CardBGImageSmaller = styled.span<{ desaturate?: boolean }>`
  background: url(${xlUnicorn});
  width: 1200px;
  height: 1200px;
  position: absolute;
  border-radius: 12px;
  top: -300px;
  left: -300px;
  opacity: 0.4;
  user-select: none;

  ${({ desaturate }) => desaturate && `filter: saturate(0)`}
`

export const CardNoise = styled.span`
  background: url(${noise});
  background-size: cover;
  mix-blend-mode: overlay;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  opacity: 0.15;
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
`

export const CardSection = styled(AutoColumn)<{ disabled?: boolean }>`
  padding: 1em;
  z-index: 1;
  opacity: ${({ disabled }) => disabled && '0.4'};
`

export const Break = styled.div`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  height: 1px;
`

export const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
  position: relative;
  overflow: hidden;
`

export const StyledPageCard = styled(PageCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(80% 100% at 10% 0%, ${transparentize(0.8, bgColor)} 20%, ${'#eaeafb'} 80%) `};
  position: relative;
  overflow: hidden;
`

//export const StyledPageCard = styled(PageCard)<{ bgColor: any }>`
//  border: none;
//  background: ${({ theme, bgColor }) =>
//    `radial-gradient(80% 100% at 10% 0%, ${transparentize(0.8, bgColor)} 20%, ${'#eaeafb'} 80%) `};
//  position: relative;
//  overflow: hidden;
//`


const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 280px;
  text-overflow: ellipsis;
  font-size: 36px;
  font-weight: 600;
  color:  ${({ theme }) => theme.text1};
`

export function Balance({ balance }: { balance: TokenAmount | undefined }) {
  return <StyledBalanceText title={balance?.toExact()}>{balance?.toSignificant(6)??'-'}</StyledBalanceText>
}


