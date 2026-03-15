import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HiChevronLeft } from "react-icons/hi2";
import happyImage  from "../assets/happy.png";
import sadImage    from "../assets/sad.png";
import angryImage  from "../assets/angry.png";
import normalImage from "../assets/normal.png";
import funImage    from "../assets/fun.png";
import "../styles/diary.css";

const EMOTION_IMAGES = [angryImage, sadImage, normalImage, happyImage, funImage];
const EMOTION_NAMES  = ["しんどい", "かなしい", "ふつう", "うれしい", "たのしい"];
const EMOTION_COLORS = ["#b0bec5", "#90caf9", "#ffcc80", "#f48fb1", "#ef9a9a"];

type MyGender = "boyfriend" | "girlfriend";

function formatDateHeader(dateStr: string) {
    const d    = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function DiaryDetail() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const dateStr  = params.get("date") ?? new Date().toISOString().slice(0, 10);

    const [myGender,       setMyGender]       = useState<MyGender>("boyfriend");
    const [myName,         setMyName]         = useState("自分");
    const [partnerName,    setPartnerName]    = useState("パートナー");
    const [myEmotion,      setMyEmotion]      = useState<number | null>(null);
    const [partnerEmotion, setPartnerEmotion] = useState<number | null>(null);
    const [myText,         setMyText]         = useState<string | null>(null);
    const [partnerText,    setPartnerText]    = useState<string | null>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: myProfile } = await supabase
                .from("profiles").select("name, gender, partner").eq("id", user.id).single();

            // gender: false=彼氏, true=彼女
            setMyGender(myProfile?.gender === false ? "boyfriend" : "girlfriend");
            if (myProfile?.name) setMyName(myProfile.name);

            if (myProfile?.partner) {
                const { data: pProfile } = await supabase
                    .from("profiles").select("name").eq("id", myProfile.partner).single();
                if (pProfile?.name) setPartnerName(pProfile.name);
            }

            // ===== その日の日記を取得 =====
            const from = dateStr + "T00:00:00.000Z";
            const to   = dateStr + "T23:59:59.999Z";

            // 自分の日記
            const { data: myLog } = await supabase
                .from("diary_entries")
                .select("emotion, text")
                .eq("user_id", user.id)
                .gte("created_at", from)
                .lte("created_at", to)
                .single();

            if (myLog) {
                setMyEmotion(myLog.emotion);
                setMyText(myLog.text ?? null);
            }

            // パートナーの日記（RLSで取得可能）
            if (myProfile?.partner) {
                const { data: pLog } = await supabase
                    .from("diary_entries")
                    .select("emotion, text")
                    .eq("user_id", myProfile.partner)
                    .gte("created_at", from)
                    .lte("created_at", to)
                    .single();

                if (pLog) {
                    setPartnerEmotion(pLog.emotion);
                    setPartnerText(pLog.text ?? null);
                }
            }
        };
        fetchDetail();
    }, [dateStr]);

    const myColor   = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";

    return (
        <div className="diary-wrapper">

            <div className="ddetail-header">
                <button className="ddetail-back-btn" onClick={() => navigate(-1)} aria-label="戻る">
                    <HiChevronLeft size={22} color="#f5317f" />
                    <span>{formatDateHeader(dateStr)}</span>
                </button>
            </div>

            <div className="ddetail-body">

                {/* 自分のカード */}
                <div className="ddetail-card" style={{ borderColor: myColor }}>
                    <div className="ddetail-card-header" style={{ background: myColor }}>
                        <span className="ddetail-card-name">{myName}</span>
                    </div>
                    {myEmotion !== null ? (
                        <div className="ddetail-content">
                            <div className="ddetail-emotion-row">
                                <img
                                    src={EMOTION_IMAGES[myEmotion]}
                                    alt={EMOTION_NAMES[myEmotion]}
                                    className="ddetail-emotion-img"
                                    style={{ background: EMOTION_COLORS[myEmotion] }}
                                />
                                <span className="ddetail-emotion-label" style={{ background: myColor }}>
                                    {EMOTION_NAMES[myEmotion]}
                                </span>
                            </div>
                            {myText && <p className="ddetail-text">{myText}</p>}
                        </div>
                    ) : (
                        <p className="ddetail-empty">この日の記録はありません</p>
                    )}
                </div>

                {/* パートナーのカード */}
                <div className="ddetail-card" style={{ borderColor: pareColor }}>
                    <div className="ddetail-card-header" style={{ background: pareColor }}>
                        <span className="ddetail-card-name">{partnerName}</span>
                    </div>
                    {partnerEmotion !== null ? (
                        <div className="ddetail-content">
                            <div className="ddetail-emotion-row">
                                <img
                                    src={EMOTION_IMAGES[partnerEmotion]}
                                    alt={EMOTION_NAMES[partnerEmotion]}
                                    className="ddetail-emotion-img"
                                    style={{ background: EMOTION_COLORS[partnerEmotion] }}
                                />
                                <span className="ddetail-emotion-label" style={{ background: pareColor }}>
                                    {EMOTION_NAMES[partnerEmotion]}
                                </span>
                            </div>
                            {partnerText && <p className="ddetail-text">{partnerText}</p>}
                        </div>
                    ) : (
                        <p className="ddetail-empty">この日の記録はありません</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DiaryDetail;