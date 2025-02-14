import _ from 'lodash';
import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import context from '../component/Context';
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import { query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  // 두 테스트 데이터를 동시에 관리 (각각 mental_health, physical_health)
  const [testsRecord, setTestsRecord] = useState({});
  // 현재 선택된 테스트 유형
  const [selectedType, setSelectedType] = useState("mental_health");
  // 현재 질문 인덱스
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // 각 테스트별 질문 답변 저장 (예: { [testId]: { [questionIndex]: answer } })
  const [answers, setAnswers] = useState({});
  //const [storedAnswers, setStoredAnswers] = useState({});

  // 컴포넌트 마운트 시 기존 사용자 answers 로드
  useEffect(() => {
    async function fetchUserStoredAnswers() {
      const userId = localStorage.getItem('user');
      if (!userId) return;
      const userDocRef = doc(props.manage, "meta", "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.answers) {
          setAnswers(data.answers);
        }
      }
    }
    fetchUserStoredAnswers();
  }, [props.manage]);

  // mental_health 테스트 데이터 fetch
  useEffect(() => {
    const q = query(props.manage, where("test_type", "==", "mental_health"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTest = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
      setTestsRecord(prev => ({ ...prev, mental_health: fetchedTest }));
    });
    return () => unsubscribe();
  }, [props.manage]);

  // physical_health 테스트 데이터 fetch
  useEffect(() => {
    const q = query(props.manage, where("test_type", "==", "physical_health"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTest = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
      setTestsRecord(prev => ({ ...prev, physical_health: fetchedTest }));
    });
    return () => unsubscribe();
  }, [props.manage]);

  // 현재 선택된 테스트가 없으면 표시
  if (!testsRecord.mental_health || !testsRecord.physical_health) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  const currentTest = testsRecord[selectedType];
  if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }
  // 현재 테스트에 대한 현재 질문의 선택값
  const currentAnswer = answers[currentTest.id]?.[currentQuestionIndex] || "";

  // 두 테스트의 완료 여부 계산
  const mentalComplete = testsRecord.mental_health && answers[testsRecord.mental_health.id] &&
    Object.keys(answers[testsRecord.mental_health.id]).length === testsRecord.mental_health.questions.length;
  const physicalComplete = testsRecord.physical_health && answers[testsRecord.physical_health.id] &&
    Object.keys(answers[testsRecord.physical_health.id]).length === testsRecord.physical_health.questions.length;
  const allComplete = mentalComplete && physicalComplete;

  // 수정된 handleNext: 마지막 문항에서는 자동으로 테스트 타입 전환하지 않음
  const handleNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 마지막 질문 도달: 자동 전환 제거 (원래 전환 로직 제거)
      // 필요 시 알림을 추가할 수 있습니다.
      alert("마지막 질문입니다.");
    }
  };

  // 새로 추가: 사용자가 모든 질문에 답한 후, "users" 컬렉션의 문서에 답변을 저장하는 함수
  const handleSubmit = async () => {
    const userId = localStorage.getItem('user');
    if (!userId) {
      alert('사용자 정보가 없습니다.');
      return;
    }
    try {
      const userDocRef = doc(props.manage, "meta", "users", userId);
      // 오늘 날짜를 key로 생성
      const today = moment().format("YYYY-MM-DD");

      // 기존 답변 가져오기
      const userDocSnap = await getDoc(userDocRef);
      const prevAnswers = userDocSnap.exists() && userDocSnap.data().answers ? userDocSnap.data().answers : {};

      const transformedAnswers = {};
      Object.keys(answers).forEach(testId => {
        const testAnswers = answers[testId];
        const testType = testsRecord.mental_health.id === testId ? "mental_health" : "physical_health";
        transformedAnswers[testId] = {};
        Object.keys(testAnswers).forEach(questionIndex => {
          const answer = testAnswers[questionIndex];
          if (testType === "mental_health") {
            transformedAnswers[testId][questionIndex] = answer === "없음" ? 0 : answer === "2일 이상" ? 1 : answer === "1주일 이상" ? 2 : 3;
          } else if (testType === "physical_health") {
            transformedAnswers[testId][questionIndex] = answer === "매우 맞음" ? 1 : answer === "맞음" ? 2 : answer === "보통" ? 3 : answer === "아님" ? 4 : 5;
          }
        });
      });
      // 오늘 날짜 key에 새 답변 저장 및 기존 데이터 병합
      const newAnswers = {
        ...prevAnswers,
        [today]: transformedAnswers
      };
      await updateDoc(userDocRef, { answers: newAnswers });
      alert('답변이 제출되었습니다.');
    } catch (error) {
      console.error('제출 실패', error);
      alert('제출에 실패하였습니다.');
    }
  };

  return (
    <div className='resultContainer'>
      {/* 버튼 형태의 필터 선택 UI */}
      <div className='typeGroup'>
        <button
          disabled={mentalComplete}
          className='typeButton'
          onClick={() => {
            setSelectedType("mental_health");
            setCurrentQuestionIndex(0);
          }}
          style={{
            backgroundColor: mentalComplete ? "#999" : (selectedType === "mental_health" ? "#007bff" : "#eee"),
            color: mentalComplete ? "#fff" : (selectedType === "mental_health" ? "#fff" : "#000"),

          }}
        >
          <i className="ri-brain-line"></i>
          <h3>정신건강</h3>
          <span>{mentalComplete ? " (테스트 완료)" : "(테스트 미완료)"}</span>
        </button>
        <button
          disabled={physicalComplete}
          className='typeButton'
          onClick={() => {
            setSelectedType("physical_health");
            setCurrentQuestionIndex(0);
          }}
          style={{
            backgroundColor: physicalComplete ? "#999" : (selectedType === "physical_health" ? "#007bff" : "#eee"),
            color: physicalComplete ? "#fff" : (selectedType === "physical_health" ? "#fff" : "#000"),
          }}
        >
          <i className="ri-body-scan-line"></i>
          <h3>신체건강</h3><span>{physicalComplete ? " (테스트 완료)" : "(테스트 미완료)"}</span>
        </button>
      </div>

      {/* 현재 테스트의 질문을 한 번에 하나씩 표시 */}
      <div className='questionContainer'>
        <h3 className='questionType'>{currentTest.test_name} 테스트</h3>
        <div className='questionGroup'>
          <p className='questionText'>
            <strong>{`Q${currentQuestionIndex + 1}.`}</strong> {currentTest.questions[currentQuestionIndex].question}
          </p>
          <div className='optionsContainer'>
            {currentTest.questions[currentQuestionIndex].options.map((option, optionIndex) => (
              <div key={optionIndex} className='optionItem'>
                <input
                  type="radio"
                  id={`question-${currentTest.id}-${currentQuestionIndex}-${optionIndex}`}
                  name={`question-${currentTest.id}-${currentQuestionIndex}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) =>
                    setAnswers(prev => ({
                      ...prev,
                      [currentTest.id]: {
                        ...(prev[currentTest.id] || {}),
                        [currentQuestionIndex]: e.target.value
                      }
                    }))
                  }
                />
                <label htmlFor={`question-${currentTest.id}-${currentQuestionIndex}-${optionIndex}`}>
                  <span className='optionText'>{option}</span>
                  <span className='optionIndex'>{optionIndex}</span>
                </label>

              </div>
            ))}
          </div>
        </div>
        {/* 이전과 다음(또는 제출) 버튼을 함께 표시 */}
        <div className='controll'>
        <div className='buttonContainer'>
          <button
            className={'button back'}
            disabled={currentQuestionIndex === 0}
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
          >
            이전
          </button>
          <button
            // 수정: 마지막 질문일 경우 다음 버튼 비활성화
            className={'button'}
            disabled={
              currentQuestionIndex === currentTest.questions.length - 1 ||
              !currentAnswer
            }
            onClick={handleNext}
          >
            다음
          </button>
          <button
            className={'button'}
            disabled={
              !(
                (selectedType === "mental_health" && mentalComplete) ||
                (selectedType === "physical_health" && physicalComplete)
              )
            }
            onClick={handleSubmit}
          >
            제출
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default App;
