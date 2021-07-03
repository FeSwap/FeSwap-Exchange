import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import Nft from './index'

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
export function RedirectNftCheckSingleId(props: RouteComponentProps<{ currencyIdA: string }>) {
  const {
    match: {
      params: { currencyIdA }
    }
  } = props
  const match = currencyIdA.match(ADDRESS_REGEX)
  if ( (match?.length) || currencyIdA==='ETH') {
    return <Nft {...props} />
  }
  return <Redirect to={`/nft`} />
}

export function RedirectNftCheckTwoIds(props: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const {
    match: {
      params: { currencyIdA, currencyIdB }
    }
  } = props
  if (currencyIdA.toLowerCase() === currencyIdB.toLowerCase()) {
    return <Redirect to={`/nft/${currencyIdA}`} />
  }
  return <Nft {...props} />
}
