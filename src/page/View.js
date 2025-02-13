import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory, useLocation } from "react-router-dom";
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import context from '../component/Context';
import logo from '../assets/logo.svg';

const App = (props) => {
  const state = useContext(context);
  const location = useLocation();
  const history = useHistory();
  const { user } = state;

  // 선택한 질문 ID와 사용자 답변 리스트 상태
  const [selectedQuestionId] = useState("0"); // 예시: "0"번 질문
  // 추가: 전체 원본 answers 데이터를 포함하여 저장 (selectedAnswers와 fullAnswers)
  const [userAnswers, setUserAnswers] = useState([]);
  // 추가: 선택된 팀 상태
  const [selectedTeam, setSelectedTeam] = useState(null);

  // "meta/users" 컬렉션에서 선택한 질문에 답한 사용자들 fetch 및 fullAnswers 저장
  useEffect(() => {
    async function fetchUserAnswers() {
      try {
        const usersRef = collection(props.manage, "meta", "users");
        const querySnapshot = await getDocs(usersRef);
        
        const filtered = [];
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          //console.log("User data:", docSnap.id, data); // 디버깅 로그
          if (data.answers) {
            const key = String(selectedQuestionId);
            const combined = {};
            // selectedAnswers: 해당 질문의 답만, fullAnswers: 원본 전체 answers
            Object.entries(data.answers).forEach(([testId, testAnswers]) => {
              if (testAnswers.hasOwnProperty(key)) {
                combined[testId] = testAnswers[key];
              }
            });
            if (Object.keys(combined).length > 0) {
              filtered.push({ 
                id: docSnap.id, 
                selectedAnswers: combined, 
                fullAnswers: data.answers, 
                ...data 
              });
            }
          }
        });
        setUserAnswers(filtered);
      } catch (error) {
        console.error('사용자 답변 fetch 에러', error);
      }
    }
    fetchUserAnswers();
  }, [props.manage, selectedQuestionId]);

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
          <div className='buttonContainer'>
            <button className={'button back'} onClick={onBack}>이전</button>
            <button className={'button'} onClick={onPrint}>인쇄</button>
          </div>
        </div>

        <div className='tableContents'>
          
          <section id='section1'>
            {/* team 기준 통계 데이터 표시 + 클릭 시 선택 처리 */}
            {Object.entries(teamStats).map(([team, counts]) => ( 
              <div key={team} 
                   style={{ 
                      border: '1px solid #ccc', 
                      margin: '10px', 
                      padding: '10px',
                      cursor: 'pointer',
                      background: selectedTeam === team ? '#eef' : '#fff'
                   }}
                   onClick={() => setSelectedTeam(team)}>
                <h3>{team}</h3>
                <p>정신건강 ({counts.test_1}명)</p>
                <p>신체건강 ({counts.test_2}명)</p>
              </div>
            ))}
          </section>

          <section id='section2'>
            {/* 선택된 팀의 사용자 목록 및 각 테스트 값 합산 표시 */}
            {selectedTeam ? (
              <div>
                <h3>{selectedTeam}의 테스트 분석표 입니다.</h3>
                {/* test_1 부문 */}
                <div>
                  <div>정신건강: {
                    userAnswers.filter(u => 
                      u.team === selectedTeam &&
                      u.fullAnswers.test_1 &&
                      Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0) >= 10
                    ).length
                  }명</div>
                  <div>
                    <ul>
                      {userAnswers.filter(u => 
                        u.team === selectedTeam &&
                        u.fullAnswers.test_1 &&
                        Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0) >= 10
                      ).map(u => {
                        const total = Object.values(u.fullAnswers.test_1).reduce((acc, val) => acc + val, 0);
                        return <li key={u.id}>{u.rank+' '+u.name} ({total}점)</li>;
                      })}
                    </ul>
                  </div>
                </div>
                {/* test_2 부문 */}
                <div>
                  <div>신체건강: {
                    userAnswers.filter(u => 
                      u.team === selectedTeam &&
                      u.fullAnswers.test_2 &&
                      Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0) >= 76
                    ).length
                  }명</div>
                  <div>
                    <ul>
                      {userAnswers.filter(u => 
                        u.team === selectedTeam &&
                        u.fullAnswers.test_2 &&
                        Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0) >= 76
                      ).map(u => {
                        const total = Object.values(u.fullAnswers.test_2).reduce((acc, val) => acc + val, 0);
                        return <li key={u.id}>{u.rank+' '+u.name} ({total}점)</li>;
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p>팀을 선택해주세요.</p>
            )}
          </section>

          <section id='section3'>
            {/* 기존 section2 코드 유지 (예: 전체 사용자 목록) */}
            <h3>test 기준</h3>
            {userAnswers.length > 0 ? (
              <ul>
                {userAnswers.map(u => {
                  const totalTest1 = typeof u.selectedAnswers.test_1 === 'object'
                    ? Object.values(u.selectedAnswers.test_1).reduce((acc, val) => acc + val, 0)
                    : u.selectedAnswers.test_1;
                  const totalTest2 = typeof u.selectedAnswers.test_2 === 'object'
                    ? Object.values(u.selectedAnswers.test_2).reduce((acc, val) => acc + val, 0)
                    : u.selectedAnswers.test_2;
                  return (
                    <li key={u.id}>
                      {u.number} - {u.team} - {u.name} - 정신건강: {totalTest1} - 신체건강: {totalTest2}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>해당 질문에 답한 사용자가 없습니다.</p>
            )}
          </section>
          
        </div>

      </div>
    </div>
  );
}

export default App;
