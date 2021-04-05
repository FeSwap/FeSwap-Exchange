import React from 'react'
//import logo from './logo.svg'
import styled from 'styled-components'
import './App.css'
import Header from '../components/Header'
import Web3ReactManager from '../components/Web3ReactManager'
import Web3Status from '../components/Web3Status'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 100px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    padding-top: 2rem;
  `};

  z-index: 1;
`

const Marginer = styled.div`
  margin-top: 5rem;
`


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
      </header>

        <>
        <HeaderWrapper>
            <Header />
        </HeaderWrapper>
        <body>
              <Web3ReactManager>
              <Web3Status />
              </Web3ReactManager>
        </body>
        </>

    </div>
  )
}

export default App
