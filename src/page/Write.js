import React, { useContext, useState, useCallback } from 'react';
import context from '../component/Context';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';  // 추가된 부분

const Write = (props) => {
	const state = useContext(context);
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

	// 새로 추가: 대량 등록을 위한 엑셀 파일 상태와 처리 상태
	const [excelFile, setExcelFile] = useState(null);
	const [bulkStatus, setBulkStatus] = useState("");

	const onExcelFileChange = useCallback((e) => {
		setExcelFile(e.target.files[0]);
	}, []);

	const bulkRegisterFromExcel = useCallback(async () => {
		if (!excelFile) {
			alert("엑셀 파일을 선택해주세요.");
			return;
		}
		const data = await excelFile.arrayBuffer();
		const workbook = XLSX.read(data);
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const jsonData = XLSX.utils.sheet_to_json(worksheet);
		let successCount = 0, failCount = 0;
		for (const row of jsonData) {
			const { number, password, name, rank, team } = row;
			if (!number || !password || !name || !rank || !team) continue;
			try {
				const userRef = doc(props.manage, "meta", "users", String(number));
				const userSnap = await getDoc(userRef);
				if (userSnap.exists()) {
					await updateDoc(userRef, { password, name, rank, team });
				} else {
					await setDoc(userRef, { number, password, name, rank, team, answers: {} });
				}
				successCount++;
			} catch (error) {
				console.error("대량 사용자 등록 오류", error);
				failCount++;
			}
		}
		setBulkStatus(`등록 성공: ${successCount}명, 실패: ${failCount}명`);
	}, [excelFile, props.manage]);

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
	}, [userInputs, props.manage]);

	// 새로 추가: 사용자 삭제 함수
	const deleteUser = useCallback(async () => {
		if (!userInputs.number) {
			alert('아이디가 필요합니다.');
			return;
		}
		if (!window.confirm('정말 삭제하시겠습니까?')) return;
		const userRef = doc(props.manage, "meta", "users", userInputs.number);
		try {
			await deleteDoc(userRef);
			alert('사용자 삭제 성공');
			setUserInputs({ number: '', password: '', name: '', rank: '', team: '' });
		} catch (error) {
			console.error('사용자 삭제 오류', error);
			alert('사용자 삭제에 실패하였습니다.');
		}
	}, [userInputs.number, props.manage]);

	return (
		<div className='view'>
			<div className='users'>
				<div className='tableContents'>
					<section>
						<h3 className='teamStatsTitle'>테스트 데이터 등록</h3>
						<div className='sectionContents'>
							<div className='controll'>
								<div className='buttonContainer'>
									{/* 프리셋 버튼 추가 */}
									<button className="button back" onClick={fillMentalTest}>정신건강</button>
									<button className="button back" onClick={fillPhysicalTest}>신체건강</button>
								</div></div>
							<div>
								<label>Test ID (필수)</label>
								<input type="text" value={testId} onChange={onChangeField(setTestId)} />
							</div>
							<div>
								<label>Test Name</label>
								<input type="text" value={testName} onChange={onChangeField(setTestName)} />
							</div>
							<div>
								<label>Test Type</label>
								<input type="text" value={testType} onChange={onChangeField(setTestType)} />
							</div>
							<div>
								{/* 라벨 변경: 문제: */}
								<label>Question</label>
								<input type="text" value={question} onChange={onChangeField(setQuestion)} placeholder="문제를 입력하세요" />
							</div>
							<div>
								{/* 라벨 변경: 보기: */}
								<label>Answers (","로 구분):</label>
								<textarea value={options} onChange={onChangeField(setOptions)} placeholder="옵션을 입력하세요"></textarea>
							</div>
						</div>
						<div className='controll write'>
							<div className='buttonContainer'>
								<button className="button" onClick={onSave}>저장</button>
							</div>
						</div>
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
					</section>
					<section>
						<h3 className='teamStatsTitle'>사용자 조회</h3>
						<div className='sectionContents'>
							<div>
								<label>아이디</label>
								<input
									type="text"
									value={userInputs.number}
									onChange={onChangeUserField('number')}
									placeholder="아이디를 입력하세요"
								/>
							</div>

						</div>
						<div className='controll write'>
							<div className='buttonContainer'>
								<button
									className="button"
									disabled={!userInputs.number} // 조회 입력 값이 있어야 활성화
									onClick={async () => {
										const userRef = doc(props.manage, "meta", "users", userInputs.number);
										try {
											const userSnap = await getDoc(userRef);
											if (userSnap.exists()) {
												const userData = userSnap.data();
												// 사용자 정보가 있는 경우, alert대신 입력 필드 업데이트
												setUserInputs({
													number: userData.number || '',
													password: userData.password || '',
													name: userData.name || '',
													rank: userData.rank || '',
													team: userData.team || '',
												});
											} else {
												alert('사용자를 찾을 수 없습니다.');
											}
										} catch (error) {
											console.error('사용자 조회 오류', error);
											alert('사용자 조회에 실패하였습니다.');
										}
									}}
								>
									사용자 조회
								</button>
								<button
									className="button"
									disabled={!userInputs.name} // 조회된 사용자가 있어야 활성화
									onClick={deleteUser}
									style={{ marginLeft: '10px' }}
								>
									사용자 삭제
								</button>
							</div>
						</div>
					</section>
					<section>
						<h3 className='teamStatsTitle'>사용자 등록</h3>
						<div className='sectionContents'>
							<div>
								<label>아이디</label>
								<input
									type="text"
									value={userInputs.number}
									onChange={onChangeUserField('number')}
									placeholder="아이디을 입력하세요"
								/>
							</div>
							<div>
								<label>비밀번호</label>
								<input
									type="password"
									value={userInputs.password}
									onChange={onChangeUserField('password')}
									placeholder="비밀번호를 입력하세요"
								/>
							</div>
							<div>
								<label>작업자</label>
								<input
									type="text"
									value={userInputs.name}
									onChange={onChangeUserField('name')}
									placeholder="이름을 입력하세요"
								/>
							</div>
							<div>
								<label>계급</label>
								<input
									type="text"
									value={userInputs.rank}
									onChange={onChangeUserField('rank')}
									placeholder="계급을 입력하세요"
								/>
							</div>
							<div>
								<label>공장명</label>
								<input
									type="text"
									value={userInputs.team}
									onChange={onChangeUserField('team')}
									placeholder="공장명을 입력하세요"
								/>
							</div>
						</div>
						<div className='controll write'>
							<div className='buttonContainer'>
								<button className="button" onClick={registerUser}>사용자 등록</button>
							</div>
						</div>
					</section>

					<section>

						<h3 className='teamStatsTitle'>Excel 사용자 등록</h3>
						{/* 새로 추가: 대량 사용자 등록 (Excel) */}
						<div className='sectionContents'>
							<div>
								<input type="file" accept=".xlsx, .xls" onChange={onExcelFileChange} />

							</div>
							<div className='controll write'>
								<div className='buttonContainer'>
									<button onClick={bulkRegisterFromExcel} style={{ marginLeft: '10px' }}>대량 등록 실행</button>
									{bulkStatus && <p>{bulkStatus}</p>}
								</div>
							</div>

						</div>
					</section>
				</div>

			</div>




		</div>
	);
};

export default Write;
