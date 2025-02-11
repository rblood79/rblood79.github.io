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

  const [data, setData] = useState(null);
  const [startcompyear, setStartcompyear] = useState(null);
  const [startcompresult, setStartcompresult] = useState(null);
  const [endcompresult, setEndcompresult] = useState(null);
  const [startyear, setStartyear] = useState(null);
  const [startresult, setStartresult] = useState(null);
  const [endresult, setEndresult] = useState(null);

  const tableRef = useRef();

  const memoizedInputs = useMemo(() => ({
    id: data?.ID || "",
    checknum: data?.CHECKNUM || "",
    leader: data?.LEADER || "",
    title: data?.TITLE || "",
    endcompyear: data?.ENDCOMPYEAR || "",
    endyear: data?.ENDYEAR || "",
    result: data?.RESULT || "",
    indi: data?.INDI?.split('\n') || [],
    unit: data?.UNIT?.split('\n') || [],
    datay0: data?.DATAY0?.split('\n') || [],
    datay1: data?.DATAY1 || "",
    datay2: data?.DATAY2 || "",
    datay3: data?.DATAY3 || "",
    datay4: data?.DATAY4 || "",
    datay5: data?.DATAY5 || "",
    before: data?.BEFORE || "",
    after: data?.AFTER || "",
    other: data?.OTHER || ""
  }), [data]);

  const [inputs, setInputs] = useState(memoizedInputs);
  const { id, checknum, leader, title, endcompyear, endyear, result, indi, unit, datay0, before, after, other } = inputs;

  const numbertoCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  //const tempHeight = isMobile ? "48px" : "56px";

  const style = useMemo(() => ({
    table: {
      width: isMobile ? "100%" : "210mm",
      height: isMobile ? "100%" : "297mm",
      borderCollapse: "separate",
      borderSpacing: 0,
      border: "2px solid #000",
      backgroundColor: "#f3f3f3",
      fontSize: "13px",
      lineHeight: "26px",
      tableLayout: "fixed",
      backgroundImage: `url(${logo})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "36%",
      backgroundBlendMode: "luminosity",
      th: {
        fontWeight: "600",
        padding: "4px 8px",
        height: "68px",
        wordBreak: "keep-all",
        fontSize: "14px",
        textDecoration: "underline",
        textUnderlineOffset: "4px",
      },
      td: {
        padding: isMobile ? "4px 16px" : "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",
        borderRight: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tdM: {
        padding: "0px 16px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
      },
      tdMB: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
      },
      tdR: {
        borderRadius: "8px",
        borderTop: "1px solid rgba(0,0,0,0.16)",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
        verticalAlign: "top",
        padding: "16px",
        height: "168px"
      },
      tdEnd: {
        height: "auto"
      },
      tdT: {
        borderRadius: "8px 8px 0 0",
        borderTop: "1px solid rgba(0,0,0,0.16)",
        paddingTop: isMobile ? "16px" : "0px",
      },
      tdU: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRadius: "0 0 8px 8px",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
        paddingBottom: isMobile ? "16px" : "0px",
      },
      tdML: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tdMR: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRight: "1px solid rgba(0,0,0,0.16)",
      },
      tdTL: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRadius: "8px 0 0 0",
        borderTop: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tdTR: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRadius: "0 8px 0 0",
        borderTop: "1px solid rgba(0,0,0,0.16)",
        borderRight: "1px solid rgba(0,0,0,0.16)",
      },
      tdBL: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRadius: "0 0 0 8px",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tdBR: {
        padding: "0px 16px",
        //height: tempHeight,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",

        borderRadius: "0 0 8px 0",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
        borderRight: "1px solid rgba(0,0,0,0.16)",
      },
      tdBP: {
        padding: "0px 0px 16px 16px",
      },
      tdS: {
        height: isMobile ? "16px" : "24px"
      },
      tdB: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
      tdZ: {
        padding: "8px 21px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",
        borderRadius: "0 0 8px 8px",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
        borderRight: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tde: {
        padding: "6px 36px",
        //height: tempHeight,
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRight: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
      },
      tde2: {
        padding: "6px 36px",
        //height: tempHeight,
        wordBreak: "keep-all",
        textAlign: "left",
        //letterSpacing: "1.2pt",
        borderRadius: "0 0 8px 8px",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRight: "1px solid rgba(0,0,0,0.16)",
        borderLeft: "1px solid rgba(0,0,0,0.16)",
        borderBottom: "1px solid rgba(0,0,0,0.16)",
      },
      tdI: {
        padding: "0px 16px 0px 32px",
        verticalAlign: "top",
      },
      foot: {
        height: isMobile ? "16px" : "24px",
        textAlign: "center",
        fontSize: "12px",
        lineHeight: "0px"
      }
    }
  }), []);

  const loadData = useCallback(async () => {
    if (location.state) {
      const docRef = doc(props.manage, location.state.userCell);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        console.log("No such document!");
      }
    }
  }, [location.state, props.manage]);

  useEffect(() => {
    if (data) {
      setInputs(memoizedInputs);
      setStartcompyear(data.STARTCOMPYEAR);
      setStartcompresult(data.STARTCOMPRESULT);
      setEndcompresult(data.ENDCOMPRESULT);
      setStartyear(data.STARTYEAR);
      setStartresult(data.STARTRESULT);
      setEndresult(data.ENDRESULT);
    }
  }, [data, memoizedInputs]);

  useEffect(() => {
    if (!user) {
      history.push('/');
    } else {
      loadData();
    }
  }, [user, history, loadData]);

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
            <table ref={tableRef} style={style.table}>
              <colgroup>
                <col width={isMobile ? "16px" : "24px"} />
                <col width="auto" />
                <col width="auto" />
                <col width="auto" />
                <col width="auto" />
                <col width={isMobile ? "16px" : "24px"} />
              </colgroup>
              <thead>
                <tr>
                  <th style={style.table.th} colSpan={6}>{title}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td></td><td style={Object.assign({}, style.table.td, style.table.tdT)} colSpan={4}>■ 관리번호&nbsp;:&nbsp;{id}</td><td></td>
                </tr>
                <tr>
                  <td></td><td style={style.table.td} colSpan={4}>■ 확인번호&nbsp;:&nbsp;{checknum}</td><td></td>
                </tr>
                <tr>
                  <td></td><td style={Object.assign({}, style.table.td, style.table.tdU)} colSpan={4}>■ 팀장&nbsp;:&nbsp;{leader}</td><td></td>
                </tr>
                <tr>
                  <td style={style.table.tdS} colSpan={6}></td>
                </tr>
                {isMobile ? (
                  <>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.td, style.table.tdT)} colSpan={4}>■ 1차완료 평가연도&nbsp;:&nbsp;{startcompyear}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 1차완료 평가결과&nbsp;:&nbsp;{startcompresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 2차완료 평가연도&nbsp;:&nbsp;{endcompyear}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 2차완료 평가결과&nbsp;:&nbsp;{endcompresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 1차 성과 평가연도&nbsp;:&nbsp;{startyear}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 1차 성과 평가결과&nbsp;:&nbsp;{startresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 2차 성과 평가연도&nbsp;:&nbsp;{endyear}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.td, style.table.tdU)} colSpan={4}>■ 2차 성과 평가결과&nbsp;:&nbsp;{endresult}</td><td></td>
                    </tr>
                    <tr>
                      <td style={style.table.tdS} colSpan={6}></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.td, style.table.tdT)} colSpan={4}>■ 재무성과(백만원)&nbsp;:&nbsp;{numbertoCommas(result)}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 관리지표 1&nbsp;:&nbsp;{indi[0]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdML, style.table.tdI)} colSpan={2}>○ 단위&nbsp;:&nbsp;{unit[0]}</td><td style={Object.assign({}, style.table.tdMR)} colSpan={2}>○ 수치&nbsp;:&nbsp;{datay0[0]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 관리지표 2&nbsp;:&nbsp;{indi[1]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdML, style.table.tdI)} colSpan={2}>○ 단위&nbsp;:&nbsp;{unit[1]}</td><td style={Object.assign({}, style.table.tdMR)} colSpan={2}>○ 수치&nbsp;:&nbsp;{datay0[1]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.td} colSpan={4}>■ 관리지표 3&nbsp;:&nbsp;{indi[1]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdBL, style.table.tdBP, style.table.tdI)} colSpan={2}>○ 단위&nbsp;:&nbsp;{unit[2]}</td><td style={Object.assign({}, style.table.tdBR, style.table.tdBP)} colSpan={2}>○ 수치&nbsp;:&nbsp;{datay0[2]}</td><td></td>
                    </tr>
                  </>
                ) : (
                  <>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdTL)} colSpan={2}>■ 1차완료 평가연도&nbsp;:&nbsp;{startcompyear}</td><td style={Object.assign({}, style.table.tdTR)} colSpan={2}>■ 1차완료 평가결과&nbsp;:&nbsp;{startcompresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdML)} colSpan={2}>■ 2차완료 평가연도&nbsp;:&nbsp;{endcompyear}</td><td style={Object.assign({}, style.table.tdMR)} colSpan={2}>■ 2차완료 평가결과&nbsp;:&nbsp;{endcompresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdML)} colSpan={2}>■ 1차 성과 평가연도&nbsp;:&nbsp;{startyear}</td><td style={Object.assign({}, style.table.tdMR)} colSpan={2}>■ 1차 성과 평가결과&nbsp;:&nbsp;{startresult}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.tdBL)} colSpan={2}>■ 2차 성과 평가연도&nbsp;:&nbsp;{endyear}</td><td style={Object.assign({}, style.table.tdBR)} colSpan={2}>■ 2차 성과 평가결과&nbsp;:&nbsp;{endresult}</td><td></td>
                    </tr>
                    <tr>
                      <td style={style.table.tdS} colSpan={6}></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.td, style.table.tdT)} colSpan={4}>■ 재무성과(백만원)&nbsp;:&nbsp;{numbertoCommas(result)}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.tdML} colSpan={2}>■ 관리지표 1&nbsp;:&nbsp;{indi[0]}</td><td style={style.table.tdM} >○ 단위&nbsp;:&nbsp;{unit[0]}</td><td style={style.table.tdMR} >○ 수치&nbsp;:&nbsp;{datay0[0]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.tdML} colSpan={2}>■ 관리지표 2&nbsp;:&nbsp;{indi[1]}</td><td style={style.table.tdM} >○ 단위&nbsp;:&nbsp;{unit[1]}</td><td style={style.table.tdMR} >○ 수치&nbsp;:&nbsp;{datay0[1]}</td><td></td>
                    </tr>
                    <tr>
                      <td></td><td style={style.table.tdBL} colSpan={2}>■ 관리지표 3&nbsp;:&nbsp;{indi[2]}</td><td style={style.table.tdMB} >○ 단위&nbsp;:&nbsp;{unit[2]}</td><td style={style.table.tdBR} >○ 수치&nbsp;:&nbsp;{datay0[2]}</td><td></td>
                    </tr>

                  </>
                )}
                <tr>
                  <td style={style.table.tdS} colSpan={6}></td>
                </tr>
                <tr>
                  <td></td><td style={Object.assign({}, style.table.td, style.table.tdR)} colSpan={4}>■ 개선 전 주요내용&nbsp;:&nbsp;{before}</td><td></td>
                </tr>
                <tr>
                  <td style={style.table.tdS} colSpan={6}></td>
                </tr>
                <tr>
                  <td></td><td style={Object.assign({}, style.table.td, style.table.tdR)} colSpan={4}>■ 개선 후 주요내용&nbsp;:&nbsp;{after}</td><td></td>
                </tr>
                {
                  isMobile && other &&
                  <>
                    <tr>
                      <td style={style.table.tdS} colSpan={6}></td>
                    </tr>
                    <tr>
                      <td></td><td style={Object.assign({}, style.table.td, style.table.tdR)} colSpan={4}>■ 기타내용&nbsp;:&nbsp;{other}</td><td></td>
                    </tr>
                  </>
                }
                <tr>
                  <th></th><th colSpan={4} style={style.table.foot} className='pageNum'>{!isMobile && (other ? "1 / 2" : "1 / 1")}</th><th></th>
                </tr>
              </tbody>
            </table>
          </section>
          {
            !isMobile && other &&
            <section>
              <table style={style.table}>
                <colgroup>
                  <col width={isMobile ? "16px" : "24px"} />
                  <col width="auto" />
                  <col width="auto" />
                  <col width="auto" />
                  <col width="auto" />
                  <col width={isMobile ? "16px" : "24px"} />
                </colgroup>

                <thead>
                  <tr>
                    <th style={style.table.th} colSpan={6}>{title}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td><td style={Object.assign({}, style.table.td, style.table.tdR, style.table.tdEnd)} colSpan={4}>■ 기타내용&nbsp;:&nbsp;{other}</td><td></td>
                  </tr>
                  <tr>
                    <th></th><th colSpan={4} style={style.table.foot} className='pageNum'>{!isMobile && "2 / 2"}</th><th></th>
                  </tr>
                </tbody>
              </table>
            </section>
          }
        </div>

      </div>
    </div>
  );
}

export default App;
