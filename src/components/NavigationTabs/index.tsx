import React from 'react'
import styled from 'styled-components'
//import { darken } from 'polished'
//import { useTranslation } from 'react-i18next'
import { TYPE } from '../../theme'
import { Link as HistoryLink } from 'react-router-dom'
import { StyledPageHeader } from '../PageHeader'

import { ArrowLeft } from 'react-feather'
import Row, { RowBetween, RowFixed } from '../Row'
import QuestionHelper from '../QuestionHelper'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  border-radius: 3rem;
  justify-content: space-evenly;
`

const StyledArrowLeft = styled(ArrowLeft)`
  color: ${({ theme }) => theme.text1};
`
const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

export function FindPoolTabs() {
  return (
    <StyledPageHeader>
      <RowBetween>
        <RowFixed>
          <HistoryLink  to="/pool">
            <StyledArrowLeft fontWeight={500} style={{marginRight:'24px'}} />
          </HistoryLink>
          <TYPE.black fontWeight={500}>Import Pool</TYPE.black>
        </RowFixed>
        <QuestionHelper text={"Use this tool to find pairs that don't automatically appear in the interface."} />
      </RowBetween>
    </StyledPageHeader>
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
              ? 'When you add liquidity, you are given pool tokens representing your position. These tokens automatically earn liquidity fees proportional to your share of the pool, and can be redeemed at any time.'
              : 'Removing pool tokens converts your position back into underlying tokens at the current rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.'
          }
        />
      </RowBetween>
    </StyledPageHeader>
  )
}

export function CreateProposalTabs() {
  return (
    <Tabs>
      <Row style={{ padding: '1rem 1rem 0 1rem' }}>
        <HistoryLink to="/vote">
          <StyledArrowLeft />
        </HistoryLink>
        <ActiveText style={{ marginLeft: 'auto', marginRight: 'auto' }}>Create Proposal</ActiveText>
      </Row>
    </Tabs>
  )
}

