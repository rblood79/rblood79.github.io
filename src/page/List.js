import _ from 'lodash';
import 'remixicon/fonts/remixicon.css';
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import context from '../component/Context';
import { useLocation, useHistory } from "react-router-dom";
import { isMobile } from 'react-device-detect';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import moment from "moment";

const App = (props) => {
  // 추가: "정신건강 테스트" 데이터 상태
  const [mentalTests, setMentalTests] = useState([]);

  useEffect(() => {
    // props.manage가 이미 컬렉션 참조라면 collection(props.manage, "test") 대신 바로 사용
    const q = query(props.manage, where("test_type", "==", "mental_health"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMentalTests(tests);
    });
    return () => unsubscribe();
  }, [props.manage]);

  return (
    <div className='resultContainer'>
      {/* 기존 UI */}
      AAAAA
      {/* 추가: 조회된 "정신건강 테스트" 데이터 출력 */}
      <div>
        {mentalTests.map(test => (
          <div key={test.id}>
            <h3>{test.test_name}</h3>
            <p>ID: {test.test_id}</p>
            {/* 추가: 질문 목록 표시 */}
            {test.questions && test.questions.map((q, idx) => (
              <div key={idx}>
                <strong>문제:</strong> {q.question}<br />
                <strong>보기:</strong> {q.options.join(', ')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
