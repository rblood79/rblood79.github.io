import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useHistory } from "react-router-dom";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import context from '../component/Context';
import mnd from '../assets/logo.svg';
import moment from 'moment';

const App = (props) => {
  const state = useContext(context);
  const { setUser, setYear } = state;
  const [view, setView] = useState(false);
  const [inputs, setInputs] = useState({
    number: "",
    pw: "",
  });
  const { number, pw } = inputs;
  const history = useHistory();

  // 로컬 스토리지에서 사용자 정보 불러오기
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedYear = JSON.parse(localStorage.getItem('year'));

    if (storedUser && storedYear) {
      setUser(storedUser);
      setYear(storedYear);
    }
  }, [setUser, setYear]);

  // 입력 변경 핸들러 useCallback으로 감싸기
  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputs(prevInputs => ({
      ...prevInputs,
      [name]: value || "",
    }));
  }, []);

  // 로그인 체크
  const onCheck = useCallback(async () => {
    if (!number || !pw) return;

    const iniDocRef = doc(props.manage, "ini");
    const iniDocSnap = await getDoc(iniDocRef);

    if (!iniDocSnap.exists()) {
      console.log("No such document!");
      alert('서버 오류가 발생했습니다. 관리자에게 문의해주세요.');
      return;
    }

    localStorage.setItem('user', number);
    const userDocRef = doc(props.manage, "meta", "users", number);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      alert('사용자가 존재하지 않습니다.');
      setInputs({ number: '', pw: '' });
      return;
    }

    const userData = userDocSnap.data();
    if (!userData) {
      alert('사용자 데이터가 없습니다.');
      setInputs({ number: '', pw: '' });
      return;
    }

    if (userData.password === pw) {
      setUser(number);
      setYear(userData.year ? userData.year : {});
      localStorage.setItem('user', number);
      localStorage.setItem("year", JSON.stringify(userData.year ? userData.year : {}));

      // "admin" 로그인 시 로그 추가
      if (number === "admin") {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const logEntry = { [now]: `${number}` }; // 로그 엔트리 생성

        // 기존 로그 데이터 가져오기
        const iniData = iniDocSnap.data();
        const existingLog = iniData.log || {};

        // 새 로그 엔트리와 기존 로그 병합
        const updatedLog = { ...existingLog, ...logEntry };

        // 로그 업데이트
        await updateDoc(iniDocRef, { log: updatedLog });
      }

      history.push('/');
    } else {
      alert('비밀번호가 일치하지 않습니다.');
      setInputs({ number: '', pw: '' });
    }
  }, [number, pw, props.manage, setUser, setYear, history]);

  return (
    <div className='container'>
      <div className='login'>
        <div className='visual'>
          <div className='visualText'>
            <div className='textGroup'>
              <span>항</span><span>공</span><span>정</span><span>비</span><span>사</span>
              <span>피</span><span>로</span><span>도</span><span>관</span><span>리</span>
              <span>체</span><span>크</span><span>리</span><span>스</span><span>트</span>
            </div>
            <img className='visualLogo' src={mnd} alt={'logo'} />
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); }}>
          <div className='armyWrap'>
            <div className={'input'}>
              <input
                className={'id'}
                type="text"
                id='number'
                name="number"
                maxLength={16}
                placeholder="아이디"
                onChange={onChange}
                value={number}
              />
            </div>
            <div className={'input'}>
              <input
                className={'pw'}
                type={view ? 'text' : 'password'}
                id='pw'
                name="pw"
                maxLength={16}
                placeholder="비밀번호"
                onChange={onChange}
                autoComplete="off"
                value={pw}
              />
              <button
                className='passView'
                type="button"
                onClick={() => setView(!view)}
                title="pass view"
              >
                <i className={view ? "ri-eye-off-line" : "ri-eye-line"}></i>
              </button>
              <span className={'vali'}>
                {number === "" && pw === ""
                  ? '아이디와 비밀번호는 관리자에게 문의하세요'
                  : number === 'fail'
                    ? '올바른 아이디가 아닙니다'
                    : pw === 'fail'
                      ? '비밀번호를 입력하세요'
                      : pw === 'same'
                        ? '비밀번호가 일치하지 않습니다'
                        : ''}
              </span>
            </div>
          </div>
          <div className='controll'>
            <div className='buttonContainer'>
              <button
                className={'button sign'}
                type="button"
                onClick={onCheck}
                disabled={!number || !pw} // 아이디나 비밀번호가 비어있으면 비활성화
              >
                시작하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;