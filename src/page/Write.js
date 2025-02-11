//import _ from 'lodash';
import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useHistory, useLocation } from "react-router-dom";
import { doc, deleteDoc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import moment from "moment";
import 'moment/locale/ko';
import context from '../component/Context';

const App = (props) => {
  const history = useHistory();
  const state = useContext(context);
  const location = useLocation();
  const { year } = state;

  const [data, setData] = useState(null);
  const [startcompyear, setStartcompyear] = useState(null);
  const [startcompresult, setStartcompresult] = useState(null);
  const [endcompresult, setEndcompresult] = useState(null);
  const [startyear, setStartyear] = useState(null);
  const [startresult, setStartresult] = useState(null);
  const [endresult, setEndresult] = useState(null);
  const [inputs, setInputs] = useState({
    id: '',
    checknum: '',
    leader: '',
    title: '',
    endcompyear: '',
    endyear: '',
    result: '',
    indi: '',
    unit: '',
    datay0: '',
    datay1: '',
    datay2: '',
    datay3: '',
    datay4: '',
    datay5: '',
    color: '',
    before: '',
    after: '',
    other:'',
  });

  const { id, checknum, leader, title, endcompyear, endyear, result, indi, unit, datay0, datay1, datay2, datay3, datay4, datay5, color, before, after, other } = inputs;

  const minYear = useMemo(() => year.min, [year.min]);
  const maxYear = useMemo(() => year.max, [year.max]);
  const colCount = useMemo(() => year.count, [year.count]);

  const useYearRange = useCallback((startYear, endYear) => {
    const yearArray = [];
    for (let y = startYear; y <= endYear; y++) {
      yearArray.push(y.toString());
    }
    return yearArray;
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === 'before' || name === 'after') {
      setInputs(prevInputs => ({ ...prevInputs, [name]: value }))
    } else {
      const lines = value.split('\n');
      if (lines.length <= colCount) {
        name !== 'result' ? setInputs(prevInputs => ({ ...prevInputs, [name]: value })) : setInputs(prevInputs => ({ ...prevInputs, [name]: value.replace(/,/g, '') }));
      } else {
        const limitedValue = lines.slice(0, colCount).join('\n');
        setInputs(prevInputs => ({ ...prevInputs, [name]: limitedValue }));
      }
    };

  }, [colCount]);

  const numbertoCommas = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (location.state) {
        const docRef = doc(props.manage, location.state.userCell);
        const docSnap = await getDoc(docRef);
        if (isMounted) {
          if (docSnap.exists()) {
            setData(docSnap.data());
          } else {
            console.log("No such document!");
          }
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [location.state, props.manage]);

  useEffect(() => {
    if (data) {
      setInputs({
        id: data.ID || '',
        checknum: data.CHECKNUM || '',
        leader: data.LEADER || '',
        title: data.TITLE || '',
        endcompyear: data.ENDCOMPYEAR || '',
        endyear: data.ENDYEAR || '',
        result: data.RESULT || '',
        indi: data.INDI || '',
        unit: data.UNIT || '',
        datay0: data.DATAY0 || '',
        datay1: data.DATAY1 || '',
        datay2: data.DATAY2 || '',
        datay3: data.DATAY3 || '',
        datay4: data.DATAY4 || '',
        datay5: data.DATAY5 || '',
        color: data.COLOR || '',
        before: data.BEFORE || '',
        after: data.AFTER || '',
        other: data.OTHER || '',
      });
      setStartcompyear(data.STARTCOMPYEAR);
      setStartcompresult(data.STARTCOMPRESULT);
      setEndcompresult(data.ENDCOMPRESULT);
      setStartyear(data.STARTYEAR);
      setStartresult(data.STARTRESULT);
      setEndresult(data.ENDRESULT);
    }
  }, [data]);

  const onSave = useCallback(async () => {
    const docRef = doc(props.manage, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      alert(`관리번호 ${id}가 등록 되어있습니다. 기존 자료에서 수정하거나 관리번호를 변경하여 등록하세요.`);
    } else {
      await setDoc(doc(props.manage, id), {
        ID: id,
        CHECKNUM: checknum,
        LEADER: leader,
        TITLE: title,
        STARTCOMPYEAR: startcompyear,
        STARTCOMPRESULT: startcompresult,
        ENDCOMPYEAR: endcompyear,
        ENDCOMPRESULT: endcompresult,
        STARTYEAR: startyear,
        STARTRESULT: startresult,
        ENDYEAR: endyear,
        ENDRESULT: endresult,
        RESULT: result,
        COLOR: color,
        INDI: indi,
        UNIT: unit,
        DATAY0: datay0,
        DATAY1: datay1,
        DATAY2: datay2,
        DATAY3: datay3,
        DATAY4: datay4,
        DATAY5: datay5,
        BEFORE: before,
        AFTER: after,
        OTHER: other,
        DATE: new Date().toUTCString()
      });
      history.push('/', { updated: true });
    }
  }, [id, checknum, leader, title, startcompyear, startcompresult, endcompyear, endcompresult, startyear, startresult, endyear, endresult, result, color, indi, unit, datay0, datay1, datay2, datay3, datay4, datay5, before, after, other, props.manage, history]);

  const onUpdate = useCallback(async () => {
    await updateDoc(doc(props.manage, id), {
      ID: id,
      CHECKNUM: checknum,
      LEADER: leader,
      TITLE: title,
      STARTCOMPYEAR: startcompyear,
      STARTCOMPRESULT: startcompresult,
      ENDCOMPYEAR: endcompyear,
      ENDCOMPRESULT: endcompresult,
      STARTYEAR: startyear,
      STARTRESULT: startresult,
      ENDYEAR: endyear,
      ENDRESULT: endresult,
      RESULT: result,
      COLOR: color,
      INDI: indi,
      UNIT: unit,
      DATAY0: datay0,
      DATAY1: datay1,
      DATAY2: datay2,
      DATAY3: datay3,
      DATAY4: datay4,
      DATAY5: datay5,
      BEFORE: before,
      AFTER: after,
      OTHER: other,
      DATE: new Date().toUTCString()
    });
    history.push('/', { updated: true });
  }, [id, checknum, leader, title, startcompyear, startcompresult, endcompyear, endcompresult, startyear, startresult, endyear, endresult, result, color, indi, unit, datay0, datay1, datay2, datay3, datay4, datay5, before, after, other, props.manage, history]);

  const onDelete = useCallback(async () => {
    if (location.state && window.confirm(`${title} 과제를 삭제하시겠습니까?`)) {
      await deleteDoc(doc(props.manage, location.state.userCell));
      history.push('/', { updated: true });
    }
  }, [location.state, title, props.manage, history]);

  const onBack = useCallback(() => {
    history.push({
      pathname: '/',
      state: location.state
    });
  }, [history, location.state]);

  const onView = useCallback(() => {
    history.push({
      pathname: '/view',
      state: {
        from: location.pathname,
        userCell: location.state.userCell,
        searchState: location.state.searchState
      }
    });
  }, [history, location.pathname, location.state]);

  return (
    <div className='order'>
      <div className='users'>
        <div className='resultHead'>
          <h2 className='title'>과제{data ? '수정' : '등록'}</h2>
          <span className='titleDate'>{data && `마지막 수정일 ${moment(data.DATE).format("YYYY-MM-DD hh:mm:ss")}`}</span>
        </div>
        <div className='formBody'>
          <div className='formGroup'>
            <div className='formWrap span2'>
              <label className='label' htmlFor="TITL">과제명</label>
              <input
                type="text"
                id='TITL'
                name="title"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={title}
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="IDN">{data ? '관리번호' : '관리번호(필수)'}</label>
              <input
                type="text"
                id='IDN'
                name="id"
                placeholder="등록 후 변경 불가"
                onChange={handleInputChange}
                value={id}
                disabled={data}
                className='uniq'
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="CN">확인번호</label>
              <input
                type="text"
                id='CN'
                name="checknum"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={checknum}
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="LD">팀장</label>
              <input
                type="text"
                id='LD'
                name="leader"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={leader}
              />
            </div>

            <div className='formWrap'>
              <label className='label' htmlFor='SCY'>1차 완료평가연도</label>
              <select id="SCY" onChange={(e) => setStartcompyear(e.target.value)} value={startcompyear || "default"}>
                <option value="default" disabled>선택하세요</option>
                {useYearRange(minYear, maxYear).map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.STARTCOMPYEAR && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor='SCR'>1차 완료평가결과</label>
              <select id="SCR" onChange={(e) => setStartcompresult(e.target.value)} value={startcompresult || "default"}>
                <option value="default" disabled>선택하세요</option>
                {["완료", "조건부완료", "중단", "연장", "미평가"].map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.STARTCOMPRESULT && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="ECY">2차 완료평가연도</label>
              <input
                type="text"
                id='ECY'
                name="endcompyear"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={endcompyear}
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor='ECR'>2차 완료평가결과</label>
              <select id="ECR" onChange={(e) => setEndcompresult(e.target.value)} value={endcompresult || "default"}>
                <option value="default" disabled>선택하세요</option>
                {["완료", "조건부완료", "중단", "연장", "1차완료", "미평가"].map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.ENDCOMPRESULT && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap empty'></div>
            <div className='formWrap'>
              <label className='label' htmlFor='SY'>1차 성과평가연도</label>
              <select id="SY" onChange={(e) => setStartyear(e.target.value)} value={startyear || "default"}>
                <option value="default" disabled>선택하세요</option>
                {useYearRange(minYear, maxYear).map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.STARTYEAR && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor='SR'>1차 성과평가결과</label>
              <select id="SR" onChange={(e) => setStartresult(e.target.value)} value={startresult || "default"}>
                <option value="default" disabled>선택하세요</option>
                {["인증", "인증 (대상)", "인증 (금상)", "인증 (은상)", "인증 (동상)", "인증 (장려)", "미인증 (중단)", "미인증 (재도전)"].map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.STARTRESULT && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="EY">2차 성과평가연도</label>
              <input
                type="text"
                id='EY'
                name="endyear"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={endyear}
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor='ER'>2차 성과평가결과</label>
              <select id="ER" onChange={(e) => setEndresult(e.target.value)} value={endresult || "default"}>
                <option value="default" disabled>선택하세요</option>
                {["인증", "인증 (대상)", "인증 (금상)", "인증 (은상)", "인증 (동상)", "인증 (장려)", "미인증 (중단)", "1차인증"].map((item) => (
                  <option value={item} key={item}>{item}</option>
                ))}
                {data && data.ENDRESULT && <option value="">취소</option>}
              </select>
            </div>
            <div className='formWrap empty'></div>
            <div className='formWrap'>
              <label className='label' htmlFor="RES">재무성과(백만원)</label>
              <input
                type="text"
                id='RES'
                name="result"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={numbertoCommas(result)}
              />
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="ID">관리지표<span className='red'>{indi.split('\n').length > 1 && `${indi.split('\n').length}건`}</span></label>
              <textarea
                id='ID'
                name="indi"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={indi}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="UN">단위<span className='red'>{unit.split('\n').length > 1 && `${unit.split('\n').length}건`}</span></label>
              <textarea
                id='UN'
                name="unit"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={unit}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="D0">수치<span className='red'>{datay0.split('\n').length > 1 && `${datay0.split('\n').length}건`}</span></label>
              <textarea
                id='D0'
                name="datay0"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay0}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap'>
              <div className='label' htmlFor='CO'>사후관리상태</div>
              <div className='radioGroup write'>
                {["", "red", "green", "yellow"].map((item, index) => (
                  <div key={item + index}>
                    <input
                      type='radio'
                      name='color'
                      id={item + index}
                      value={item}
                      onChange={handleInputChange}
                      checked={color === item}
                    />
                    <label htmlFor={item + index} className={`radioColor ${item}`}></label>
                  </div>
                ))}
              </div>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="D1">Y+1<span className='red'>{datay1.split('\n').length > 1 && `${datay1.split('\n').length}건`}</span></label>
              <textarea
                id='D1'
                name="datay1"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay1}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="D2">Y+2<span className='red'>{datay2.split('\n').length > 1 && `${datay2.split('\n').length}건`}</span></label>
              <textarea
                id='D2'
                name="datay2"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay2}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="D3">Y+3<span className='red'>{datay3.split('\n').length > 1 && `${datay3.split('\n').length}건`}</span></label>
              <textarea
                id='D3'
                name="datay3"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay3}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="D4">Y+4<span className='red'>{datay4.split('\n').length > 1 && `${datay4.split('\n').length}건`}</span></label>
              <textarea
                id='D4'
                name="datay4"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay4}
                rows={5}
              ></textarea>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="D5">Y+5<span className='red'>{datay5.split('\n').length > 1 && `${datay5.split('\n').length}건`}</span></label>
              <textarea
                id='D5'
                name="datay5"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={datay5}
                rows={5}
              ></textarea>
            </div>

          </div>

          <div className='formGroup beforAfter'>
            <div className='formWrap borderTop'>
              <label className='label' htmlFor="BE">개선 전 주요내용</label>
              <textarea
                id='BE'
                name="before"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={before}
                rows={6}
              ></textarea>
            </div>
            <div className='formWrap'>
              <label className='label' htmlFor="AF">개선 후 주요내용</label>
              <textarea
                id='AF'
                name="after"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={after}
                rows={6}
              ></textarea>
            </div>
            <div className='formWrap borderBottom'>
              <label className='label' htmlFor="OT">기타내용</label>
              <textarea
                id='OT'
                name="other"
                placeholder="입력하세요"
                onChange={handleInputChange}
                value={other}
                rows={6}
              ></textarea>
            </div>
          </div>

        </div>
        <div className='controll'>
          <div className='buttonContainer'>
            <button className={'button back'} onClick={onBack}>이전</button>
            {location.state && <button className={'button delete'} onClick={onDelete}>삭제</button>}
            {location.state ? <button className={'button edit'} onClick={onUpdate}>수정</button> : <button className={'button'} disabled={!id} onClick={onSave}>저장</button>}
            {location.state && <button className={'button detail'} onClick={onView}>출력</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
