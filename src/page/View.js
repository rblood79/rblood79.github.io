import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import moment from "moment";
import * as XLSX from 'xlsx';
import { factoryOrder, rankOrder } from '../utils/sortOrders';
import Chart from 'chart.js/auto';

// 공장별 아이콘 및 배경 매핑 (최적화)
const teamIconMapping = {
  "기체정비공장": "ri-plane-fill",
  "기관정비공장": "ri-git-merge-line",
  "부품정비공장": "ri-settings-line",
  "특수제작공장": "ri-tools-fill",
  "KF-16 성능개량공장": "ri-dashboard-2-line"
};
const teamBgMapping = {
  "기체정비공장": "#c0504e",
  "기관정비공장": "#f79645",
  "부품정비공장": "#4cacc6",
  "특수제작공장": "#00b04f",
  "KF-16 성능개량공장": "#8064a2"
};

// 추가: 모든 일자의 answers에서 test_1, test_2만 추출하는 헬퍼 함수
/*const getTestAnswers = (answers) => {
  if (!answers) return {};
  const result = {};
  Object.keys(answers).forEach(date => {
    const day = answers[date];
    ['test_1', 'test_2'].forEach(testId => {
      if (day[testId]) {
        if (!result[date]) result[date] = {};
        result[date][testId] = day[testId];
      }
    });
  });
  return result;
};*/

// 추가: 단일 테스트 데이터만 추출하는 헬퍼 함수 정의
const getSingleTestAnswers = (answers, testId) => {
  if (!answers) return {};
  const result = {};
  Object.keys(answers).forEach(date => {
    const day = answers[date];
    if (day[testId]) {
      result[date] = day[testId];
    }
  });
  return result;
};

// 추가: 선택된 사용자의 단일 테스트 데이터 값을 모두 더하는 헬퍼 함수
const sumTestAnswers = (answers) => {
  const result = {};
  Object.keys(answers).forEach(date => {
    const inner = answers[date];
    const sum = Object.values(inner).reduce((acc, val) => acc + Number(val), 0);
    result[date] = sum;
  });
  return result;
};

