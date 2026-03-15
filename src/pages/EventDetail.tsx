import { useState, useEffect, useRef, useCallback } from "react";
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

// ===== 現在時刻を5分単位に丸める =====
function roundToFive(d: Date): { h: string; m: string } {
    const m = Math.ceil(d.getMinutes() / 5) * 5;
    const h = m >= 60 ? (d.getHours() + 1) % 24 : d.getHours();
    return {
        h: String(h).padStart(2, "0"),
        m: String(m >= 60 ? 0 : m).padStart(2, "0"),
    };
}

function EventDetail() {
    const navigate    = useNavigate();
    const [params]    = useSearchParams();
    const initDateStr = params.get("date") ?? new Date().toISOString().slice(0, 10);
    const editId      = params.get("id");
    const isEditMode  = !!editId;

    const [myGender,    setMyGender]    = useState<MyGender | null>(getCachedGender);
    const [myId,        setMyId]        = useState<string | null>(null);
    const [partnerId,   setPartnerId]   = useState<string | null>(null);
    const [myName,      setMyName]      = useState("自分");
    const [partnerName, setPartnerName] = useState("パートナー");

    const [title,           setTitle]           = useState("");
    const [memo,            setMemo]            = useState("");
    // isPartnerOwner: trueならパートナーの予定として保存（user_idがパートナーになる）
    const [isPartnerOwner,  setIsPartnerOwner]  = useState(false);
    const [allDay,          setAllDay]          = useState(false);

    // ===== デフォルト: 現在時刻 & 終了は+1時間 =====
    const now       = new Date();
    const { h: nowH, m: nowM } = roundToFive(now);
    const endHourNum = (parseInt(nowH) + 1) % 24;

    const [startDate, setStartDate] = useState(new Date(initDateStr + "T00:00:00"));
    const [endDate,   setEndDate]   = useState(new Date(initDateStr + "T00:00:00"));
    const [startHour, setStartHour] = useState(nowH);
    const [startMin,  setStartMin]  = useState(nowM);
    const [endHour,   setEndHour]   = useState(String(endHourNum).padStart(2, "0"));
    const [endMin,    setEndMin]    = useState(nowM);

    const [calYear,  setCalYear]  = useState(new Date(initDateStr).getFullYear());
    const [calMonth, setCalMonth] = useState(new Date(initDateStr).getMonth());
    const [picker,   setPicker]   = useState<PickerOpen>("none");
    const [saving,   setSaving]   = useState(false);

    // アクセントカラー（gender確定後に決まる）
    const accent = myGender === "girlfriend" ? "#f5317f" : "#4dd0e1";

    useEffect(() => {
        const fetchData = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
            setMyName(profile.name);
            setPartnerId(profile.partner);

            if (profile.partner) {
                const { data: p } = await supabase
                    .from("profiles").select("name").eq("id", profile.partner).single();
                if (p?.name) setPartnerName(p.name);
            }

            if (isEditMode && editId) {
                const { data: ev } = await supabase
                    .from("schedules").select("*").eq("id", editId).single();
                if (ev) {
                    const sd = new Date(ev.start_at);
                    const ed = new Date(ev.end_at);
                    setTitle(ev.name);
                    setMemo(ev.memo ?? "");
                    // 誰の予定か: 自分のIDと一致しなければパートナーの予定
                    setIsPartnerOwner(ev.user_id !== profile.id);
                    setAllDay(ev.all_day ?? false);
                    setStartDate(sd); setEndDate(ed);
                    setStartHour(String(sd.getHours()).padStart(2, "0"));
                    const sm = MINUTES.reduce((a, b) =>
                        Math.abs(parseInt(a) - sd.getMinutes()) <= Math.abs(parseInt(b) - sd.getMinutes()) ? a : b);
                    setStartMin(sm);
                    setEndHour(String(ed.getHours()).padStart(2, "0"));
                    const em = MINUTES.reduce((a, b) =>
                        Math.abs(parseInt(a) - ed.getMinutes()) <= Math.abs(parseInt(b) - ed.getMinutes()) ? a : b);
                    setEndMin(em);
                    setCalYear(sd.getFullYear()); setCalMonth(sd.getMonth());
                }
            }
        };
        fetchData();
    }, [isEditMode, editId]);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未ログイン");

            let startIso: string;
            let endIso: string;

            if (allDay) {
                // 終日: ローカル日付のYYYY-MM-DD形式で保存（タイムゾーンズレ防止）
                const sy = startDate.getFullYear();
                const sm = String(startDate.getMonth() + 1).padStart(2, "0");
                const sd = String(startDate.getDate()).padStart(2, "0");
                const ey = endDate.getFullYear();
                const em = String(endDate.getMonth() + 1).padStart(2, "0");
                const ed = String(endDate.getDate()).padStart(2, "0");
                startIso = `${sy}-${sm}-${sd}T00:00:00`;
                endIso   = `${ey}-${em}-${ed}T23:59:59`;
            } else {
                const sd = new Date(startDate);
                sd.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                const ed = new Date(endDate);
                ed.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                startIso = sd.toISOString();
                endIso   = ed.toISOString();
            }

            const payload = {
                name:      title.trim(),
                start_at:  startIso,
                end_at:    endIso,
                is_shared: false,  // is_sharedは2人共有予定フラグ（今後使う用）
                all_day:   allDay,
                memo:      memo.trim() || null,
            };

            // 誰の予定か: isPartnerOwner=trueならパートナーのuser_idで保存
            const ownerId = isPartnerOwner && partnerId ? partnerId : myId ?? user.id;

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
        <div className={`event-wrapper theme-${currentTheme}`}>

            {/* ヘッダー */}
            <div className="event-header">
                <button className="event-cancel-btn" onClick={() => navigate(-1)}>キャンセル</button>
                <button className="event-save-btn" onClick={handleSave} disabled={saving || !title.trim()}>
                    {saving ? "保存中" : "保存"}
                </button>
            </div>

            {/* タイトル */}
            <input
                className="event-title-input"
                placeholder="タイトル"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />

            {/* 時刻カード */}
            <div className="event-card">

                {/* 終日トグル */}
                <div className="event-allday-row">
                    <div className="event-row-icon"><HiOutlineClock size={18} /></div>
                    <span className="event-row-label">終日</span>
                    <button className={`toggle-track ${allDay ? "on" : ""}`} onClick={() => setAllDay(v => !v)}>
                        <div className="toggle-thumb" />
                    </button>
                </div>

                {/* 開始日時行 */}
                <div className="event-date-row event-date-row--bordered">
                    <span className="event-date-label" onClick={() => togglePicker("start-date")}>
                        {formatDateBtn(startDate)}
                    </span>
                    {!allDay && (
                        <span className="event-time-label" onClick={() => togglePicker("start-time")}>
                            {startHour}:{startMin}
                        </span>
                    )}
                </div>

                {/* 開始日ミニカレ */}
                {picker === "start-date" && (
                    <div className="event-picker-panel">
                        <MiniCal
                            year={calYear} month={calMonth}
                            selected={startDate}
                            onPrevMonth={() => { if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
                            onNextMonth={() => { if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
                            onSelect={d => selectDate(d, "start")}
                            accent={accent}
                        />
                    </div>
                )}

                {/* 開始時間ドラムロール */}
                {picker === "start-time" && !allDay && (
                    <div className="event-picker-panel">
                        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"8px 0 16px", gap:4 }}>
                            <DrumRoll items={HOURS}   value={startHour} onChange={setStartHour} accent={accent} />
                            <span style={{ fontSize:24, fontWeight:700, color:"#333", margin:"0 4px" }}>:</span>
                            <DrumRoll items={MINUTES} value={startMin}  onChange={setStartMin}  accent={accent} />
                        </div>
                    </div>
                )}

                {/* 終了日時行 */}
                <div className="event-date-row">
                    <span className="event-date-label" onClick={() => togglePicker("end-date")}>
                        {formatDateBtn(endDate)}
                    </span>
                    {!allDay && (
                        <span className="event-time-label" onClick={() => togglePicker("end-time")}>
                            {endHour}:{endMin}
                        </span>
                    )}
                </div>

                {/* 終了日ミニカレ */}
                {picker === "end-date" && (
                    <div className="event-picker-panel">
                        <MiniCal
                            year={calYear} month={calMonth}
                            selected={endDate}
                            onPrevMonth={() => { if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
                            onNextMonth={() => { if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
                            onSelect={d => selectDate(d, "end")}
                            accent={accent}
                        />
                    </div>
                )}

                {/* 終了時間ドラムロール */}
                {picker === "end-time" && !allDay && (
                    <div className="event-picker-panel">
                        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"8px 0 16px", gap:4 }}>
                            <DrumRoll items={HOURS}   value={endHour} onChange={setEndHour} accent={accent} />
                            <span style={{ fontSize:24, fontWeight:700, color:"#333", margin:"0 4px" }}>:</span>
                            <DrumRoll items={MINUTES} value={endMin}  onChange={setEndMin}  accent={accent} />
                        </div>
                    </div>
                )}
            </div>

            {/* メモ */}
            <div className="event-card">
                <div className="event-row">
                    <div className="event-row-icon"><HiOutlinePencil size={18} /></div>
                    <input className="event-memo-input" placeholder="メモ" value={memo} onChange={e => setMemo(e.target.value)} />
                </div>
            </div>

            {/* 誰の予定か */}
            <div className="event-card">
                <div className="event-row">
                    <div className="event-row-icon"><HiOutlineUsers size={18} /></div>
                    <span className="event-partner-chip" style={{ opacity: !isPartnerOwner ? 1 : 0.35, cursor:"pointer" }} onClick={() => setIsPartnerOwner(false)}>{myName}</span>
                    <span className="event-partner-chip" style={{ opacity: isPartnerOwner ? 1 : 0.35, cursor:"pointer", marginLeft:8 }} onClick={() => setIsPartnerOwner(true)}>{partnerName}</span>
                </div>
            </div>

            {isEditMode && (
                <div className="event-delete-area">
                    <button className="event-delete-btn" onClick={handleDelete}>予定を削除</button>
                </div>
            )}
        </div>
    );
}

// ===== ミニカレンダーコンポーネント =====
function MiniCal({ year, month, selected, onPrevMonth, onNextMonth, onSelect, accent }: {
    year: number; month: number; selected: Date;
    onPrevMonth: () => void; onNextMonth: () => void;
    onSelect: (d: Date) => void; accent: string;
}) {
    const days = buildMiniCalDays(year, month);
    return (
        <div className="mini-cal">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <button onClick={onPrevMonth} style={{ background:"none", border:"none", cursor:"pointer", color:accent, fontSize:20, padding:"0 8px" }}>‹</button>
                <span style={{ fontSize:14, fontWeight:600 }}>{year}年{month+1}月</span>
                <button onClick={onNextMonth} style={{ background:"none", border:"none", cursor:"pointer", color:accent, fontSize:20, padding:"0 8px" }}>›</button>
            </div>
            <div className="mini-cal-grid">
                {WEEKDAYS_SHORT.map((d, i) => (
                    <div key={d} className={`mini-cal-weekday ${i===5?"sat":i===6?"sun":""}`}>{d}</div>
                ))}
                {days.map((d, i) => d ? (
                    <button
                        key={i}
                        className={[
                            "mini-cal-day",
                            d.toDateString() === selected.toDateString() ? "selected" : "",
                            (d.getDay()+6)%7 === 5 ? "sat" : (d.getDay()+6)%7 === 6 ? "sun" : "",
                        ].join(" ")}
                        onClick={() => onSelect(d)}
                    >{d.getDate()}</button>
                ) : <div key={i} />)}
            </div>
        </div>
    );
}

export default EventDetail;