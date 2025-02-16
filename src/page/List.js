import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect } from 'react';
import { query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  const [testsRecord, setTestsRecord] = useState({});
  const [selectedType, setSelectedType] = useState("mental_health");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchTestData("mental_health");
    fetchTestData("physical_health");
  }, [props.manage]);

  const fetchTestData = (testType) => {
    const q = query(props.manage, where("test_type", "==", testType));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTest = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0];
      setTestsRecord(prev => ({ ...prev, [testType]: fetchedTest }));
    });
    return () => unsubscribe();
  };

  if (!testsRecord.mental_health || !testsRecord.physical_health) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  const currentTest = testsRecord[selectedType];
  if (!currentTest || !currentTest.questions || currentTest.questions.length === 0) {
    return <div className='resultContainer'>데이터가 없습니다.</div>;
  }

  const currentAnswer = answers[currentTest.id]?.[currentQuestionIndex] || "";
  const mentalComplete = isTestComplete("mental_health");
  const physicalComplete = isTestComplete("physical_health");
  const allComplete = mentalComplete && physicalComplete;

  const isTestComplete = (testType) => {
    return testsRecord[testType] && answers[testsRecord[testType].id] &&
      Object.keys(answers[testsRecord[testType].id]).length === testsRecord[testType].questions.length;
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentTest.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const otherType = selectedType === "mental_health" ? "physical_health" : "mental_health";
      if (!isTestComplete(otherType)) {
        setSelectedType(otherType);
        setCurrentQuestionIndex(0);
      } else {
        alert("마지막 질문입니다.");
      }
    }
  };

  const handleSubmit = async () => {
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

      const transformedAnswers = transformAnswers();
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

  const transformAnswers = () => {
    const transformedAnswers = {};
    Object.keys(answers).forEach(testId => {
      const testAnswers = answers[testId];
      const testType = testsRecord.mental_health.id === testId ? "mental_health" : "physical_health";
      transformedAnswers[testId] = {};
      Object.keys(testAnswers).forEach(questionIndex => {
        const answer = testAnswers[questionIndex];
        transformedAnswers[testId][questionIndex] = getTransformedAnswer(testType, answer);
      });
    });
    return transformedAnswers;
  };

  const getTransformedAnswer = (testType, answer) => {
    if (testType === "mental_health") {
      return answer === "없음" ? 0 : answer === "2일 이상" ? 1 : answer === "1주일 이상" ? 2 : 3;
    } else if (testType === "physical_health") {
      return answer === "매우 맞음" ? 1 : answer === "맞음" ? 2 : answer === "보통" ? 3 : answer === "아님" ? 4 : 5;
    }
  };

  const getButtonStyle = (type) => {
    const isComplete = type === "mental_health" ? mentalComplete : physicalComplete;
    return {
      backgroundColor: isComplete ? "#cbcbcb" : (selectedType === type && "#3492b1"),
      color: isComplete ? "#fff" : (selectedType === type ? "#fff" : "#000")
    };
  };

  return (
    <div className='resultContainer'>
      <div className='typeGroup'>
        <button
          disabled={mentalComplete}
          className='typeButton'
          onClick={() => {
            setSelectedType("mental_health");
            setCurrentQuestionIndex(0);
          }}
          style={getButtonStyle("mental_health")}
        >
          <i className="ri-brain-line"></i>
          <h3 className='teamStatsText'>정신건강</h3>
          <span>{mentalComplete ? " (완료)" : `(${Object.keys(answers?.[testsRecord.mental_health.id] || {}).length}/${testsRecord.mental_health.questions.length})`}</span>
        </button>
        <button
          disabled={physicalComplete}
          className='typeButton'
          onClick={() => {
            setSelectedType("physical_health");
            setCurrentQuestionIndex(0);
          }}
          style={getButtonStyle("physical_health")}
        >
          <i className="ri-body-scan-line"></i>
          <h3 className='teamStatsText'>신체건강</h3>
          <span>{physicalComplete ? " (완료)" : `(${Object.keys(answers?.[testsRecord.physical_health.id] || {}).length}/${testsRecord.physical_health.questions.length})`}</span>
        </button>
      </div>

      <div className='questionContainer'>
        <h3 className='teamStatsTitle'>{currentTest.test_name} 테스트</h3>
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
                  <span className='optionIndex'>{optionIndex}</span>
                  <span className='optionText'>{option}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className='controll'>
        <div className='buttonContainer'>
          <button
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