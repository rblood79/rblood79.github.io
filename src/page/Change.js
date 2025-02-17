import React, { useContext, useState, useCallback } from 'react';
import { useHistory } from "react-router-dom";
import { doc, updateDoc } from 'firebase/firestore';
import context from '../component/Context';

const App = (props) => {
  const state = useContext(context);
  const { user, setUser } = state; // user 컨텍스트에서 사용자 ID 가져오기
  const [inputs, setInputs] = useState({
    pw: "",
  });
  const { pw } = inputs;
  const history = useHistory();

  // 입력 변경 핸들러
  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setInputs((prevInputs) => ({
      ...prevInputs,
      [name]: value || "",
    }));
  }, []);

  const onBack = () => {
    history.goBack();
  };

  const onUpdate = useCallback(async () => {
    if (!pw) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    try {
      // 현재 로그인한 사용자의 문서 업데이트
      await updateDoc(doc(props.manage, "meta", "users", user), {
        password: pw, // 새로운 비밀번호로 업데이트
      });
      // 완료 후 수행할 작업
      setUser(null);
      localStorage.removeItem('user');
      history.replace('/');
      alert('비밀번호 변경 완료 되었습니다.');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  }, [props.manage, pw, setUser, history, user]);

  return (
    <div className='container'>
      <div className='login change'>
        <h2 className='title'>비밀번호 변경</h2>
        <div>
          <form onSubmit={(e) => { e.preventDefault(); }}>
            <div className='armyWrap'>
              <div className={'input'}>
                <input
                  className={'pw'}
                  type="text"
                  id='pw'
                  name="pw"
                  maxLength={12}
                  placeholder="변경할 비밀번호"
                  onChange={onChange}
                  autoComplete="off"
                  value={pw}
                />
                <span className={'vali'}>비밀번호는 최대 12자리 입니다.</span>
              </div>
            </div>
            <div className='controll'>
              <div className='buttonContainer'>
                <button className={'button back'} onClick={onBack}>이전</button>
                <button className={'button sign'} type="button" onClick={onUpdate} disabled={!pw}>변경</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
