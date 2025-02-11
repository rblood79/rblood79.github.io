import _ from 'lodash';
import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import context from '../component/Context';
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import { onSnapshot, query, orderBy, where} from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  const state = useContext(context);
  const location = useLocation();
  const history = useHistory();
  const { year } = state;

  const [data, setData] = useState([]);
  const [result, setResult] = useState([]);
  const [filters, setFilters] = useState({
    startYear: 'all',
    endYear: 'all',
    startcompresult: 'all',
    endcompresult: 'all',
    startResult: 'all',
    endResult: 'all',
    startResult2: 'all',
    endResult2: 'all',
    regNum: '',
    regTitle: '',
    regLeader: '',
    regEndCompYear: '',
    regEndYear: '',
    regColor: 'all'
  });



  const { startYear, endYear, startcompresult, endcompresult, startResult, endResult, startResult2, endResult2, regTitle, regLeader, regEndCompYear, regEndYear, regColor } = filters;

  // 필터 중 하나라도 활성화되었는지 확인하는 유틸리티 함수
  /*
  const isFilterActive = () => {
    return [
      regNum, regTitle, regEndCompYear, regLeader, regEndYear,
      startYear !== 'all', endYear !== 'all',
      startcompresult !== 'all', endcompresult !== 'all',
      startResult !== 'all', endResult !== 'all',
      startResult2 !== 'all', endResult2 !== 'all',
      regColor !== 'all'
    ].some(value => value && value !== '');
  };
  */

  // 필터가 활성화되었는지 확인
  //const filterActive = useMemo(isFilterActive, [endResult, endResult2, endYear, endcompresult, regColor, regEndCompYear, regEndYear, regLeader, regNum, regTitle, startResult, startResult2, startYear, startcompresult]);

  const tableRef = useRef(null);

  const startCompResultArray = ["완료", "조건부완료", "중단", "연장", "미평가"];
  const endCompResultArray = ["완료", "조건부완료", "중단", "연장", "1차완료", "미평가"];
  const startResultArray = ["인증", "인증 (대상)", "인증 (금상)", "인증 (은상)", "인증 (동상)", "인증 (장려)", "미인증 (중단)", "미인증 (재도전)"];
  const endResultArray = ["인증", "인증 (대상)", "인증 (금상)", "인증 (은상)", "인증 (동상)", "인증 (장려)", "미인증 (중단)", "1차인증"];
  const colorArray = ["all", "", "red", "green", "yellow"];

  const minYear = year.min;
  const maxYear = year.max;
  const colCount = year.count;

  const style = useMemo(() => {
    return {
      table: {
        width: "100%",
        height: "1px",
        borderCollapse: "collapse",
        border: "2px solid #000",
        backgroundColor: "#fff",
        fontSize: "13px",
        tableLayout: "fixed",
        caption: {
          fontSize: "21px",
          fontWeight: "600",
          padding: "16px",
          textAlign: "center",
          height: "96px",
        },
        w70: {
          width: "70px"
        },
        w50: {
          width: "50px"
        },
        w48: {
          width: "48px"
        },
        w54: {
          width: "54px"
        },
        w167: {
          width: "167px"
        },
        w285: {
          width: "285px"
        },
        td: {
          border: isMobile ? "1px solid #d3d3d3" : "0.5pt solid #d3d3d3",
          fontWeight: "400",
          padding: "2px",
          height: "51px",
          minHeight: "51px",
          textAlign: "center",
          wordBreak: "keep-all",
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        },
        th: {
          background: "#efefef",
          fontWeight: "600",
          borderBottom: isMobile ? "1px solid #ccc" : "0.5pt solid #ccc",
        },
        thE: {
          width: isMobile ? "0pt" : "0.5pt",
        },
        tdE: {
          height: "51px",
          minHeight: "51px",
        },
        
        tdRed: {
          background: "#D01414",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.3)" : "0.5pt solid rgba(0,0,0,0.3)",
        },
        tdGreen: {
          background: "#20D067",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.3)" : "0.5pt solid rgba(0,0,0,0.3)",
        },
        tdYellow: {
          background: "#EFD214",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.3)" : "0.5pt solid rgba(0,0,0,0.3)",
        },
        tdNormal: {
          background: "#efefef",
          borderBottom: isMobile ? "1px solid rgba(0,0,0,0.3)" : "0.5pt solid rgba(0,0,0,0.3)",
        }
      }
    };
  }, []);

  const numbertoCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  const useYearRange = useCallback((start, end) => {
    const yearArray = [];
    for (let year = start; year <= end; year++) {
      yearArray.push(year.toString());
    }
    return yearArray;
  }, []);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // 정렬 기준 변수를 추가합니다. 초기값은 'ID'로 설정합니다.
  const [sortKey, setSortKey] = useState('ID');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' for ascending, 'desc' for descending

  // 정렬 함수
  const sortResults = useCallback((data) => {
    return data.sort((a, b) => {
      const valueA = a[sortKey] || '';
      const valueB = b[sortKey] || '';

      let comparison = 0;
      if (sortKey === "DATE") {
        comparison = new Date(valueA) - new Date(valueB);
      } else if (typeof valueA === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA > valueB ? 1 : (valueA < valueB ? -1 : 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortKey, sortOrder]);

  // 클릭 시 정렬 기준 및 방향 변경
  const handleSort = (key) => {
    /*if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }*/
  };

  const renderSortIcon = (key) => {
    if (sortKey === key) {
      return sortOrder === 'asc' ? < i className="ri-sort-asc" /> : < i className="ri-sort-desc" />;
    }
    return null;
  };

  const memoizedResult = useMemo(() => {
    const filtered = _.filter(data, function (o) {
      const isNumMatch = !filters.regNum || o.ID.includes(filters.regNum);
      const isTitleMatch = !filters.regTitle || o.TITLE.replace(/\s+/g, '').includes(filters.regTitle.replace(/\s+/g, ''));
      const isEndCompYearMatch = !filters.regEndCompYear || o.ENDCOMPYEAR.replace(/\s+/g, '').includes(filters.regEndCompYear.replace(/\s+/g, ''));
      const isLeaderMatch = !filters.regLeader || o.LEADER.replace(/\s+/g, '').includes(filters.regLeader.replace(/\s+/g, ''));
      const isColorMatch = filters.regColor === 'all' || o.COLOR === filters.regColor;
      const isDateMatch = (filters.startYear === 'all' || (o.STARTCOMPYEAR >= filters.startYear && o.STARTCOMPYEAR <= filters.endYear)) && (filters.endYear === 'all' || (o.STARTCOMPYEAR <= filters.endYear));
      const isStartCompResultMatch = filters.startcompresult === 'all' || o.STARTCOMPRESULT === filters.startcompresult;
      const isEndCompResultMatch = filters.endcompresult === 'all' || o.ENDCOMPRESULT === filters.endcompresult;
      const isDateMatch2 = (filters.startResult === 'all' || (o.STARTYEAR >= filters.startResult && o.STARTYEAR <= filters.endResult)) && (filters.endResult === 'all' || (o.STARTYEAR <= filters.endResult));
      const isStartResultMatch = filters.startResult2 === 'all' || o.STARTRESULT === filters.startResult2;
      const isEndYearMatch = !filters.regEndYear || o.ENDYEAR.replace(/\s+/g, '').includes(filters.regEndYear);
      const isEndResultMatch = filters.endResult2 === 'all' || o.ENDRESULT === filters.endResult2;

      return isNumMatch && isTitleMatch && isLeaderMatch && isColorMatch && isEndCompYearMatch && isDateMatch && isStartCompResultMatch && isEndCompResultMatch && isDateMatch2 && isStartResultMatch && isEndYearMatch && isEndResultMatch;
    });
    return sortResults(filtered); // 필터링된 결과를 선택된 기준으로 정렬
  }, [data, filters, sortResults]);

  const handleSearch = useCallback(() => {
    setResult(memoizedResult);
  }, [memoizedResult]);


  const onDownload = useCallback(() => {
    const table = tableRef.current.cloneNode(true);
    const colgroup = table.querySelector('colgroup');
    const cols = colgroup.querySelectorAll('col');
    cols[cols.length - 2].remove();
    cols[cols.length - 1].remove();
    table.querySelectorAll('.printHide').forEach(el => el.remove());
    table.querySelectorAll('.editTd').forEach(el => el.remove());
    table.querySelectorAll('.detailTd').forEach(el => el.remove());

    let xData = `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head>
                <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>과제관리대장</x:Name>
                                <x:WorksheetOptions>
                                    <x:Panes></x:Panes>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
            </head>
            <body>${table.outerHTML}</body>
        </html>
    `;

    const fileName = moment(new Date()).format("YYYYMMDD");
    const blob = new Blob([xData], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = "과제관리" + fileName + ".xls";
    a.click();
  }, [tableRef]);

  const onLoad = useCallback(() => {
    const q = query(props.manage, where("ID", "!=", ""), orderBy("ID", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const manageDoc = [];
      querySnapshot.forEach((doc) => {
        manageDoc.push({ ...doc.data(), id: doc.id });
      });
      setData(manageDoc);
    });
    return unsubscribe;
  }, [props.manage]);

  useEffect(() => {
    const unsubscribe = onLoad();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onLoad]);

  useEffect(() => {
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortKey, sortOrder]);

  useEffect(() => {
    // location.state에 searchState가 있을 경우 상태를 복원
    if (location.state && location.state.searchState) {
      const { searchState } = location.state;
      setFilters({
        startYear: searchState.startYear || 'all',
        endYear: searchState.endYear || 'all',
        startcompresult: searchState.startcompresult || 'all',
        endcompresult: searchState.endcompresult || 'all',
        startResult: searchState.startResult || 'all',
        endResult: searchState.endResult || 'all',
        startResult2: searchState.startResult2 || 'all',
        endResult2: searchState.endResult2 || 'all',
        regNum: searchState.regNum || '',
        regTitle: searchState.regTitle || '',
        regLeader: searchState.regLeader || '',
        regEndCompYear: searchState.regEndCompYear || '',
        regEndYear: searchState.regEndYear || '',
        regColor: searchState.regColor || 'all'
      });
      setSortKey(searchState.sortKey || 'ID')
      setSortOrder(searchState.sortOrder || "asc")
    }

    // 데이터가 있을 경우에만 handleSearch 호출
    //data.length > 0 ? handleSearch() : onLoad();
    if (data.length > 0) {
      handleSearch();
      // history의 상태를 초기화
      history.replace();
    } else {
      onLoad();
    }
    // useEffect 종속성 배열
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length, history, location.state, onLoad]);
  //}, [data.length, handleSearch, history, location.state, onLoad]);

  
  /*
  const resetFilters = useCallback(() => {
    setFilters({
      startYear: 'all',
      endYear: 'all',
      startcompresult: 'all',
      endcompresult: 'all',
      startResult: 'all',
      endResult: 'all',
      startResult2: 'all',
      endResult2: 'all',
      regNum: '',
      regTitle: '',
      regLeader: '',
      regEndCompYear: '',
      regEndYear: '',
      regColor: 'all'
    });
  }, []);
  */

  const onPrint = () => {
    const table = tableRef.current;
    const colgroup = table.querySelector('colgroup');
    const cols = colgroup.querySelectorAll('col');
    const originalWidths = [cols[cols.length - 2].getAttribute('width'), cols[cols.length - 1].getAttribute('width')];

    cols[cols.length - 2].setAttribute('width', '0px');
    cols[cols.length - 1].setAttribute('width', '0px');

    const style = document.createElement('style');
    style.media = 'print';
    style.innerHTML = `
        body{
          background: #fff;
          padding: 0mm !important;
        }
        table {
          font-size: 10px !important;
          table-layout: auto !important;
          border: 0 !important;
        }
        th, td {
          border-color: #303038 !important;
        }
        @page {
            
        }
    `;
/*
@page {
    size: A3 landscape !important;
    margin: 10mm !important;
}
*/
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);

    cols[cols.length - 2].setAttribute('width', originalWidths[0]);
    cols[cols.length - 1].setAttribute('width', originalWidths[1]);
  }

  const onEdit = useCallback((item) => {
    history.push({
      pathname: '/write',
      state: {
        from: location.pathname,
        userCell: item.ID,
        searchState: { ...filters, sortKey, sortOrder },
      }
    });
  }, [history, location.pathname, filters, sortKey, sortOrder]);

  const onView = useCallback((item) => {
    history.push({
      pathname: '/view',
      state: {
        from: location.pathname,
        userCell: item.ID,
        searchState: { ...filters, sortKey, sortOrder },
      }
    });
  }, [history, location.pathname, filters, sortKey, sortOrder]);


  const ItemList = useCallback(({ data }) => {
    const indiArray = data.INDI ? data.INDI.split('\n').slice(0, colCount) : [];
    const unitArray = data.UNIT ? data.UNIT.split('\n') : [];
    const d0Array = data.DATAY0 ? data.DATAY0.split('\n') : [];
    const d1Array = data.DATAY1 ? data.DATAY1.split('\n') : [];
    const d2Array = data.DATAY2 ? data.DATAY2.split('\n') : [];
    const d3Array = data.DATAY3 ? data.DATAY3.split('\n') : [];
    const d4Array = data.DATAY4 ? data.DATAY4.split('\n') : [];
    const d5Array = data.DATAY5 ? data.DATAY5.split('\n') : [];
    const rspan = indiArray.length > 0 ? indiArray.length : 1;

    return (
      <>
        <tr>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.ID}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.CHECKNUM}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w50)}>{data.LEADER}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w285)}>{data.TITLE}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.STARTCOMPYEAR}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.STARTCOMPRESULT}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.ENDCOMPYEAR}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.ENDCOMPRESULT}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.STARTYEAR}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.STARTRESULT}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.ENDYEAR}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{data.ENDRESULT}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.td, style.table.w70)}>{numbertoCommas(data.RESULT)}</td>
          <td rowSpan={rspan} style={Object.assign({}, style.table.w54,
            data.COLOR === 'red'
              ? style.table.tdRed
              : data.COLOR === 'green'
                ? style.table.tdGreen
                : data.COLOR === 'yellow'
                  ? style.table.tdYellow
                  : style.table.tdNormal)}></td>
          <td style={Object.assign({}, style.table.td, style.table.w167)}>{indiArray[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w48)}>{unitArray[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d0Array[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d1Array[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d2Array[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d3Array[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d4Array[0]}</td>
          <td style={Object.assign({}, style.table.td, style.table.w54)}>{d5Array[0]}</td>
          <td className='editTd' onClick={() => onEdit(data)}><i className="ri-edit-fill"></i></td>
          <td className='detailTd' onClick={() => onView(data)}><i className="ri-printer-fill"></i></td>
        </tr>
        {indiArray.slice(1).map((indi, index) => (
          <tr key={`list${index + 1}`}>
            <td style={Object.assign({}, style.table.td, style.table.w167)}>{indi}</td>
            <td style={Object.assign({}, style.table.td, style.table.w48)}>{unitArray[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d0Array[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d1Array[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d2Array[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d3Array[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d4Array[index + 1]}</td>
            <td style={Object.assign({}, style.table.td, style.table.w54)}>{d5Array[index + 1]}</td>
            <td className='printHide bRight'></td>
            <td className='printHide bRight'></td>
          </tr>
        ))}
      </>
    );
  }, [colCount, onEdit, onView, style.table.td, style.table.tdGreen, style.table.tdNormal, style.table.tdRed, style.table.tdYellow, style.table.w167, style.table.w285, style.table.w48, style.table.w50, style.table.w54, style.table.w70]);

  return (
    <div className='resultContainer'>
      <div className='users'>
        <div className='resultHead'>
          <h2 className='title'>과제등록현황<span className='titleSub'>- 전체 {data.length} 중 {result.length}건</span></h2>
          <div className='resultRight'></div>
        </div>

        <div>
          <div style={{ display: data.length > 0 ? 'block' : 'none' }}>



            <div className='searchForm'>
              <div className='searchGroup'>
                {/*
                  <div className='formWrap'>
                    <label className='label' htmlFor='SORT'>정렬기준</label>
                    <select id="SORT" onChange={(e) => setSortKey(e.target.value)} value={sortKey || "default"}>
                      <option value="ID">관리번호</option>
                      <option value="DATE">등록일</option>
                    </select>
                  </div>
                */}
                <div className='formWrap span2'>
                  <label className='label' htmlFor='RT'>과제명</label>
                  <input
                    type='text'
                    id='RT'
                    name="regTitle"
                    placeholder=""
                    onChange={handleFilterChange}
                    value={regTitle}
                  />
                </div>
                <div className='formWrap'>
                  <label className='label' htmlFor='RL'>팀장</label>
                  <input
                    type='text'
                    id="RL"
                    name="regLeader"
                    placeholder=""
                    onChange={handleFilterChange}
                    value={regLeader}
                  />
                </div>
                <div className='formWrap'>
                  <div className='label'>사후관리상태</div>
                  <div className='radioGroup'>
                    {colorArray.map((item, index) => (
                      <div key={item + index}><input type='radio' name='regColor' id={item + index} value={item} onChange={handleFilterChange} checked={regColor === item} /><label htmlFor={item + index} className={'radioColor ' + item}></label></div>
                    ))}
                  </div>
                </div>
                <div className='formWrap'>
                  <label className='label' htmlFor='SY'>1차 완료평가연도</label>
                  <select id="SY" name="startYear" onChange={handleFilterChange} value={startYear}>
                    <option value="all">전체</option>
                    {useYearRange(minYear, maxYear).map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                  <span className='space' style={{ display: startYear === 'all' && 'none' }}>~</span>
                  <select id="EY" name="endYear" onChange={handleFilterChange} value={endYear} style={{ display: startYear === 'all' && 'none' }}>

                    {useYearRange(startYear, maxYear).map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className='formWrap'>
                  <label className='label' htmlFor='SCR'>1차 완료평가결과</label>
                  <select id="SCR" name="startcompresult" onChange={handleFilterChange} value={startcompresult}>
                    <option value="all">전체</option>
                    {startCompResultArray.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className='formWrap'>
                  <label className='label' htmlFor='RECY'>2차 완료평가연도</label>
                  <input
                    type='text'
                    id='RECY'
                    name="regEndCompYear"
                    placeholder=""
                    onChange={handleFilterChange}
                    value={regEndCompYear}
                  />
                </div>
                <div className='formWrap'>
                  <label className='label' htmlFor='ECR'>2차 완료평가결과</label>
                  <select id="ECR" name="endcompresult" onChange={handleFilterChange} value={endcompresult}>
                    <option value="all">전체</option>
                    {endCompResultArray.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className='formWrap borderBottom'>
                  <label className='label' htmlFor='SR'>1차 성과평가연도</label>
                  <select id="SR" name="startResult" onChange={handleFilterChange} value={startResult}>
                    <option value="all">전체</option>
                    {useYearRange(minYear, maxYear).map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                  <span className='space' style={{ display: startResult === 'all' && 'none' }}>~</span>
                  <select id="ER" name="endResult" onChange={handleFilterChange} value={endResult} style={{ display: startResult === 'all' && 'none' }}>

                    {useYearRange(startResult, maxYear).map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className='formWrap borderBottom'>
                  <label className='label' htmlFor='SR2'>1차 성과평가결과</label>
                  <select id="SR2" name="startResult2" onChange={handleFilterChange} value={startResult2}>
                    <option value="all">전체</option>
                    {startResultArray.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className='formWrap borderBottom'>
                  <label className='label' htmlFor='REY'>2차 성과평가연도</label>
                  <input
                    type='text'
                    id='REY'
                    name="regEndYear"
                    placeholder=""
                    onChange={handleFilterChange}
                    value={regEndYear}
                  />
                </div>
                <div className='formWrap borderBottom'>
                  <label className='label' htmlFor='ER2'>2차 성과평가결과</label>
                  <select id="ER2" name="endResult2" onChange={handleFilterChange} value={endResult2}>
                    <option value="all">전체</option>
                    {endResultArray.map((item) => (
                      <option value={item} key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className='controll'>
              <div className='buttonContainer'>
                {/*<button className="button reset" onClick={resetFilters} title="검색 조건 초기화" >초기화</button>*/}
                <button className="button search" onClick={handleSearch}>검색</button>
                {!isMobile && (
                  <>
                    <button className="button excel" onClick={onDownload} title="Excel다운로드" disabled={result.length <= 0}>엑셀저장</button>
                    <button className="button print" onClick={onPrint} title="관리대장인쇄" disabled={result.length <= 0}>인쇄</button>
                  </>
                )}
              </div>
            </div>

          </div>
          <div className='tableContents list'>
            <table ref={tableRef} style={style.table}>
              <colgroup>
                <col width="70px" />
                <col width="70px" />
                <col width="50px" />
                <col width="285px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="70px" />
                <col width="54px" />
                <col width="167px" />
                <col width="48px" />
                <col width="54px" />
                <col width="54px" />
                <col width="54px" />
                <col width="54px" />
                <col width="54px" />
                <col width="54px" />
                <col width={isMobile ? "54px" : "34px"} />
                <col width={isMobile ? "54px" : "34px"} />
              </colgroup>

              <thead>
                <tr className='hidePrint'>
                  <td colSpan="22" style={style.table.caption} className='caption'>과제관리대장</td>
                </tr>
                <tr>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("ID") }}>관리번호{renderSortIcon("ID")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("CHECKNUM") }}>확인번호{renderSortIcon("CHECKNUM")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w50)} onClick={() => { handleSort("LEADER") }}>팀장{renderSortIcon("LEADER")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w285)} onClick={() => { handleSort("TITLE") }}>과제명{renderSortIcon("TITLE")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)} onClick={() => { handleSort("STARTCOMPYEAR") }}>1차완료<br />평가연도{renderSortIcon("STARTCOMPYEAR")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("STARTCOMPRESULT") }}>1차완료<br />평가결과{renderSortIcon("STARTCOMPRESULT")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("ENDCOMPYEAR") }}>2차완료<br />평가연도{renderSortIcon("ENDCOMPYEAR")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("ENDCOMPRESULT") }}>2차완료<br />평가결과{renderSortIcon("ENDCOMPRESULT")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)} onClick={() => { handleSort("STARTYEAR") }}>1차성과<br />평가연도{renderSortIcon("STARTYEAR")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("STARTRESULT") }}>1차성과<br />평가결과{renderSortIcon("STARTRESULT")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("ENDYEAR") }}>2차성과<br />평가연도{renderSortIcon("ENDYEAR")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("ENDRESULT") }}>2차성과<br />평가결과{renderSortIcon("ENDRESULT")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w70)} onClick={() => { handleSort("RESULT") }}>재무성과<br />(백만원){renderSortIcon("RESULT")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)} onClick={() => { handleSort("COLOR") }}>사후<br />관리상태{renderSortIcon("COLOR")}</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w167)}>관리지표</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w48)}>단위</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>수치</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>Y+1</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>Y+2</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>Y+3</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>Y+4</th>
                  <th style={Object.assign({}, style.table.td, style.table.th, style.table.w54)}>Y+5</th>
                  <th style={Object.assign({}, style.table.td, style.table.th)} className='printHide'>수정</th>
                  <th style={Object.assign({}, style.table.td, style.table.th)} className='printHide'>출력</th>
                </tr>
              </thead>
              <tbody>
                {result.length > 0 ? result.map((item) => (
                  <ItemList key={item.ID + item.DATE} data={item} />
                )) : <tr><td colSpan={isMobile ? "24px" : "22px"} style={style.table.tdE}>자료가 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
