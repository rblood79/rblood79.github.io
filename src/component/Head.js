
import React, { useContext } from 'react';
import { useHistory } from "react-router-dom";
import context from './Context';
import { isMobile } from 'react-device-detect';
import logo from '../assets/logo.svg';
const App = (props) => {
  const state = useContext(context);
  const history = useHistory();
  const { user, setUser, setYear } = state;
  const logOut = () => {
    setUser(null);
    setYear(null);
    // localStorage에서 사용자 정보 삭제
    localStorage.removeItem('user');
    localStorage.removeItem('year');

    history.replace('/');
  }

  const change = () => {
    history.push('/change');
  }

  const write = () => {
    history.push('/write');
  }

  /*useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.replace('/');
    } else {
      history.push('/');
    }
  }, [history, setUser, setYear]);*/

  return (
    <header className="head">
      <nav className='nav sub'>
        <div className='headGroup'>
          <div className='headTitle' onClick={()=>{history.push('/')}}><img src={logo} alt='MND' /><span>{user === 'admin' ? '체크리스트 분석표' : '정비사 피로도 체크리스트'}</span></div>
        </div>

        {

          <div className='headRight'>
            {!isMobile && <span>{user && "안녕하세요 " + user + " 님"}</span>}
            {user === 'rblood' ?
              <button className='logout' onClick={write} title="자료등록"><i className="ri-pencil-line"></i></button> :
              <button className='change' onClick={change} title="개인정보변경"><i className="ri-user-settings-line"></i></button>
            }

            <button className='logout' onClick={logOut} title="로그아웃"><i className="ri-logout-box-r-line"></i></button>
          </div>
        }
      </nav>
    </header>
  );
}
export default App;