import React, { useState, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const Write = (props) => {
	// 테스트 데이터 상태
	const [testId, setTestId] = useState('');
	const [testName, setTestName] = useState('');
	const [testType, setTestType] = useState('mental_health');
	// '문제' 및 '보기' 입력 상태로 변경
	const [question, setQuestion] = useState('');
	const [options, setOptions] = useState('');

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
		} catch (error) {
			console.error('등록 오류', error);
			alert('데이터 등록에 실패하였습니다.');
		}
	}, [testId, testName, testType, question, options, props.manage]);

	return (
		<div style={{ padding: '20px' }}>
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
		</div>
	);
};

export default Write;
