import React from 'react'
import styled from 'styled-components'
import { CardProps, Text } from 'rebass'
import { Box } from 'rebass/styled-components'
import { transparentize } from 'polished'

const Card = styled(Box)<{ padding?: string; border?: string; borderRadius?: string }>`
  width: 100%;
  border-radius: 8px;
  padding: 8px 12px 8px 12px;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const PageCard = styled(Card)`
  border-radius: 16px;
  padding: 0px 0px 0px 0px;
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const TransparentCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg5};
  background-color: transparent
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => transparentize(0.2,theme.bg2)};
`

export const LightGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg3};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.yellow2};
  font-weight: 500;
`

export const PinkCard = styled(Card)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.primary1};
  font-weight: 500;
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  color: ${({ theme }) => theme.primary1};
  border-radius: 8px;
  width: fit-content;
`

export const BlueCard = ({ children, ...rest }: CardProps) => {
  return (
    <BlueCardStyled {...rest}>
      <Text fontWeight={400} color="#2172E5">
        {children}
      </Text>
    </BlueCardStyled>
  )
}
