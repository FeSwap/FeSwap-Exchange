import React from 'react'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'

const StyledPageHeader = styled.div`
  padding: 1rem 1rem 0.3rem 1rem;
  margin-bottom: 6px;
  width: 100%;
  max-width: 420px;
  font-size:  150%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  color: ${({ theme }) => theme.text2};
`
interface PageHeaderProps {
  header: string
  children?: React.ReactNode
}

export default function PageHeader({header, children}:PageHeaderProps) {
  return (
    <StyledPageHeader>
      <RowBetween>
        <TYPE.black fontWeight={500}>{header}</TYPE.black>
        {children}
      </RowBetween>
    </StyledPageHeader>
  )
}