const App = (props) => {

  // 선택한 질문 ID와 사용자 답변 리스트 상태
  const [selectedQuestionId] = useState("0"); // 예시: "0"번 질문
  // 추가: 전체 원본 answers 데이터를 포함하여 저장 (selectedAnswers와 fullAnswers)
  const [userAnswers, setUserAnswers] = useState([]);
  const [noUser, setNoUser] = useState([]);
  // 추가: 선택된 팀 상태
  const [selectedTeam, setSelectedTeam] = useState(null);
  // 새로 추가: 날짜 상태 (기본값 "오늘날짜")
  const today = moment().format("YYYY-MM-DD");
  const [selectDay, setSelectDay] = useState(today);
  // 추가: 선택된 사용자의 answers 데이터를 저장할 state
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  const [points, setPoints] = useState({
    test_1: 0,
    test_2: 0
  });

  useEffect(() => {
    async function fetchUserDocs() {
      try {
        const doc1Ref = doc(props.manage, "test_1");
        const doc2Ref = doc(props.manage, "test_2");

        const [doc1Snap, doc2Snap] = await Promise.all([
          getDoc(doc1Ref),
          getDoc(doc2Ref)
        ]);

        const newPoints = {
          test_1: doc1Snap.exists() ? doc1Snap.data().test_point : 0,
          test_2: doc2Snap.exists() ? doc2Snap.data().test_point : 0
        };
        setPoints(newPoints);
        //console.log("Fetched points:", points.test_2);
      } catch (error) {
        console.error("Error fetching test points", error);
      }
    }
    fetchUserDocs();
  }, [props.manage]);

  // selectedTeam 이 변경될 때 selectedUserDetail 을 초기화하는 useEffect
  useEffect(() => {
    setSelectedUserDetail(null);
  }, [selectedTeam]);

  const handleBackClick = useCallback(() => {
    setSelectedTeam(null);
  }, []);

  // handleExcelClick 을 useCallback 으로 최적화
  const handleExcelClick = useCallback(async () => {
    try {
      let allTestIds = new Set();
      const usersRef = collection(props.manage, "meta", "users");
      const querySnapshot = await getDocs(usersRef);
      const results = [];
      let counter = 1; // 순번 시작값

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.team && data.team.toLowerCase() === "admin") return;
        const { answers, ...rest } = data;

        // 각 테스트별 total 점수를 저장할 객체
        const testTotals = {};
        if (answers && answers[selectDay]) {
          const dayAnswers = answers[selectDay];
          // dayAnswers 객체의 각 testId에 대해 total 점수 계산
          Object.keys(dayAnswers).forEach(testId => {
            allTestIds.add(testId);
            testTotals[testId] = dayAnswers[testId]
              ? Object.values(dayAnswers[testId]).reduce((acc, cur) => acc + Number(cur), 0)
              : 0;
          });
        }

        // password 컬럼 제거 및 키명 변경 처리
        const newData = Object.assign({}, rest, testTotals, { id: docSnap.id });
        delete newData.password;

        newData["아이디"] = newData.id;
        delete newData.id;

        newData["작업자"] = newData.name;
        delete newData.name;

        newData["계급"] = newData.rank;
        delete newData.rank;

        newData["공장명"] = newData.team;
        delete newData.team;

        // 테스트별 컬럼명 생성 및 데이터 할당
        const orderedData = { "순번": counter++, "아이디": newData["아이디"], "공장명": newData["공장명"], "계급": newData["계급"], "작업자": newData["작업자"] };
        Object.keys(testTotals).forEach(testId => {
          orderedData[`${testId}점수`] = newData[testId];
          delete newData[testId];
        });

        results.push(orderedData);
      });

      // 그룹핑: 공장명 별로 rows 분리
      const grouped = {};
      results.forEach(row => {
        const key = row["공장명"] || "미지정";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(row);
      });

      const workbook = XLSX.utils.book_new();
      // 시트 이름 매핑
      const sheetNameMapping = {
        "기체정비공장": "기체",
        "기관정비공장": "기관",
        "부품정비공장": "부품",
        "특수제작공장": "제작",
        "KF-16 성능개량공장": "성능"
      };

      const teamOrder = ["기체정비공장", "기관정비공장", "부품정비공장", "특수제작공장", "KF-16 성능개량공장"];
      teamOrder.forEach(team => {
        const group = team;
        const rows = grouped[group] || [];
        const sheetName = sheetNameMapping[group] || group;
        const sortedRows = rows.sort((a, b) => {
          const rankDiff = (rankOrder[a["계급"]] ?? 99) - (rankOrder[b["계급"]] ?? 99);
          if (rankDiff !== 0) return rankDiff;
          return (a["작업자"] || "").localeCompare(b["작업자"] || "");
        });
        sortedRows.forEach((row, index) => row["순번"] = index + 1);

        // 엑셀 헤더 동적 생성
        const headerRow0 = [selectDay, "", "", "", "", "", ""];
        const headerRow = ["순번", "아이디", "공장명", "계급", "작업자", "정신건강", "신체건강"];
        const dataRows = sortedRows.map(row => {
          return [
            row["순번"],
            row["아이디"],
            row["공장명"],
            row["계급"],
            row["작업자"],
            row["test_1점수"],
            row["test_2점수"],
            //...Array.from(allTestIds).map(testId => row[`${testId} 점수`])
          ];
        });
        const aoaData = [headerRow0, headerRow, ...dataRows];

        const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
        // 첫 행 병합
        worksheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
        // 열 너비 설정
        worksheet["!cols"] = [
          { wch: 9 },
          { wch: 12 },
          { wch: 18 },
          { wch: 10 },
          { wch: 9 },
          ...Array.from(allTestIds).map(() => ({ wch: 9 }))
        ];
        // 셀 스타일 적용
        for (const cell in worksheet) {
          if (cell[0] === '!') continue;
          worksheet[cell].s = {
            font: { name: "맑은고딕", sz: 10 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { auto: 1 } },
              bottom: { style: "thin", color: { auto: 1 } },
              left: { style: "thin", color: { auto: 1 } },
              right: { style: "thin", color: { auto: 1 } }
            }
          };
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      XLSX.writeFile(workbook, `report_${selectDay}.xlsx`);
    } catch (error) {
      console.error("Excel fetch error", error);
    }
  }, [props.manage, selectDay]);

  // "meta/users" 컬렉션에서 선택한 질문에 답한 사용자들 fetch 및 fullAnswers 저장
  useEffect(() => {
    async function fetchUserAnswers() {
      try {
        const usersRef = collection(props.manage, "meta", "users");
        const querySnapshot = await getDocs(usersRef);

        const filtered = [];
        const missing = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          // 팀이 admin 인 경우 제외
          if (data.team && data.team.toLowerCase() === "admin") return;
          // 날짜 기준으로 답변이 있는지 확인
          if (data.answers && data.answers[selectDay]) {
            const dayAnswers = data.answers[selectDay];
            const key = String(selectedQuestionId);
            const combined = {};
            // selectedAnswers: 해당 질문의 답만, fullAnswers: 원본 전체 answers
            Object.entries(dayAnswers).forEach(([testId, testAnswers]) => {
              if (testAnswers.hasOwnProperty(key)) {
                combined[testId] = testAnswers[key];
              }
            });
            if (Object.keys(combined).length > 0) {
              filtered.push({
                id: docSnap.id,
                selectedAnswers: combined,
                fullAnswers: dayAnswers,
                ...data
              });
            } else {
              missing.push({ id: docSnap.id, ...data });
            }
          } else {
            missing.push({ id: docSnap.id, ...data });
          }
        });
        setUserAnswers(filtered);
        setNoUser(missing);
      } catch (error) {
        console.error('사용자 답변 fetch 에러', error);
      }
    }
    fetchUserAnswers();
  }, [props.manage, selectedQuestionId, selectDay]);

  // 팀별 통계 데이터 계산 (teamStats) - fullAnswers 기준
  const teamStats = useMemo(() => {
    const stats = {};
    userAnswers.forEach(u => {
      const team = u.team || "미지정";
      if (!stats[team]) {
        stats[team] = {};
      }
      Object.keys(u.fullAnswers).forEach(testId => {
        if (!stats[team][testId]) {
          stats[team][testId] = 0;
        }
        const total = Object.values(u.fullAnswers[testId]).reduce((acc, val) => acc + val, 0);

        // 특정 점수 이상인 경우 통계에 반영
        /*if (testId === "test_1" && total >= points.test_1) {
          stats[team][testId]++;
        } else if (testId === "test_2" && total >= points.test_2) {
          stats[team][testId]++;
        } else if (total >= 50) {
          stats[team][testId]++;
        }*/
        if (testId === "test_1" && total >= points.test_1) {
          stats[team][testId]++;
        } else if (testId === "test_2" && total >= points.test_2) {
          stats[team][testId]++;
        }
      });
    });
    return stats;
  }, [userAnswers, points.test_1, points.test_2]);

  // 새로 추가: mentalData 및 physicalData 계산
  const testData = useCallback((selectedTeam, testId, threshold) => {
    const arr = userAnswers.filter(u =>
      u.team === selectedTeam &&
      u.fullAnswers[testId] &&
      Object.values(u.fullAnswers[testId]).reduce((acc, val) => acc + val, 0) >= threshold
    );
    return {
      count: arr.length,
      details: arr.map(u => {
        const total = Object.values(u.fullAnswers[testId]).reduce((acc, val) => acc + val, 0);
        return { text: `${u.rank} ${u.name} (${total}점)`, user: u };
      })
    };
  }, [userAnswers]);

  // 추가: 선택된 사용자 데이터가 변경될 때 차트를 생성하는 useEffect 추가 (clean-up 포함)
  useEffect(() => {
    let chartInstance;
    if (selectedUserDetail && selectedUserDetail.answers && Object.keys(selectedUserDetail.answers).length > 0) {
      //console.log("차트 데이터", selectedUserDetail);
      const sumData = sumTestAnswers(selectedUserDetail.answers);
      const sortedLabels = Object.keys(sumData).sort((a, b) => new Date(a) - new Date(b));
      const sortedData = sortedLabels.map(date => sumData[date]);
      //console.log(sortedData)
      const ctx = document.getElementById("userDetailChart");
      if (ctx) {
        chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: sortedLabels,
            datasets: [{
              label: selectedUserDetail.type,
              data: sortedData,
              backgroundColor: "rgba(255, 0, 0, 0.6)",
              borderColor: "rgb(235, 18, 18)",
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              x: {
                title: { display: false },
                ticks: {
                  callback: function (value, index, values) {
                    const total = values.length;
                    const mid = Math.floor((total - 1) / 2);
                    if (total >= 7) {
                      if (index === 0 || index === mid || index === total - 1) {
                        const date = this.getLabelForValue(value);
                        return moment(date).format('MM-DD');
                      }
                      return '';
                    }
                    const date = this.getLabelForValue(value);
                    return moment(date).format('MM-DD');
                  }
                }
              },
              y: {
                /*grid: {
                  color: function (context) {
                    if (context.tick.value === 10) {
                      return '#ff0000';
                    }
                    return '#efefef';
                  },
                },*/
                title: { display: false },
                beginAtZero: true,
              }
            },
            plugins: {
              title: {
                display: false,
              }
            }
          }
        });
      }
    }
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    }
  }, [selectedUserDetail]);

  return (
    <div className='view'>
      <div className='users'>
        <div className='controll calendar'>

          <button className='button teamBack' onClick={handleBackClick}>
            <i className="ri-arrow-left-s-line"></i>
          </button>

          {/* 새로 추가: 날짜 선택 input */}
          <div className="day-selector">

            <input
              type="date"
              id="selectDay"
              className='dayInput'
              value={selectDay}
              onChange={(e) => {
                setSelectDay(e.target.value);
                setSelectedTeam(null);
              }}
            />
          </div>
          <button className='button excel' onClick={handleExcelClick}>
            <i className="ri-file-excel-2-line"></i>
          </button>
        </div>

        <div className='tableContents'>

          <section
            id='section0'
            className={`teamStatsSection${selectedTeam ? " active" : ""}`}
          >
            {/* team 기준 통계 데이터 표시 + 클릭 시 선택 처리 */}
            {['기체정비공장', '기관정비공장', '부품정비공장', '특수제작공장', 'KF-16 성능개량공장'].map(team => {
              const counts = teamStats[team] || {};
              const iconClass = teamIconMapping[team] || 'ri-flight-takeoff-line';
              const backgroundColor = teamBgMapping[team] || '#fff';
              return (
                <div
                  key={team}
                  className='teamStats'
                  style={{
                    background: selectedTeam === team ? backgroundColor : '#fff',
                    color: selectedTeam === team ? '#fff' : '#000',
                    aspectRatio: selectedTeam ? 0 : undefined,
                  }}
                  onClick={() => setSelectedTeam(selectedTeam === team ? null : team)}
                >
                  <i className={iconClass} style={{ color: selectedTeam === team ? '#fff' : '#a6a6a6' }}></i>
                  <h3
                    className='teamStatsText'
                    style={{

                      margin: selectedTeam ? 0 : undefined,
                      color: selectedTeam === team ? '#fff' : backgroundColor,
                    }}
                  >
                    {selectedTeam
                      ? (team === "기체정비공장"
                        ? "기체"
                        : team === "기관정비공장"
                          ? "기관"
                          : team === "부품정비공장"
                            ? "부품"
                            : team === "특수제작공장"
                              ? "제작"
                              : team === "KF-16 성능개량공장"
                                ? "성능"
                                : team)
                      : (team === "기체정비공장"
                        ? "기체정비"
                        : team === "기관정비공장"
                          ? "기관정비"
                          : team === "부품정비공장"
                            ? "부품정비"
                            : team === "특수제작공장"
                              ? "특수제작"
                              : team === "KF-16 성능개량공장"
                                ? "성능개량"
                                : team)}
                  </h3>
                  {/* test_type 별로 통계 데이터 표시 */}
                  {Object.keys(counts)
                    .sort((a, b) => {
                      const order = { test_1: 0, test_2: 1 };
                      return (order[a] ?? 99) - (order[b] ?? 99);
                    })
                    .map(testId => (
                      <p
                        key={testId}
                        className='teamStatsMen'
                      >
                        {`${testId === 'test_1' ? '정신건강' : testId === 'test_2' ? '신체건강' : testId} (${counts[testId]}명)`}
                      </p>
                    ))}
                </div>
              );
            })}
          </section>

          <section id='section2'>
            {selectedTeam ? (
              <div>
                <h3 className='teamStatsTitle teamStatsRe'>{selectedTeam}의 테스트 분석표</h3>
                <table className='noUserTable'>
                  <colgroup>
                    <col style={{ width: '150px' }} />
                    <col style={{ width: 'auto' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>명단</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{`정신건강:${testData(selectedTeam, "test_1", points.test_1).count}명`}</td>
                      <td>
                        {testData(selectedTeam, "test_1", points.test_1).details.map((item, index) => (
                          <span
                            className={`teamStatsUser${selectedUserDetail && selectedUserDetail.number === item.user.number && selectedUserDetail.type === "정신건강" ? " active" : ""}`}
                            key={index}
                            onClick={() => {
                              if (
                                selectedUserDetail &&
                                selectedUserDetail.number === item.user.number &&
                                selectedUserDetail.type === "정신건강"
                              ) {
                                setSelectedUserDetail(null);
                              } else {
                                setSelectedUserDetail({
                                  name: item.user.name,
                                  number: item.user.number,
                                  type: "정신건강",
                                  answers: getSingleTestAnswers(item.user.answers, "test_1")
                                });
                              }
                            }}
                          >
                            {item.text}
                          </span>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <td>{`신체건강:${testData(selectedTeam, "test_2", points.test_2).count}명`}</td>
                      <td>
                        {testData(selectedTeam, "test_2", points.test_2).details.map((item, index) => (
                          <span
                            className={`teamStatsUser${selectedUserDetail && selectedUserDetail.number === item.user.number && selectedUserDetail.type === "신체건강" ? " active" : ""}`}
                            key={index}
                            onClick={() => {
                              if (
                                selectedUserDetail &&
                                selectedUserDetail.number === item.user.number &&
                                selectedUserDetail.type === "신체건강"
                              ) {
                                setSelectedUserDetail(null);
                              } else {
                                setSelectedUserDetail({
                                  name: item.user.name,
                                  number: item.user.number,
                                  type: "신체건강",
                                  answers: getSingleTestAnswers(item.user.answers, "test_2")
                                });
                              }
                            }}
                          >
                            {item.text}
                          </span>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {selectedUserDetail && (
                  <table className='noUserTable'>
                    <thead>
                      <tr>
                        <th>{selectedUserDetail.name ? selectedUserDetail.number + " / " + selectedUserDetail.name + "님의 " + selectedUserDetail.type : "선택된 사용자"} 추세</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className='chartContainer'>
                          <canvas id="userDetailChart"></canvas>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
                <table className='noUserTable'>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: 'auto' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>구분</th>
                      <th>기준점수</th>
                      <th>내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>정신건강</td>
                      <td>{points.test_1}점 이상</td>
                      <td rowSpan={2}>피로도가 매우 높은 수준으로 정비활동에 뚜렷한 영향을 끼칠수 있음</td>
                    </tr>
                    <tr>
                      <td>신체건강</td>
                      <td>{points.test_2}점 이상</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section id='section3'>
            <h3 className='teamStatsTitle teamStatsUniq'>
              {selectedTeam ? selectedTeam : '전체'} (
              {selectedTeam
                ? [...userAnswers, ...noUser].filter(u => u.team === selectedTeam).length
                : [...userAnswers, ...noUser].length}명)
            </h3>
            {(() => {
              const combinedUsers = [...userAnswers, ...noUser];
              const sortedUsers = (selectedTeam
                ? combinedUsers.filter(u => u.team === selectedTeam)
                : combinedUsers)
                .sort((a, b) => {
                  const factoryDiff = (factoryOrder[a.team] ?? 99) - (factoryOrder[b.team] ?? 99);
                  if (factoryDiff !== 0) return factoryDiff;
                  const rankDiff = (rankOrder[a.rank] ?? 99) - (rankOrder[b.rank] ?? 99);
                  if (rankDiff !== 0) return rankDiff;
                  return (a.name || "").localeCompare(b.name || "");
                });
              return sortedUsers.length > 0 ? (
                <table className='noUserTable'>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: '52px' }} />
                    <col style={{ width: '40px' }} />
                    <col style={{ width: '40px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>공장명</th>
                      <th>계급</th>
                      <th>작업자</th>
                      <th>정신</th>
                      <th>신체</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map(u => {
                      const mentalScore = u.fullAnswers && u.fullAnswers.test_1
                        ? Object.values(u.fullAnswers.test_1).reduce((acc, curr) => acc + Number(curr), 0)
                        : "-";
                      const physicalScore = u.fullAnswers && u.fullAnswers.test_2
                        ? Object.values(u.fullAnswers.test_2).reduce((acc, curr) => acc + Number(curr), 0)
                        : "-";
                        return (
                        <tr key={u.id}>
                          <td>{u.number}</td>
                          <td>{
                          u.team === "기체정비공장"
                            ? "기체"
                            : u.team === "기관정비공장"
                            ? "기관"
                            : u.team === "부품정비공장"
                              ? "부품"
                              : u.team === "특수제작공장"
                              ? "제작"
                              : u.team === "KF-16 성능개량공장"
                                ? "성능"
                                : u.team
                          }</td>
                          <td>{u.rank}</td>
                          <td>{u.name}</td>
                          <td className={
                          mentalScore >= points.test_1
                            ? "red"
                            : mentalScore >= points.test_1 * 0.5
                            ? "yellow"
                            : mentalScore > 0
                            ? "green"
                                  : undefined
                          }><div className={mentalScore >= points.test_1 ? 'active':undefined}>{mentalScore}</div></td>
                          <td className={
                          physicalScore >= points.test_2
                            ? "red"
                            : physicalScore >= points.test_2 * 0.5
                            ? "yellow"
                            : physicalScore > 0
                            ? "green"
                                  : undefined
                          }><div className={physicalScore >= points.test_2 ? 'active':undefined}>{physicalScore}</div></td>
                        </tr>
                        );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className='answerCrear'>모든 사용자의 정보가 없습니다.</p>
              );
            })()}
          </section>

          <section id='section4'>
            <h3 className='teamStatsTitle teamStatsUniq'>
              {selectedTeam ? selectedTeam : '전체'} 미작성자 ({selectedTeam ? noUser.filter(u => u.team === selectedTeam).length : noUser.length}명)
            </h3>
            {(() => {
              const sortedNoUser = (selectedTeam ? noUser.filter(u => u.team === selectedTeam) : noUser)
                .sort((a, b) => {
                  const factoryDiff = (factoryOrder[a.team] ?? 99) - (factoryOrder[b.team] ?? 99);
                  if (factoryDiff !== 0) return factoryDiff;
                  const rankDiff = (rankOrder[a.rank] ?? 99) - (rankOrder[b.rank] ?? 99);
                  if (rankDiff !== 0) return rankDiff;
                  return (a.name || "").localeCompare(b.name || "");
                });
              return sortedNoUser.length > 0 ? (
                <table className='noUserTable'>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '128px' }} />
                    <col style={{ width: 'auto' }} />
                    <col style={{ width: 'auto' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>공장명</th>
                      <th>계급</th>
                      <th>작업자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNoUser.map(u => (
                      <tr key={u.id} >
                        <td>{u.number}</td>
                        <td>{u.team}</td>
                        <td>{u.rank}</td>
                        <td>{u.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className='answerCrear'>모든 사용자가 답변을 하였습니다.</p>
              );
            })()}
          </section>

        </div>

      </div>
    </div>
  );
}

export default App;
