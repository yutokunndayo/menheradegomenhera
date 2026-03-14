import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppHeader from "../components/AppHeader";
import TabBar from "../components/TabBar";

// ===== 感情画像 import =====
import happyImage from "../assets/happy.png";
import sadImage from "../assets/sad.png";
import angryImage from "../assets/angry.png";
import normalImage from "../assets/normal.png";
import funImage from "../assets/fun.png";

import "../styles/diary.css";

// ===== 感情定義 =====
// index 0=angry 1=sad 2=normal 3=happy 4=fun
// スライダーは左=しんどい → 右=たのしい
const EMOTIONS = [
    { id: 0, name: "しんどい", image: angryImage, color: "#b0bec5" },
    { id: 1, name: "かなしい", image: sadImage, color: "#90caf9" },
    { id: 2, name: "ふつう", image: normalImage, color: "#ffcc80" },
    { id: 3, name: "うれしい", image: happyImage, color: "#f48fb1" },
    { id: 4, name: "たのしい", image: funImage, color: "#ef9a9a" },
] as const;

type EmotionId = 0 | 1 | 2 | 3 | 4;
type MyGender = "boyfriend" | "girlfriend";

// ===== ダミーグラフデータ（DB接続後は削除） =====
const DUMMY_MY_SCORES = [2, 1, 3, 2, 4, 3, 2];
const DUMMY_PARTNER_SCORES = [3, 2, 1, 3, 2, 4, 3];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ===== 折れ線グラフ =====
function LineGraph({
    myScores,
    partnerScores,
    myGender,
}: {
    myScores: number[];
    partnerScores: number[];
    myGender: MyGender;
}) {
    const W = 300, H = 80, PAD = 8;
    const n = myScores.length;
    const toY = (s: number) => H - PAD - (s / 4) * (H - PAD * 2);
    const toX = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);
    const toPath = (scores: number[]) =>
        scores.map((s, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(s)}`).join(" ");

    const myColor = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";

    return (
        <svg className="diary-graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            {[0, 1, 2, 3, 4].map(v => (
                <line key={v} x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
                    stroke="#f0d0d8" strokeWidth="0.5" strokeDasharray="3,3" />
            ))}
            <path d={toPath(partnerScores)} fill="none" stroke={pareColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(myScores)} fill="none" stroke={myColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {myScores.map((s, i) => <circle key={`m${i}`} cx={toX(i)} cy={toY(s)} r="3" fill={myColor} />)}
            {partnerScores.map((s, i) => <circle key={`p${i}`} cx={toX(i)} cy={toY(s)} r="3" fill={pareColor} />)}
        </svg>
    );
}

// ===== メイン =====
function DiaryPage() {
    const navigate = useNavigate();
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [selectedIndex, setSelectedIndex] = useState<EmotionId>(2);
    const [comment, setComment] = useState("ふつう");
    const [isSent, setIsSent] = useState(false);
    const [myScores] = useState<number[]>(DUMMY_MY_SCORES);
    const [partnerScores] = useState<number[]>(DUMMY_PARTNER_SCORES);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("profiles").select("gender").eq("id", user.id).single();
            if (data?.gender) setMyGender(data.gender as MyGender);
        };
        fetchProfile();
    }, []);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const idx = parseInt(e.target.value) as EmotionId;
        setSelectedIndex(idx);
        setIsSent(false);
    };

    const handleSliderEnd = (e: React.PointerEvent<HTMLInputElement>) => {
        setComment(EMOTIONS[parseInt((e.target as HTMLInputElement).value)].name);
    };

    const handleSubmit = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = JSON.stringify({ emotion: selectedIndex, text: comment });
        try {
            const { error } = await supabase.from("メッセージストレージ").insert({
                id: user.id,
                sendAt: new Date().toISOString(),
                message: payload,
                isMemory: true,
            });
            if (error) throw error;
            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                setComment(EMOTIONS[selectedIndex].name);
            }, 3000);
        } catch (e) {
            console.error("送信エラー:", e);
        }
    };

    const currentEmotion = EMOTIONS[selectedIndex];
    const sliderBg = `linear-gradient(to right, #f5317f 0%, #f5317f ${(selectedIndex / 4) * 100}%, #fce4ec ${(selectedIndex / 4) * 100}%, #fce4ec 100%)`;

    return (
        <div className="diary-wrapper">
            <AppHeader variant="simple" title="一言日記" />

            {/* ===== 感情選択エリア ===== */}
            <div className="diary-emotion-area">

                {/* 感情ボール列 */}
                <div className="diary-emotion-row">
                    {EMOTIONS.map((em, index) => (
                        <div
                            key={em.id}
                            className={`diary-emotion-item ${index === selectedIndex ? "selected" : ""}`}
                            onClick={() => {
                                setSelectedIndex(index as EmotionId);
                                setComment(em.name);
                                setIsSent(false);
                            }}
                        >
                            <img src={em.image} alt={em.name} className="diary-emotion-img" />
                        </div>
                    ))}
                </div>

                {/* スライダー（感情ラベルは表示しない） */}
                <div className="diary-slider-wrap">
                    <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={selectedIndex}
                        onChange={handleSliderChange}
                        onPointerUp={handleSliderEnd}
                        className="diary-slider"
                        style={{ background: sliderBg }}
                    />
                </div>
            </div>

            {/* ===== コメント入力 ===== */}
            <div className="diary-input-area">
                <p className="diary-input-label">今日の一言</p>
                <input
                    className="diary-comment-input"
                    type="text"
                    placeholder={currentEmotion.name}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>

            {/* ===== 送信ボタン ===== */}
            <div className="diary-submit-wrap">
                <button
                    className={`diary-submit-btn ${isSent ? "sent" : ""}`}
                    onClick={handleSubmit}
                    disabled={isSent}
                >
                    {isSent ? "送信完了 ✓" : "送信"}
                </button>
            </div>

            {/* ===== 1週間の気持ちグラフ（タップでカレンダーへ） ===== */}
            <div
                className="diary-graph-area"
                onClick={() => navigate("/diary-calendar")}
                style={{ cursor: "pointer" }}
            >
                <div className="diary-graph-header">
                    <span className="diary-graph-icon">〜</span>
                    <p className="diary-graph-title">1週間の2人の気持ち</p>
                    <span className="diary-graph-arrow">›</span>
                </div>

                <div className="diary-graph-legend">
                    <div className="legend-item">
                        <div className={`legend-dot legend-dot--${myGender === "boyfriend" ? "cyan" : "pink"}`} />
                        <span>自分</span>
                    </div>
                    <div className="legend-item">
                        <div className={`legend-dot legend-dot--${myGender === "boyfriend" ? "pink" : "cyan"}`} />
                        <span>パートナー</span>
                    </div>
                </div>

                <LineGraph myScores={myScores} partnerScores={partnerScores} myGender={myGender} />

                <div className="diary-graph-xlabels">
                    {WEEK_LABELS.map(d => (
                        <span key={d} className="diary-graph-xlabel">{d}</span>
                    ))}
                </div>
            </div>

            <TabBar />
        </div>
    );
}

export default DiaryPage;