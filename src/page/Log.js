import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";

const Log = (props) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const iniDocRef = doc(props.manage, "ini");
                const iniDocSnap = await getDoc(iniDocRef);
                if (iniDocSnap.exists()) {
                    const iniData = iniDocSnap.data();
                    const logEntries = iniData.log || {};

                    // logEntries는 { timestamp(문자열): number } 형태입니다.
                    const logList = Object.entries(logEntries).map(([timestamp, number]) => ({
                        timestamp,
                        number,
                    }));

                    // 최신 로그가 위에 오도록 내림차순 정렬
                    logList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                    setLogs(logList);
                } else {
                    setLogs([]);
                }
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchLogs();
    }, [props.manage]);

    if (loading) return <div>로딩중...</div>;
    if (error) return <div>에러 발생: {error}</div>;

    return (
        <div className='view'>
            <div className='logContainer'>
                <h3 className='teamStatsTitle'>로그 목록</h3>
                {logs.length === 0 ? (
                    <p>등록된 로그가 없습니다.</p>
                ) : (
                    <table className='noUserTable'>
                        <thead>
                            <tr>
                                <th>로그 시간</th>
                                <th>사용자 번호</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index}>
                                    <td>{log.timestamp}</td>
                                    <td>{log.number}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Log;