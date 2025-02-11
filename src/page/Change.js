import React, { useContext, useState, useCallback } from 'react';
import { useHistory } from "react-router-dom";
import { doc, updateDoc } from 'firebase/firestore';
import context from '../component/Context';

const App = (props) => {
  const state = useContext(context);
  const { setUser } = state;
  const [inputs, setInputs] = useState({
    number: "",
    pw: "",
  });
  const { number, pw } = inputs;
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

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const onUpdate = useCallback(async () => {
    const hashedPw = await hashPassword(pw);  // 비밀번호를 해시 처리

    try {
      await updateDoc(doc(props.manage, "ini"), {
        adminID: number,
        adminPW: hashedPw,
      });
      // 완료 후 수행할 작업
      setUser(null);
      localStorage.removeItem('user');
      history.replace('/');
      alert('변경 완료 되었습니다.');
    } catch (error) {
      console.error("Error updating document: ", error);
    }

  }, [props.manage, number, pw, setUser, history]);


  return (
    <div className='container'>
      <div className='login change'>
        <h2 className='title'>개인정보변경</h2>
        <div>
          <form onSubmit={(e) => { e.preventDefault(); }}>
            <div className='armyWrap'>
              <div className={'input'}>
                <input
                  className={'id'}
                  type="text"
                  id='number'
                  name="number"
                  maxLength={12}
                  placeholder="변경할 아이디"
                  onChange={onChange}
                  value={number}
                />
              </div>
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
                <span className={'vali'}>아이디와 비밀번호는 최대 12자리 입니다.</span>
              </div>
            </div>
            <div className='controll'>
              <div className='buttonContainer'>
                <button className={'button back'} onClick={onBack}>이전</button>
                <button className={'button sign'} type="button" onClick={onUpdate} disabled={!number || !pw}>변경</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
