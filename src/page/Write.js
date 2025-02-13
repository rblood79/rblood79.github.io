import React, { useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory, useLocation } from "react-router-dom";
import context from '../component/Context';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getFirestore } from 'firebase/firestore';

const Write = (props) => {
	const state = useContext(context);
	const location = useLocation();
	const history = useHistory();
	const { user } = state;
	// 테스트 데이터 상태
	const [testId, setTestId] = useState('');
	const [testName, setTestName] = useState('');
	const [testType, setTestType] = useState('mental_health');
	// '문제' 및 '보기' 입력 상태로 변경
	const [question, setQuestion] = useState('');
	const [options, setOptions] = useState('');
	// 새로 추가: 저장된 질문 목록
	const [savedQuestions, setSavedQuestions] = useState([]);

	// 수정: 사용자 등록 상태의 키를 "number"로 변경
	const [userInputs, setUserInputs] = useState({
		number: '',
		password: '',
		name: '',
		rank: '',
		team: ''
	});

	// 프리셋 버튼 핸들러
	const fillMentalTest = useCallback(() => {
		setTestId('test_1');
		setTestName('정신건강 테스트');
		setTestType('mental_health');
	}, []);
	const fillPhysicalTest = useCallback(() => {
		setTestId('test_2');
		setTestName('신체건강 테스트');
		setTestType('physical_health');
	}, []);

	// 입력값 변경 핸들러들
	const onChangeField = useCallback((setter) => (e) => {
		setter(e.target.value);
	}, []);

	// 새로 추가: 사용자 등록 입력 변경 핸들러
	const onChangeUserField = useCallback((field) => (e) => {
		setUserInputs(prev => ({ ...prev, [field]: e.target.value }));
	}, []);

	// 저장 버튼 클릭시 실행: 기존 문서가 있으면 questions 배열에 새 질문을 추가, 없으면 생성
	const onSave = useCallback(async () => {
		if (!testId) {
			alert('test_id는 필수 입니다.');
			return;
		}
		// 옵션 문자열에 콤마가 있으면 콤마 기준으로, 없으면 줄바꿈 기준으로 분리 후 공백 제거
		const optionsArray = options.includes(',')
			? options.split(',')
			: options.split('\n');
		const trimmedOptions = optionsArray.map(opt => opt.trim()).filter(opt => opt !== '');
		const newQuestion = {
			question: question,
			options: trimmedOptions
		};
		const docRef = doc(props.manage, testId);
		const docSnap = await getDoc(docRef);
		try {
			if (docSnap.exists()) {
				await updateDoc(docRef, {
					questions: arrayUnion(newQuestion)
				});
			} else {
				await setDoc(docRef, {
					test_id: testId,
					test_name: testName,
					test_type: testType,
					questions: [newQuestion]
				});
			}
			alert('데이터 등록 성공');
			// 새 질문 저장 후 입력 필드 초기화
			setQuestion('');
			setOptions('');
			// 문서 재조회하여 질문 미리보기 업데이트
			const refreshedDoc = await getDoc(docRef);
			if (refreshedDoc.exists()) {
				setSavedQuestions(refreshedDoc.data().questions || []);
			}
		} catch (error) {
			console.error('등록 오류', error);
			alert('데이터 등록에 실패하였습니다.');
		}
	}, [testId, testName, testType, question, options, props.manage]);

	// 수정: registerUser 함수 변경 (문제 등록 방식과 유사하게 동작)
	const registerUser = useCallback(async () => {
		const { number, password, name, rank, team } = userInputs;
		if (!number || !password || !name || !rank || !team) {
			alert('모든 필드를 입력해주세요.');
			return;
		}
		// 수정: "check" 컬렉션 아래 바로 "users" 하위 컬렉션에 사용자 문서를 생성
		const userRef = doc(props.manage, "meta", "users", number);
		const userSnap = await getDoc(userRef);
		try {
			if (userSnap.exists()) {
				await updateDoc(userRef, {
					password,
					name,
					rank,
					team
				});
			} else {
				await setDoc(userRef, {
					number,
					password,
					name,
					rank,
					team,
					answers: {}
				});
			}
			alert('사용자 등록 성공');
			//setUserInputs({ number: '', password: '', name: '', rank: '', team: '' });
		} catch (error) {
			console.error('사용자 등록 오류', error);
			alert('사용자 등록에 실패하였습니다.');
		}
	}, [userInputs]);

	return (
		<div>
			{user === 'rblood' &&
				<div>
					<h2>테스트 데이터 등록</h2>
					<div>
						{/* 프리셋 버튼 추가 */}
						<button onClick={fillMentalTest}>정신건강 테스트 적용</button>
						<button onClick={fillPhysicalTest}>신체건강 테스트 적용</button>
					</div>
					<div>
						<label>Test ID (필수):</label>
						<input type="text" value={testId} onChange={onChangeField(setTestId)} />
					</div>
					<div>
						<label>Test Name:</label>
						<input type="text" value={testName} onChange={onChangeField(setTestName)} />
					</div>
					<div>
						<label>Test Type:</label>
						<input type="text" value={testType} onChange={onChangeField(setTestType)} />
					</div>
					<hr />
					<div>
						{/* 라벨 변경: 문제: */}
						<label>문제:</label>
						<input type="text" value={question} onChange={onChangeField(setQuestion)} placeholder="문제를 입력하세요" />
					</div>
					<div>
						{/* 라벨 변경: 보기: */}
						<label>보기 (","로 구분):</label>
						<textarea value={options} onChange={onChangeField(setOptions)} placeholder="옵션을 입력하세요"></textarea>
					</div>
					<hr />
					<button onClick={onSave}>저장</button>
					{/* 새로 추가: 저장된 질문 미리보기 */}
					{savedQuestions.length > 0 && (
						<div style={{ marginTop: '20px' }}>
							<h3>저장된 질문 목록</h3>
							<ul>
								{savedQuestions.map((q, idx) => (
									<li key={idx}>
										<strong>{`Q${idx + 1}: `}</strong>{q.question} <br />
										<em>{`보기: ${q.options.join(', ')}`}</em>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			}


			{/* 수정: 사용자 등록 폼에서 "militaryNumber" 대신 "number" 사용 */}
			<div>
				<h2>사용자 등록</h2>
				<div>
					<label>아이디:</label>
					<input
						type="text"
						value={userInputs.number}
						onChange={onChangeUserField('number')}
						placeholder="아이디을 입력하세요"
					/>
				</div>
				<div>
					<label>비밀번호:</label>
					<input
						type="password"
						value={userInputs.password}
						onChange={onChangeUserField('password')}
						placeholder="비밀번호를 입력하세요"
					/>
				</div>
				<div>
					<label>작업자:</label>
					<input
						type="text"
						value={userInputs.name}
						onChange={onChangeUserField('name')}
						placeholder="이름을 입력하세요"
					/>
				</div>
				<div>
					<label>계급:</label>
					<input
						type="text"
						value={userInputs.rank}
						onChange={onChangeUserField('rank')}
						placeholder="계급을 입력하세요"
					/>
				</div>
				<div>
					<label>공장명:</label>
					<input
						type="text"
						value={userInputs.team}
						onChange={onChangeUserField('team')}
						placeholder="공장명을 입력하세요"
					/>
				</div>
				<button onClick={registerUser} style={{ marginTop: '10px' }}>사용자 등록</button>
			</div>
		</div>
	);
};

export default Write;
