import _ from 'lodash';
import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import context from '../component/Context';
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import { query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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

  // 다음 버튼 클릭 시 동작: 현재 질문이 마지막이면 테스트 전환 (두 테스트 모두 완료 시 변하지 않음)
  const handleNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 마지막 질문에 답변한 상태면 상대 테스트로 전환
      if (!allComplete) {
        const nextType = selectedType === "mental_health" ? "physical_health" : "mental_health";
        setSelectedType(nextType);
        setCurrentQuestionIndex(0);
      }
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
      await updateDoc(userDocRef, {
        // List.js에서 선택한 질문의 답들을 저장
        answers: transformedAnswers
      });
      alert('답변이 제출되었습니다.');
    } catch (error) {
      console.error('제출 실패', error);
      alert('제출에 실패하였습니다.');
    }
  };

  return (
    <div className='resultContainer'>
      {/* 버튼 형태의 필터 선택 UI */}
      <div>
        <button
          onClick={() => {
            setSelectedType("mental_health");
            setCurrentQuestionIndex(0);
          }}
          style={{
            backgroundColor: selectedType === "mental_health" ? "#007bff" : "#eee",
            color: selectedType === "mental_health" ? "#fff" : "#000",
            padding: "8px 16px",
            border: "none",
          }}
        >
          정신건강
        </button>
        <button
          onClick={() => {
            setSelectedType("physical_health");
            setCurrentQuestionIndex(0);
          }}
          style={{
            backgroundColor: selectedType === "physical_health" ? "#007bff" : "#eee",
            color: selectedType === "physical_health" ? "#fff" : "#000",
            padding: "8px 16px",
            border: "none",
          }}
        >
          신체건강
        </button>
      </div>
      
      {/* 현재 테스트의 질문을 한 번에 하나씩 표시 */}
      <div>
        <h3>{currentTest.test_name} 테스트</h3>
        <p>
          <strong>{`Q${currentQuestionIndex + 1} 문제:`}</strong> {currentTest.questions[currentQuestionIndex].question}
        </p>
        <div>
          {currentTest.questions[currentQuestionIndex].options.map((option, optionIndex) => (
            <div key={optionIndex}>
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
                {option}
              </label>
            </div>
          ))}
        </div>
        {/* 이전과 다음(또는 제출) 버튼을 함께 표시 */}
        <div>
          <button
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
            disabled={!currentAnswer}
            onClick={handleNext}
          >
            다음
          </button>
          <button
            disabled={!allComplete}
            onClick={handleSubmit}
          >
            제출
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
