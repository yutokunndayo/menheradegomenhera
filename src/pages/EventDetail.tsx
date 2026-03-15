import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HiOutlineClock, HiOutlinePencil, HiOutlineUsers } from "react-icons/hi2";
import { getCachedGender, getCachedProfile } from "../lib/userCache";
import TitlePage from "./TitlePage";
import "../styles/calendar.css";

type MyGender  = "boyfriend" | "girlfriend";
type PickerOpen = "none" | "start-date" | "start-time" | "end-date" | "end-time";

const WEEKDAYS_SHORT = ["月", "火", "水", "木", "金", "土", "日"];
const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// ===== スクロールドラムロール =====
// items: 表示する選択肢配列、value: 現在選択値、onChange: 変更コールバック
const ITEM_H = 44; // 1項目の高さ(px)

function DrumRoll({ items, value, onChange, accent }: {
    items: string[];
    value: string;
    onChange: (v: string) => void;
    accent: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const ignoreScroll = useRef(false);

    // 選択値が変わったらスクロール位置を合わせる
    useEffect(() => {
        const idx = items.indexOf(value);
        if (ref.current && idx >= 0) {
            ignoreScroll.current = true;
            ref.current.scrollTop = idx * ITEM_H;
            setTimeout(() => { ignoreScroll.current = false; }, 100);
        }
    }, [value, items]);

    const handleScroll = useCallback(() => {
        if (ignoreScroll.current || !ref.current) return;
        const idx = Math.round(ref.current.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(items.length - 1, idx));
        if (items[clamped] !== value) onChange(items[clamped]);
    }, [items, value, onChange]);

    return (
        <div style={{ position: "relative", width: 80 }}>
            {/* 選択中ハイライト帯 */}
            <div style={{
                position: "absolute",
                top: ITEM_H * 2,
                left: 4, right: 4,
                height: ITEM_H,
                background: `${accent}22`,
                borderRadius: 8,
                pointerEvents: "none",
                zIndex: 1,
            }} />
            <div
                ref={ref}
                onScroll={handleScroll}
                style={{
                    height: ITEM_H * 5,
                    overflowY: "scroll",
                    scrollSnapType: "y mandatory",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    position: "relative",
                    zIndex: 2,
                }}
            >
                {/* 上下に2個分のパディング */}
                <div style={{ height: ITEM_H * 2 }} />
                {items.map(item => (
                    <div
                        key={item}
                        onClick={() => onChange(item)}
                        style={{
                            height: ITEM_H,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            scrollSnapAlign: "center",
                            fontSize: item === value ? 26 : 18,
                            fontWeight: item === value ? 700 : 400,
                            color: item === value ? "#333" : "#bbb",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            userSelect: "none",
                        }}
                    >
                        {item}
                    </div>
                ))}
                <div style={{ height: ITEM_H * 2 }} />
            </div>
            {/* スクロールバー非表示 */}
            <style>{`div::-webkit-scrollbar{display:none}`}</style>
        </div>
    );
}

// ===== ミニカレンダー日付生成 =====
function buildMiniCalDays(year: number, month: number) {
    const first  = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    const total = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= total; d++) days.push(new Date(year, month, d));
    return days;
}

function formatDateBtn(d: Date) {
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

            if (isEditMode && editId) {
                const { error } = await supabase.from("schedules")
                    .update({ ...payload, user_id: ownerId }).eq("id", editId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("schedules")
                    .insert({ ...payload, user_id: ownerId });
                if (error) throw error;
            }
            navigate("/calendar", { replace: true });
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!editId) { navigate(-1); return; }
        if (!window.confirm("この予定を削除しますか？")) return;
        await supabase.from("schedules").delete().eq("id", editId);
        navigate("/calendar", { replace: true });
    };

    const togglePicker = (p: PickerOpen) =>
        setPicker(prev => prev === p ? "none" : p);

    const selectDate = (d: Date, which: "start" | "end") => {
        if (which === "start") { setStartDate(d); if (d > endDate) setEndDate(d); }
        else setEndDate(d);
        setPicker("none");
    };

    // gender取得前はタイトル画面（チラつき・真っ白防止）
    if (!myGender) return <TitlePage hideTimer />;

    // パートナーの予定として追加する場合はテーマを反転
    const currentTheme: MyGender = isPartnerOwner
        ? (myGender === "boyfriend" ? "girlfriend" : "boyfriend")
        : myGender;

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