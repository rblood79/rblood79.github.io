import _ from 'lodash';
import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import context from '../component/Context';
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import { query, where, onSnapshot } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  // 필터링 상태 (정신건강: "mental_health", 신체건강: "physical_health")
  const [selectedType, setSelectedType] = useState("mental_health");
  // 테스트 데이터 상태
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const q = query(props.manage, where("test_type", "==", selectedType));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(fetchedTests);
    });
    return () => unsubscribe();
  }, [props.manage, selectedType]);

  return (
    <div className='resultContainer'>
      {/* 버튼 형태의 필터 선택 UI */}
      <div>
        <button
          onClick={() => setSelectedType("mental_health")}
          style={{
            backgroundColor: selectedType === "mental_health" ? "#007bff" : "#eee",
            color: selectedType === "mental_health" ? "#fff" : "#000",
            marginRight: "8px",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px"
          }}
        >
          정신건강
        </button>
        <button
          onClick={() => setSelectedType("physical_health")}
          style={{
            backgroundColor: selectedType === "physical_health" ? "#007bff" : "#eee",
            color: selectedType === "physical_health" ? "#fff" : "#000",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px"
          }}
        >
          신체건강
        </button>
      </div>
      {/* 조회된 테스트 데이터 출력 */}
      <div>
        {tests.map(test => (
          <div key={test.id}>
            <h3>{test.test_name} 테스트</h3>
            {/* 질문 목록 표시 - 순번 및 라디오 그룹 적용 */}
            {test.questions && test.questions.map((q, idx) => (
              <div key={idx}>
                <strong>{`Q${idx + 1} 문제:`}</strong> {q.question}<br />
                <div>
                  {q.options.map((option, optionIndex) => (
                    <div key={optionIndex}>
                      <input
                        type="radio"
                        id={`question-${test.id}-${idx}-${optionIndex}`}
                        name={`question-${test.id}-${idx}`}
                        value={option}
                      />
                      <label htmlFor={`question-${test.id}-${idx}-${optionIndex}`}>{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
