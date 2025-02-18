import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  // 두 테스트 데이터를 동시에 관리 (각각 mental_health, physical_health)
  const [testsRecordRaw, setTestsRecordRaw] = useState({});
  // 현재 선택된 테스트 유형
  const [selectedType, setSelectedType] = useState("mental_health");
  // 현재 질문 인덱스
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  // 각 테스트별 질문 답변 저장 (예: { [testId]: { [questionIndex]: answer } })
  const [answersRaw, setAnswersRaw] = useState({});

  // mental_health 테스트 데이터 fetch
  useEffect(() => {
    const unsubscribe = onSnapshot(query(props.manage, where("test_type", "!=", null)), (snapshot) => {
      const fetchedTests = {};
      snapshot.docs.forEach(doc => {
        const testData = { id: doc.id, ...doc.data() };
        fetchedTests[testData.test_type] = testData;
      });
      setTestsRecordRaw(fetchedTests);
    });
    return () => unsubscribe();
  }, [props.manage]);

  const testsRecord = useMemo(() => testsRecordRaw, [testsRecordRaw]);
  const answers = useMemo(() => answersRaw, [answersRaw]);

  const currentTest = useMemo(() => testsRecord[selectedType], [testsRecord, selectedType]);

  // 테스트 완료 여부를 동적으로 계산하는 함수
  const isTestComplete = useCallback((testType) => {
    const test = testsRecord[testType];
    return test && answers[test.id] && Object.keys(answers[test.id]).length === test.questions.length;
  }, [testsRecord, answers]);

  // 모든 테스트가 완료되었는지 확인
  const allComplete = useMemo(() => {
    return Object.keys(testsRecord).every(testType => isTestComplete(testType));
  }, [testsRecord, isTestComplete]);

  // onChange 핸들러 메모이제이션
  const handleOptionChange = useCallback((testId, questionIndex, value) => {
    setAnswersRaw(prev => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || {}),
        [questionIndex]: value
      }
    }));
  }, []);

  // handleNext를 useCallback으로 감쌉니다.
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // 완료되지 않은 다른 테스트 유형을 찾아서 선택
      const otherTypes = Object.keys(testsRecord).filter(type => type !== selectedType && !isTestComplete(type));
      if (otherTypes.length > 0) {
        setSelectedType(otherTypes[0]);
        setCurrentQuestionIndex(0);
      } else {
        alert("마지막 질문입니다.");
      }
    }
  }, [currentQuestionIndex, currentTest?.questions?.length, selectedType, testsRecord, isTestComplete]);

  // handleSubmit를 useCallback으로 감쌉니다.
  const handleSubmit = useCallback(async () => {
    const userId = localStorage.getItem('user');
    if (!userId) {
      alert('사용자 정보가 없습니다.');
      return;
    }
    try {
      const userDocRef = doc(props.manage, "meta", "users", userId);
      const today = moment().format("YYYY-MM-DD");
      const userDocSnap = await getDoc(userDocRef);
      const prevAnswers = userDocSnap.exists() && userDocSnap.data().answers ? userDocSnap.data().answers : {};
      const transformedAnswers = {};
      Object.keys(answers).forEach(testId => {
        const testAnswers = answers[testId];
        const testType = testsRecord.mental_health?.id === testId ? "mental_health" : "physical_health";
        transformedAnswers[testId] = {};
        Object.keys(testAnswers).forEach(questionIndex => {
          const answer = testAnswers[questionIndex];
          transformedAnswers[testId][questionIndex] =
            testType === "mental_health"
              ? answer === "없음" ? 0 : answer === "2일 이상" ? 1 : answer === "1주일 이상" ? 2 : 3
              : answer === "매우 맞음" ? 1 : answer === "맞음" ? 2 : answer === "보통" ? 3 : answer === "아님" ? 4 : 5;
        });
      });
      const newAnswers = {
        ...prevAnswers,
        [today]: transformedAnswers
      };
      await updateDoc(userDocRef, { answers: newAnswers });
      alert('답변이 제출되었습니다. 확인을 누르시면 로그아웃 됩니다.');
      localStorage.removeItem('user');
      localStorage.removeItem('year');
      window.location.href = '/';
    } catch (error) {
      console.error('제출 실패', error);
      alert('제출에 실패하였습니다.');
    }
  }, [props.manage, answers, testsRecord]);

  // 현재 선택된 테스트가 없으면 표시
  if (!testsRecord.mental_health || !testsRecord.physical_health) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  // 현재 테스트에 대한 현재 질문의 선택값
  const currentAnswer = answers[currentTest.id]?.[currentQuestionIndex] || "";

  return (
    <div className='resultContainer'>
      {/* 버튼 형태의 필터 선택 UI */}
      <div className='typeGroup'>
        {Object.keys(testsRecord).map(testType => (
          <button
            key={testType}
            disabled={isTestComplete(testType)}
            className='typeButton'
            onClick={() => {
              setSelectedType(testType);
              setCurrentQuestionIndex(0);
            }}
            style={{
              backgroundColor: isTestComplete(testType) ? "#cbcbcb" : (selectedType === testType && "#3492b1"),
              color: isTestComplete(testType) ? "#fff" : (selectedType === testType ? "#fff" : "#000"),
            }}
          >
            {testType === "mental_health" ? <i className="ri-brain-line"></i> : <i className="ri-body-scan-line"></i>}
            <h3 className='teamStatsText'>{testsRecord[testType].test_name}</h3>
            <span>
              {isTestComplete(testType)
                ? " (완료)"
                : `(${Object.keys(answers?.[testsRecord[testType]?.id] || {}).length}/${testsRecord[testType]?.questions?.length})`}
            </span>
          </button>
        ))}
      </div>

      {/* 현재 테스트의 질문을 한 번에 하나씩 표시 */}
      <div className='questionContainer'>
        <h3 className='teamStatsTitle'>{currentTest.test_name} 테스트</h3>
        <div className='questionGroup'>
          <p className='questionText'>
            <span><strong>{`Q${currentQuestionIndex + 1}. `}</strong>{currentTest.questions[currentQuestionIndex].question}</span>
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
                  onChange={(e) => handleOptionChange(currentTest.id, currentQuestionIndex, e.target.value)}
                />
                <label htmlFor={`question-${currentTest.id}-${currentQuestionIndex}-${optionIndex}`}>

                  <span className='optionIndex'>
                    {
                      selectedType === "mental_health" ? optionIndex : optionIndex + 1
                    }
                  </span>
                  <span className='optionText'>{option}</span>
                </label>

              </div>
            ))}
          </div>
        </div>

      </div>
      {/* 이전과 다음(또는 제출) 버튼을 함께 표시 */}
      <div className='controll'>
        <div className='buttonContainer'>
          {/* 
          <button
            className={'button'}
            disabled={currentQuestionIndex === 0}
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              }
            }}
          >
            이전
          </button>
          */}
          <button
            // 수정된 disabled 조건: 현재 질문에 답변이 없거나 모든 테스트가 완료되었으면 비활성화
            style={{ flex: !allComplete && 4 }}
            className={'button'}
            disabled={!currentAnswer || allComplete}
            onClick={handleNext}
          >
            다음
          </button>
          <button
            style={{ flex: allComplete && 4 }}
            className={'button'}
            // 모든 테스트가 완료된 경우에만 활성화
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
