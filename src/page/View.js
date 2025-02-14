import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory, useLocation } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import context from '../component/Context';
import logo from '../assets/logo.svg';
import moment from "moment";

const App = (props) => {
  const state = useContext(context);
  const location = useLocation();
  const history = useHistory();
  const { user } = state;

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

  const tableRef = useRef();

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
      @page {}
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, []);

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
        </div>

        <div className='tableContents'>

          <section id='section1' className='teamStatsSection' style={{ gap: selectedTeam && '8px' }}>
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
                  <i className={iconClass} style={{ display: selectedTeam && 'none', color: '#ccc'}}></i>
                  <h3 className='teamStatsText' style={{ fontSize: selectedTeam && '14px', margin: selectedTeam && 0, color: selectedTeam === team ? '#fff' : backgroundColor}}>{team}</h3>
                  <p className='teamStatsMen' style={{ display: selectedTeam && 'none'}} >정신건강 ({counts.test_1}명)</p>
                  <p className='teamStatsPhy' style={{ display: selectedTeam && 'none'}} >신체건강 ({counts.test_2}명)</p>
                </div>
              );
            })}
          </section>

          <section id='section2'>
            {selectedTeam ? (
              <div>
                <h3 className='teamStatsText'>{selectedTeam}의 테스트 분석표 입니다.</h3>
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
            ) : (
              <p>팀을 선택해주세요.</p>
            )}
          </section>

          <section id='section3'>
            <h3>{selectedTeam ? selectedTeam : '전체'} 체크리스트 미작성자 ({selectedTeam ? noUser.filter(u => u.team === selectedTeam).length : noUser.length}명)</h3>
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
              <p>모든 사용자가 답변을 하였습니다.</p>
            )}
          </section>

        </div>

      </div>
    </div>
  );
}

export default App;
