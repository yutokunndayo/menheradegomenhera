import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCachedProfile, getCachedGender } from "../lib/userCache";
import AppHeader from "../components/AppHeader";
import TabBar from "../components/TabBar";
import TitlePage from "./TitlePage";
import happyImage  from "../assets/happy.png";
import sadImage    from "../assets/sad.png";
import angryImage  from "../assets/angry.png";
import normalImage from "../assets/normal.png";
import funImage    from "../assets/fun.png";
import "../styles/diary.css";

const EMOTIONS = [
    { id: 0, name: "しんどい", image: angryImage,  color: "#b0bec5" },
    { id: 1, name: "かなしい", image: sadImage,     color: "#90caf9" },
    { id: 2, name: "ふつう",   image: normalImage,  color: "#ffcc80" },
    { id: 3, name: "うれしい", image: happyImage,   color: "#f48fb1" },
    { id: 4, name: "たのしい", image: funImage,     color: "#ef9a9a" },
] as const;

type EmotionId = 0 | 1 | 2 | 3 | 4;
type MyGender  = "boyfriend" | "girlfriend";

const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ===== 折れ線グラフ =====
function LineGraph({ myScores, partnerScores, myGender }: {
    myScores: number[]; partnerScores: number[]; myGender: MyGender;
}) {
    const W = 300, H = 64, PAD_X = 0, PAD_Y = 6;
    const n = myScores.length;
    const toY = (s: number) => H - PAD_Y - (s / 4) * (H - PAD_Y * 2);
    const toX = (i: number) => PAD_X + (i / (n - 1)) * (W - PAD_X * 2);
    const toPath = (scores: number[]) =>
        scores.map((s, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(s)}`).join(" ");
    const myColor   = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";
    return (
        <svg className="diary-graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {[0,1,2,3,4].map(v => (
                <line key={v} x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke="#f0d0d8" strokeWidth="0.5" strokeDasharray="3,3" />
            ))}
            <path d={toPath(partnerScores)} fill="none" stroke={pareColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d={toPath(myScores)}      fill="none" stroke={myColor}   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {myScores.map((s, i)      => <circle key={`m${i}`} cx={toX(i)} cy={toY(s)} r="3" fill={myColor}   />)}
            {partnerScores.map((s, i) => <circle key={`p${i}`} cx={toX(i)} cy={toY(s)} r="3" fill={pareColor} />)}
        </svg>
    );
}

function DiaryPage() {
    const navigate = useNavigate();
    const [myGender, setMyGender]       = useState<MyGender>(getCachedGender() ?? "boyfriend");
    const [myId,     setMyId]           = useState<string | null>(null);
    const [partnerId, setPartnerId]     = useState<string | null>(null);
    // キャッシュがない場合のみローディングを表示
    const [genderReady, setGenderReady] = useState<boolean>(getCachedGender() !== null);
    const [selectedIndex, setSelectedIndex] = useState<EmotionId>(2);
    const [comment,  setComment]        = useState("ふつう");
    const [isSent,   setIsSent]         = useState(false);
    const [myScores,      setMyScores]      = useState<number[]>([2,1,3,2,4,3,2]);
    const [partnerScores, setPartnerScores] = useState<number[]>([3,2,1,3,2,4,3]);

    useEffect(() => {
        const init = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
            if (profile.partner) setPartnerId(profile.partner);
            setGenderReady(true);

            // ===== 今日の記録を読み込んで初期値にセット =====
            // タイムゾーン問題を避けるためローカル日付でフィルタ
            const now   = new Date();
            const ymd   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
            const from  = `${ymd}T00:00:00`;
            const to    = `${ymd}T23:59:59`;

            const { data: todayLog } = await supabase
                .from("diary_entries")
                .select("emotion, text")
                .eq("user_id", profile.id)
                .gte("created_at", from)
                .lte("created_at", to)
                .single();

            if (todayLog) {
                // 今日すでに送信済み → その値を初期表示
                setSelectedIndex(todayLog.emotion as EmotionId);
                setComment(todayLog.text ?? EMOTIONS[todayLog.emotion].name);
            }

            // ===== 過去7日のスコアを取得 =====
            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

            // 自分のスコア
            const { data: myLogs } = await supabase
                .from("diary_entries")
                .select("emotion, created_at")
                .eq("user_id", profile.id)
                .gte("created_at", since)
                .order("created_at", { ascending: true });

            if (myLogs && myLogs.length > 0) {
                setMyScores(myLogs.slice(-7).map(l => l.emotion));
            }

            // パートナーのスコア
            if (profile?.partner) {
                const { data: pLogs } = await supabase
                    .from("diary_entries")
                    .select("emotion, created_at")
                    .eq("user_id", profile.partner)
                    .gte("created_at", since)
                    .order("created_at", { ascending: true });

                if (pLogs && pLogs.length > 0) {
                    setPartnerScores(pLogs.slice(-7).map(l => l.emotion));
                }
            }
        };
        init();
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
        if (!myId) return;
        try {
            // ローカル日付でフィルタ（タイムゾーンズレ防止）
            const now  = new Date();
            const ymd  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
            const from = `${ymd}T00:00:00`;
            const to   = `${ymd}T23:59:59`;

            const { data: existing } = await supabase
                .from("diary_entries")
                .select("id")
                .eq("user_id", myId)
                .gte("created_at", from)
                .lte("created_at", to)
                .single();

            if (existing) {
                // 今日分を上書き更新
                const { error } = await supabase
                    .from("diary_entries")
                    .update({ emotion: selectedIndex, text: comment.trim() || null })
                    .eq("id", existing.id);
                if (error) throw error;
            } else {
                // 新規作成
                const { error } = await supabase
                    .from("diary_entries")
                    .insert({ user_id: myId, emotion: selectedIndex, text: comment.trim() || null });
                if (error) throw error;
            }

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

    if (!genderReady) return <TitlePage hideTimer />;

    return (
        <div className="diary-wrapper">
            <AppHeader variant="simple" title="一言日記" />

            <div className="diary-emotion-area">
                <div className="diary-emotion-row">
                    {EMOTIONS.map((em, index) => (
                        <div
                            key={em.id}
                            className={`diary-emotion-item ${index === selectedIndex ? "selected" : ""}`}
                            onClick={() => { setSelectedIndex(index as EmotionId); setComment(em.name); setIsSent(false); }}
                        >
                            <img src={em.image} alt={em.name} className="diary-emotion-img" />
                        </div>
                    ))}
                </div>
                <div className="diary-slider-wrap">
                    <input type="range" min="0" max="4" step="1" value={selectedIndex}
                        onChange={handleSliderChange} onPointerUp={handleSliderEnd}
                        className="diary-slider" style={{ background: sliderBg }} />
                </div>
            </div>

            <div className="diary-input-area">
                <p className="diary-input-label">今日の一言</p>
                <input className="diary-comment-input" type="text"
                    placeholder={currentEmotion.name} value={comment}
                    onChange={(e) => setComment(e.target.value)} />
            </div>

            <div className="diary-submit-wrap">
                <button className={`diary-submit-btn ${isSent ? "sent" : ""}`}
                    onClick={handleSubmit} disabled={isSent}>
                    {isSent ? "送信完了 ✓" : "送信"}
                </button>
            </div>

            <div className="diary-graph-area" onClick={() => navigate("/diary-calendar")} style={{ cursor: "pointer" }}>
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
                    {WEEK_LABELS.map(d => <span key={d} className="diary-graph-xlabel">{d}</span>)}
                </div>
            </div>

            <TabBar />
        </div>
    );
}

export default DiaryPage;