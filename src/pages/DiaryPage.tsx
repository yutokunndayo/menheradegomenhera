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

function LineGraph({ myScores, partnerScores, myGender }: {
    myScores: number[]; partnerScores: number[]; myGender: MyGender;
}) {
    const W = 300, H = 64, PAD_X = 0, PAD_Y = 6;
    const myColor   = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";
    const myValid      = myScores.length >= 2;
    const partnerValid = partnerScores.length >= 2;
    if (!myValid && !partnerValid) {
        return (
            <svg className="diary-graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                <text x={W / 2} y={H / 2 + 5} textAnchor="middle" fontSize="11" fill="#bbb">データがまだありません</text>
            </svg>
        );
    }
    const toY = (s: number) => H - PAD_Y - (s / 4) * (H - PAD_Y * 2);
    const toX = (i: number, len: number) => len <= 1 ? W / 2 : PAD_X + (i / (len - 1)) * (W - PAD_X * 2);
    const toPath = (scores: number[]) => scores.map((s, i) => `${i === 0 ? "M" : "L"} ${toX(i, scores.length)} ${toY(s)}`).join(" ");
    return (
        <svg className="diary-graph-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {[0,1,2,3,4].map(v => <line key={v} x1={0} y1={toY(v)} x2={W} y2={toY(v)} stroke="#f0d0d8" strokeWidth="0.5" strokeDasharray="3,3" />)}
            {partnerValid && (<><path d={toPath(partnerScores)} fill="none" stroke={pareColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{partnerScores.map((s,i)=><circle key={`p${i}`} cx={toX(i,partnerScores.length)} cy={toY(s)} r="3" fill={pareColor}/>)}</>)}
            {myValid && (<><path d={toPath(myScores)} fill="none" stroke={myColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />{myScores.map((s,i)=><circle key={`m${i}`} cx={toX(i,myScores.length)} cy={toY(s)} r="3" fill={myColor}/>)}</>)}
        </svg>
    );
}

function DiaryPage() {
    const navigate = useNavigate();
    const [myGender, setMyGender]       = useState<MyGender>(getCachedGender() ?? "boyfriend");
    const [myId,     setMyId]           = useState<string | null>(null);
    const [partnerId, setPartnerId]     = useState<string | null>(null);
    const [genderReady, setGenderReady] = useState<boolean>(getCachedGender() !== null);
    const [selectedIndex, setSelectedIndex] = useState<EmotionId>(2);
    const [comment,  setComment]        = useState("ふつう");
    const [isSent,   setIsSent]         = useState(false);
    const [myScores,      setMyScores]      = useState<number[]>([]);
    const [partnerScores, setPartnerScores] = useState<number[]>([]);

    useEffect(() => {
        const init = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
            if (profile.partner) setPartnerId(profile.partner);
            setGenderReady(true);

            const now  = new Date();
            const ymd  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
            const from = `${ymd}T00:00:00`;
            const to   = `${ymd}T23:59:59`;

            const { data: todayLog, error: todayError } = await supabase
                .from("diary_entries")
                .select("emotion, text")
                .eq("user_id", profile.id)
                .gte("created_at", from)
                .lte("created_at", to)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (todayError) {
                console.error("%c[Diary] 今日のログ取得エラー", "color:red;font-weight:bold",
                    "\ncode:", todayError.code,
                    "\nmessage:", todayError.message,
                    "\ndetails:", todayError.details,
                    "\nhint:", todayError.hint
                );
            } else if (todayLog) {
                setSelectedIndex(todayLog.emotion as EmotionId);
                setComment(todayLog.text ?? EMOTIONS[todayLog.emotion].name);
            }

            const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const { data: myLogs } = await supabase
                .from("diary_entries").select("emotion, created_at")
                .eq("user_id", profile.id).gte("created_at", since)
                .order("created_at", { ascending: true });
            if (myLogs && myLogs.length > 0) setMyScores(myLogs.slice(-7).map(l => l.emotion));

            if (profile?.partner) {
                const { data: pLogs } = await supabase
                    .from("diary_entries").select("emotion, created_at")
                    .eq("user_id", profile.partner).gte("created_at", since)
                    .order("created_at", { ascending: true });
                if (pLogs && pLogs.length > 0) setPartnerScores(pLogs.slice(-7).map(l => l.emotion));
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
        if (!myId) {
            console.error("%c[Diary] myId が null — ログインしていない可能性", "color:red;font-weight:bold");
            return;
        }

        try {
            // ===== Step1: 認証状態を確認 =====
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.error("%c[Diary] 認証エラー — ログインが切れている可能性", "color:red;font-weight:bold", authError);
                return;
            }
            console.log("%c[Diary] 認証OK userId:", "color:#4caf50;font-weight:bold", user.id, "myId:", myId);

            // ===== Step2: 今日の既存レコードを確認 =====
            const now  = new Date();
            const ymd  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
            const from = `${ymd}T00:00:00`;
            const to   = `${ymd}T23:59:59`;

            console.log("%c[Diary] 既存レコード確認中...", "color:#4dd0e1;font-weight:bold", { myId, from, to });

            const { data: existing, error: selectError } = await supabase
                .from("diary_entries")
                .select("id")
                .eq("user_id", myId)
                .gte("created_at", from)
                .lte("created_at", to)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (selectError) {
                console.error("%c[Diary] SELECT エラー", "color:red;font-weight:bold",
                    "\ncode:", selectError.code,
                    "\nmessage:", selectError.message,
                    "\ndetails:", selectError.details,
                    "\nhint:", selectError.hint
                );
                return;
            }

            console.log("%c[Diary] 既存レコード:", "color:#4dd0e1;font-weight:bold", existing);

            if (existing) {
                // ===== Step3a: UPDATE =====
                console.log("%c[Diary] UPDATE 実行 id:", "color:#4dd0e1;font-weight:bold", existing.id,
                    "emotion:", selectedIndex, "text:", comment.trim() || null);

                const { error: updateError } = await supabase
                    .from("diary_entries")
                    .update({ emotion: selectedIndex, text: comment.trim() || null })
                    .eq("id", existing.id);

                if (updateError) {
                    console.error("%c[Diary] UPDATE エラー 403の原因はここ", "color:red;font-weight:bold",
                        "\ncode:", updateError.code,
                        "\nmessage:", updateError.message,
                        "\ndetails:", updateError.details,
                        "\nhint:", updateError.hint
                    );
                    throw updateError;
                }
                console.log("%c[Diary] UPDATE 成功 ✅", "color:#4caf50;font-weight:bold");

            } else {
                // ===== Step3b: INSERT =====
                console.log("%c[Diary] INSERT 実行 emotion:", "color:#4dd0e1;font-weight:bold",
                    selectedIndex, "text:", comment.trim() || null, "user_id:", myId);

                const { error: insertError } = await supabase
                    .from("diary_entries")
                    .insert({ user_id: myId, emotion: selectedIndex, text: comment.trim() || null });

                if (insertError) {
                    console.error("%c[Diary] INSERT エラー 403の原因はここ", "color:red;font-weight:bold",
                        "\ncode:", insertError.code,
                        "\nmessage:", insertError.message,
                        "\ndetails:", insertError.details,
                        "\nhint:", insertError.hint
                    );
                    throw insertError;
                }
                console.log("%c[Diary] INSERT 成功 ✅", "color:#4caf50;font-weight:bold");
            }

            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                setComment(EMOTIONS[selectedIndex].name);
            }, 3000);

        } catch (e) {
            console.error("%c[Diary] 送信エラー（詳細）", "color:red;font-weight:bold", e);
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
                        <div key={em.id}
                            className={`diary-emotion-item ${index === selectedIndex ? "selected" : ""}`}
                            onClick={() => { setSelectedIndex(index as EmotionId); setComment(em.name); setIsSent(false); }}>
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
