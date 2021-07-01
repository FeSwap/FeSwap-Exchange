import React from 'react'
import styled from 'styled-components'
//import { darken } from 'polished'
//import { useTranslation } from 'react-i18next'
import { TYPE } from '../../theme'
import { Link as HistoryLink } from 'react-router-dom'
import { StyledPageHeader } from '../PageHeader'

import { ArrowLeft } from 'react-feather'
import { RowBetween, RowFixed } from '../Row'
import QuestionHelper from '../QuestionHelper'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`

export function FindPoolTabs() {
  return (
    <Tabs>
      <RowBetween style={{ padding: '1rem' }}>
        <HistoryLink  to="/pool">
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText>Import Pool</ActiveText>
        <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({ adding, creating }: { adding: boolean; creating: boolean }) {
  return (
    <StyledPageHeader>
      <RowBetween>
        <RowFixed>
          <HistoryLink to="/pool">
            <StyledArrowLeft fontWeight={500} style={{marginRight:'24px'}} />
          </HistoryLink> 
          <TYPE.black fontWeight={500}>{creating ? 'Create a pair' : adding ? 'Add Liquidity' : 'Remove Liquidity'}</TYPE.black>
        </RowFixed>
         <QuestionHelper
          text={
            adding
              ? 'When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn fees proportional to your share of the pool, and can be redeemed at any time.'
              : 'Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.'
          }
        />
      </RowBetween>
    </StyledPageHeader>
  )
}
