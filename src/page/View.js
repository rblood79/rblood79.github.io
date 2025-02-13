import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory, useLocation } from "react-router-dom";
import { doc, getDoc } from 'firebase/firestore';
import context from '../component/Context';
import logo from '../assets/logo.svg';

const App = (props) => {
  const state = useContext(context);
  const location = useLocation();
  const history = useHistory();
  const { user } = state;


  const tableRef = useRef();

  

  

  const onBack = useCallback(() => {
    history.push({
      pathname: '/',
      state: location.state
    });
  }, [history, location.state]);

  const onPrint = useCallback(() => {
    const style = document.createElement('style');
    style.media = 'print';
    style.innerHTML = `
      body {
        background: #fff;
        padding: 0mm;
        height: 100% !important;
      }
      table {
        height: calc(297mm - 20mm) !important;
      }
      @page {
      
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, []);
/*
@page {
  size: A4 portrait !important;
  margin: 10mm !important;
}
*/
  return (
    <div className='view'>
      <div className='users'>
        <div className='controll'>
          <div className='buttonContainer'>
            <button className={'button back'} onClick={onBack}>이전</button>
            {!isMobile && <button className={'button'} onClick={onPrint}>인쇄</button>}
          </div>
        </div>

        <div className='tableContents'>
          <section>
            <table ref={tableRef} >
              <colgroup>
                <col width={isMobile ? "16px" : "24px"} />
                <col width="auto" />
                <col width="auto" />
                <col width="auto" />
                <col width="auto" />
                <col width={isMobile ? "16px" : "24px"} />
              </colgroup>
              
            </table>
          </section>
          
        </div>

      </div>
    </div>
  );
}

export default App;
