import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  const [testsRecordRaw, setTestsRecordRaw] = useState({});
  const [selectedType, setSelectedType] = useState("mental_health");
  // Removed unused state variable 'currentQuestionIndex'
  const [answersRaw, setAnswersRaw] = useState({});
  const today = moment().format("YYYY-MM-DD");
  const [selectDay, setSelectDay] = useState(today);

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

  const isTestComplete = useCallback((testType) => {
    const test = testsRecord[testType];
    return test && answers[test.id] && Object.keys(answers[test.id]).length === test.questions.length;
  }, [testsRecord, answers]);

  const allComplete = useMemo(() => {
    return Object.keys(testsRecord).every(testType => isTestComplete(testType));
  }, [testsRecord, isTestComplete]);

  const handleOptionChange = useCallback((testId, questionIndex, value) => {
    setAnswersRaw(prev => ({
      ...prev,
      [testId]: {
        ...(prev[testId] || {}),
        [questionIndex]: value
      }
    }));
  }, []);

  const handleNext = useCallback(() => {

    const incompleteTypes = Object.keys(testsRecord).filter(type => type !== selectedType && !isTestComplete(type));
    //console.log(incompleteTypes)
    if (incompleteTypes.length > 0) {
      setSelectedType(incompleteTypes[0]);
      // Removed unused 'setCurrentQuestionIndex' call
      //console.log("다음 테스트로 이동합니다.");
      window.scrollTo({ top: 0 }); // 화면 상단으로 이동
    } else {
      // 현재 테스트가 미완료이면 경고, 아니면 모든 테스트 완료 메시지
      if (!isTestComplete(selectedType)) {
        alert("현재 테스트가 미완료되었습니다. 모든 문제를 체크해주세요.");
      } else {
        alert("모든 테스트가 완료되었습니다.");
      }
    }
  }, [testsRecord, selectedType, isTestComplete]);

  /*const handleSubmit = useCallback(async () => {
    const userId = localStorage.getItem('user');
    if (!userId) {
      alert('사용자 정보가 없습니다.');
      return;
    }
    try {
      const userDocRef = doc(props.manage, "meta", "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      const prevAnswers = userDocSnap.exists() && userDocSnap.data().answers ? userDocSnap.data().answers : {};
      const newAnswers = {
        ...prevAnswers,
        [selectDay]: answers
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
  }, [props.manage, answers, selectDay]);*/

  const handleSubmit = useCallback(async () => {
    const userId = localStorage.getItem('user');
    if (!userId) {
      alert('사용자 정보가 없습니다.');
      return;
    }
    try {
      const userDocRef = doc(props.manage, "meta", "users", userId);
      //const today = moment().format("YYYY-MM-DD");
      const userDocSnap = await getDoc(userDocRef);
      const prevAnswers = userDocSnap.exists() && userDocSnap.data().answers ? userDocSnap.data().answers : {};
      const transformedAnswers = {};
      Object.keys(answers).forEach(testId => {
        const testAnswers = answers[testId];
        const testType = testsRecord.mental_health?.id === testId ? "mental_health" : "physical_health";
        transformedAnswers[testId] = {};

        Object.keys(testAnswers).forEach(questionIndex => {
          const answer = testAnswers[questionIndex];
          if (testType === "mental_health") {
            transformedAnswers[testId][questionIndex] =
              answer === "없음" ? 0 :
                answer === "2일 이상" ? 1 :
                  answer === "1주일 이상" ? 2 :
                    answer === "거의 매일" ? 3 : 0;
          } else if (testType === "physical_health") {
            if ([1, 4, 8, 9, 12, 13, 15, 16, 17, 18].includes(Number(questionIndex))) {
              transformedAnswers[testId][questionIndex] =
                answer === "매우 맞음" ? 5 :
                  answer === "맞음" ? 4 :
                    answer === "보통" ? 3 :
                      answer === "아님" ? 2 :
                        answer === "매우 아님" ? 1 : 0;
            } else {
              transformedAnswers[testId][questionIndex] =
                answer === "매우 맞음" ? 1 :
                  answer === "맞음" ? 2 :
                    answer === "보통" ? 3 :
                      answer === "아님" ? 4 :
                        answer === "매우 아님" ? 5 : 0;
            }
          }
        });
      });
      const newAnswers = {
        ...prevAnswers,
        [selectDay]: transformedAnswers
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
  }, [props.manage, answers, testsRecord, selectDay]);

  const unansweredList = [];
  Object.values(testsRecord).forEach(test => {
    test.questions.forEach((q, index) => {
      if (!answers[test.id] || answers[test.id][index] === undefined) {
        unansweredList.push({ testName: test.test_name, question: q.question });
      }
    });
  });

  if (!testsRecord.mental_health || !testsRecord.physical_health) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  // Removed unused variable 'currentAnswer'

  return (
    <div className='resultContainer'>
      {
        localStorage.getItem('user') === 'rblood' &&
        <input
          type="date"
          id="selectDay"
          className='dayInput'
          value={selectDay}
          onChange={(e) => {
            setSelectDay(e.target.value);
          }}
        />
      }
      <h2 className='userTitle'>{selectDay}일 테스트를 진행합니다.</h2>
      <div className='typeGroup'>
        {Object.keys(testsRecord).map(testType => (
          <button
            key={testType}
            disabled={isTestComplete(testType)}
            className='typeButton'
            onClick={() => {
              setSelectedType(testType);
              // Removed unused 'setCurrentQuestionIndex' call
            }}
            style={{
              backgroundColor: isTestComplete(testType) ? "#cbcbcb" : (selectedType === testType && "#5a9de0"),
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

      <div className='questionContainer'>
        <h3 className='teamStatsTitle'>{currentTest.test_name} 테스트</h3>
        {currentTest.questions.map((question, qIndex) => (
          <div key={qIndex} className='questionGroup'>
            <div className='questionContents'>
              <p className='questionText'>
                <span><strong>{`Q${qIndex + 1}. `}</strong>{question.question}</span>
              </p>
              <div className='optionsContainer'>
                {question.options && question.options.length > 0 ? (
                  question.options
                    .slice()
                    .sort((a, b) => {
                      if (selectedType === "physical_health" && [1, 4, 8, 9, 12, 13, 15, 16, 17, 18].includes(qIndex)) {
                        return question.options.indexOf(b) - question.options.indexOf(a);
                      }
                      return question.options.indexOf(a) - question.options.indexOf(b);
                    })
                    .map((option, optionIndex) => (
                      <div key={optionIndex} className='optionItem'>
                        <input
                          type="radio"
                          id={`question-${currentTest.id}-${qIndex}-${optionIndex}`}
                          name={`question-${currentTest.id}-${qIndex}`}
                          value={option}
                          checked={answers[currentTest.id]?.[qIndex] === option}
                          onChange={(e) => handleOptionChange(currentTest.id, qIndex, e.target.value)}
                        />
                        <label htmlFor={`question-${currentTest.id}-${qIndex}-${optionIndex}`}>
                          <span className='optionIndex'>
                            {selectedType === "mental_health" ? optionIndex : optionIndex + 1}
                          </span>
                          <span className='optionText'>{option}</span>
                        </label>
                      </div>
                    ))
                ) : (
                  <p>등록된 보기가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className='controll'>
        <div className='buttonContainer'>
          <button
            style={{ flex: !allComplete && 4 }}
            className={'button'}
            // 수정: 현재 테스트가 모두 체크되지 않으면 "다음" 버튼 비활성화
            disabled={!isTestComplete(selectedType) || allComplete}
            onClick={handleNext}
          >다음</button>
          <button
            style={{ flex: allComplete && 4 }}
            className={'button'}
            disabled={!allComplete}
            onClick={handleSubmit}
          >제출</button>
        </div>
      </div>

    </div>
  );
}

export default App;
