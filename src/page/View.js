import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import moment from "moment";
import * as XLSX from 'xlsx';

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

  // excel 버튼 클릭 시 호출: 선택된 날짜의 모든 사용자 정보를 조회하여 
  // answers 의 "test_1" 및 "test_2" 합계를 구하여 데이터에 추가하고 console 에 보여줌
  const handleExcelClick = async () => {
    try {
      const usersRef = collection(props.manage, "meta", "users");
      const querySnapshot = await getDocs(usersRef);
      const results = [];
      let counter = 1; // 순번 시작값

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        // "admin" 팀인 경우 제외
        if (data.team && data.team.toLowerCase() === "admin") return;
        // answers 객체는 결과에 포함하지 않음
        const { answers, ...rest } = data;

        let totalTest1 = null;
        let totalTest2 = null;
        if (answers && answers[selectDay]) {
          const dayAnswers = answers[selectDay];
          totalTest1 = dayAnswers.test_1
            ? Object.values(dayAnswers.test_1).reduce((acc, cur) => acc + Number(cur), 0)
            : 0;
          totalTest2 = dayAnswers.test_2
            ? Object.values(dayAnswers.test_2).reduce((acc, cur) => acc + Number(cur), 0)
            : 0;
        }

        // password 컬럼 제거 및 키명 변경 처리
        const newData = { ...rest, totalTest1, totalTest2, id: docSnap.id };
        delete newData.password;

        newData["아이디"] = newData.id;
        delete newData.id;

        // "작업자" -> "작성자" 로 변경
        newData["작성자"] = newData.name;
        delete newData.name;

        newData["계급"] = newData.rank;
        delete newData.rank;

        newData["공장명"] = newData.team;
        delete newData.team;

        newData["정신건강"] = newData.totalTest1;
        delete newData.totalTest1;

        newData["신체건강"] = newData.totalTest2;
        delete newData.totalTest2;

        // 원하는 순서대로 키를 재조합
        const orderedData = {
          "순번": counter++,
          "아이디": newData["아이디"],
          "공장명": newData["공장명"],
          "계급": newData["계급"],
          "작성자": newData["작성자"],
          "정신건강": newData["정신건강"],
          "신체건강": newData["신체건강"]
        };

        results.push(orderedData);
      });
      console.log("Excel Data:", results);

      // XLSX 라이브러리를 이용하여 results 데이터를 .xlsx 파일로 다운로드
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(results);

      // 각 열의 너비를 순서대로 72, 97, 129, 69, 72, 72, 72 로 설정
      worksheet["!cols"] = [
        { wch: 8.38 },  // 순번
        { wch: 11.50 },  // 아이디
        { wch: 15.50 }, // 공장명
        { wch: 8.00 },  // 계급
        { wch: 8.38 },  // 작성자
        { wch: 8.38 },  // 정신건강
        { wch: 8.38 }   // 신체건강
      ];

      // 모든 셀에 대해 폰트, 크기, 가운데 정렬 지정
      for (const cell in worksheet) {
        if (cell[0] === '!') continue;
        worksheet[cell].s = {
          font: { name: "맑은고딕", sz: 10 },
          alignment: { horizontal: "center" }
        };
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
      XLSX.writeFile(workbook, `ExcelData_${selectDay}.xlsx`);
    } catch (error) {
      console.error("Excel fetch error", error);
    }
  };

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
    //console.log(userAnswers)
    userAnswers.forEach(u => {
      const team = u.team || "미지정";
      if (!stats[team]) {
        stats[team] = { test_1: 0, test_2: 0 };
      }
      if (u.fullAnswers.test_1) {
        const totalTest1 = Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0);
        if (totalTest1 >= 10) {
          stats[team].test_1++;
        }
      }
      if (u.fullAnswers.test_2) {
        const totalTest2 = Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0);
        if (totalTest2 >= 76) {
          stats[team].test_2++;
        }
      }
    });
    return stats;
  }, [userAnswers]);


  // 새로 추가: mentalData 및 physicalData 계산
  const mentalData = selectedTeam ? (() => {
    const arr = userAnswers.filter(u =>
      u.team === selectedTeam &&
      u.fullAnswers.test_1 &&
      Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0) >= 10
    );
    return {
      count: arr.length,
      details: arr.map(u => {
        const total = Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0);
        return `${u.rank} ${u.name} (${total}점)`;
      }).join(', ')
    };
  })() : { count: 0, details: '' };

  const physicalData = selectedTeam ? (() => {
    const arr = userAnswers.filter(u =>
      u.team === selectedTeam &&
      u.fullAnswers.test_2 &&
      Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0) >= 76
    );
    return {
      count: arr.length,
      details: arr.map(u => {
        const total = Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0);
        return `${u.rank} ${u.name} (${total}점)`;
      }).join(', ')
    };
  })() : { count: 0, details: '' };


  return (
    <div className='view'>
      <div className='users'>
        <div className='controll'>

          {/* 새로 추가: 날짜 선택 input */}
          <div className="day-selector">

            <input
              type="date"
              id="selectDay"
              className='dayInput'
              value={selectDay}
              onChange={(e) => setSelectDay(e.target.value)}
            />
          </div>
          <button className='excel' onClick={handleExcelClick}>
            <i className="ri-file-excel-2-line"></i>
          </button>
        </div>

        <div className='tableContents'>

          <section id='section1' className='teamStatsSection' style={{ gap: selectedTeam && '8px', marginTop: userAnswers.length > 0 && '16px' }}>
            {/* team 기준 통계 데이터 표시 + 클릭 시 선택 처리 */}
            {Object.entries(teamStats).map(([team, counts]) => {
              let iconClass = '';
              switch (team) {
                case '기체정비공장':
                  iconClass = 'ri-plane-fill';
                  break;
                case '기관정비공장':
                  iconClass = 'ri-git-merge-line';
                  break;
                case '부품정비공장':
                  iconClass = 'ri-settings-line';
                  break;
                case '특수제작공장':
                  iconClass = 'ri-tools-fill';
                  break;
                case 'KF-16 성능개량공장':
                  iconClass = 'ri-dashboard-2-line';
                  break;
                default:
                  iconClass = 'ri-flight-takeoff-line';
              }
              let backgroundColor = '#fff';
              switch (team) {
                case '기체정비공장':
                  backgroundColor = '#c0504e';
                  break;
                case '기관정비공장':
                  backgroundColor = '#f79645';
                  break;
                case '부품정비공장':
                  backgroundColor = '#4cacc6';
                  break;
                case '특수제작공장':
                  backgroundColor = '#00b04f';
                  break;
                case 'KF-16 성능개량공장':
                  backgroundColor = '#8064a2';
                  break;
                default:
                  backgroundColor = '#fff';
              }

              return (
                <div key={team}
                  className='teamStats'
                  style={{
                    background: selectedTeam === team ? backgroundColor : '#fff',
                    color: selectedTeam === team ? '#fff' : '#000',
                    aspectRatio: selectedTeam && 0,

                  }}
                  onClick={() => setSelectedTeam(selectedTeam === team ? null : team)}>
                  <i className={iconClass} style={{ display: selectedTeam && 'none' }}></i>
                  <h3 className='teamStatsText' style={{ fontSize: selectedTeam && '14px', margin: selectedTeam && 0, color: selectedTeam === team ? '#fff' : backgroundColor }}>{team}</h3>
                  <p className='teamStatsMen' style={{ display: selectedTeam && 'none' }} >정신건강 ({counts.test_1}명)</p>
                  <p className='teamStatsPhy' style={{ display: selectedTeam && 'none' }} >신체건강 ({counts.test_2}명)</p>
                </div>
              );
            })}
          </section>

          <section id='section2'>
            {selectedTeam && (
              <div>
                <h3 className='teamStatsTitle'>{selectedTeam}의 테스트 분석표</h3>
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
                      <td>{`정신건강:${mentalData.count}명`}</td>
                      <td>{mentalData.details}</td>
                    </tr>
                    <tr>
                      <td>{`신체건강:${physicalData.count}명`}</td>
                      <td>{physicalData.details}</td>
                    </tr>
                  </tbody>
                </table>

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
                      <td>10점 이상</td>
                      <td rowSpan={2}>피로도가 매우 높은 수준으로 정비활동에 뚜렷한 영향을 끼칠수 있음</td>
                    </tr>
                    <tr>
                      <td>신체건강</td>
                      <td>76점 이상</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section id='section3' >
            <h3 className='teamStatsTitle'>{selectedTeam ? selectedTeam : '전체'} 체크리스트 미작성자 ({selectedTeam ? noUser.filter(u => u.team === selectedTeam).length : noUser.length}명)</h3>
            {(selectedTeam ? noUser.filter(u => u.team === selectedTeam) : noUser).length > 0 ? (
              <table className='noUserTable'>
                <thead>
                  <tr>
                    <th>아이디</th>
                    <th>공장명</th>
                    <th>계급</th>
                    <th>작업자</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedTeam ? noUser.filter(u => u.team === selectedTeam) : noUser).map(u => (
                    <tr key={u.id}>
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
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

export default App;
