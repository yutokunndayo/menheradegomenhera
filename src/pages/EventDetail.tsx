import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
    HiOutlineClock,
    HiOutlinePencilSquare,
    HiOutlineUserGroup,
    HiOutlineTrash,
} from "react-icons/hi2";
import "../styles/calendar.css";

type MyGender = "boyfriend" | "girlfriend";

// ===== ドラムロールピッカー =====
interface DrumPickerProps {
    items: string[];
    selected: string;
    onChange: (val: string) => void;
}

function DrumPicker({ items, selected, onChange }: DrumPickerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const ITEM_H = 40;

    useEffect(() => {
        const idx = items.indexOf(selected);
        if (ref.current && idx >= 0) {
            ref.current.scrollTop = idx * ITEM_H;
        }
    }, [selected, items]);

    const handleScroll = () => {
        if (!ref.current) return;
        const idx = Math.round(ref.current.scrollTop / ITEM_H);
        onChange(items[Math.max(0, Math.min(items.length - 1, idx))]);
    };

    return (
        <div ref={ref} className="drum-col" onScroll={handleScroll}>
            <div style={{ height: ITEM_H * 2 }} />
            {items.map(item => (
                <div
                    key={item}
                    className={`drum-item ${item === selected ? "active" : ""}`}
                    onClick={() => onChange(item)}
                >
                    {item}
                </div>
            ))}
            <div style={{ height: ITEM_H * 2 }} />
        </div>
    );
}

// ===== ミニカレンダーピッカー =====
interface MiniCalProps {
    selected: Date;
    onSelect: (d: Date) => void;
}

function MiniCal({ selected, onSelect }: MiniCalProps) {
    const [viewYear, setViewYear] = useState(selected.getFullYear());
    const [viewMonth, setViewMonth] = useState(selected.getMonth());
    const today = new Date();
    const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const days: Date[] = [];
    for (let i = -startOffset; i < 42 - startOffset; i++) {
        days.push(new Date(viewYear, viewMonth, 1 + i));
    }

    return (
        <div className="mini-cal">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 8 }}>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cal-accent)", fontSize: 18 }}
                    onClick={() => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); }}>‹</button>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{viewYear}年{viewMonth + 1}月</span>
                <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cal-accent)", fontSize: 18 }}
                    onClick={() => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); }}>›</button>
            </div>
            <div className="mini-cal-grid">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`mini-cal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>{d}</div>
                ))}
                {days.map((d, i) => {
                    const isOther = d.getMonth() !== viewMonth;
                    const isSelected = d.toDateString() === selected.toDateString();
                    const isToday = d.toDateString() === today.toDateString();
                    const dow = (d.getDay() + 6) % 7;
                    return (
                        <button key={i}
                            className={["mini-cal-day", isOther ? "other" : "", isSelected ? "selected" : "",
                                isToday && !isSelected ? "today-dot" : "",
                                !isSelected && dow === 5 ? "sat" : "", !isSelected && dow === 6 ? "sun" : ""].join(" ")}
                            onClick={() => onSelect(d)}
                        >{d.getDate()}</button>
                    );
                })}
            </div>
        </div>
    );
}

// ===== 日付フォーマット =====
function formatDate(d: Date) {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// ===== ダミー予定（編集モードの初期値読み込み用） =====
const DUMMY_EVENTS_FOR_EDIT = [
    {
        taskid: "t1", name: "バイト",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 18, 0).toISOString(),
        isPare: false, memo: ""
    },
    {
        taskid: "t2", name: "デート",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 14, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 20, 0).toISOString(),
        isPare: true, memo: ""
    },
    {
        taskid: "t3", name: "映画",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 18, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 21, 0).toISOString(),
        isPare: true, memo: ""
    },
    {
        taskid: "t4", name: "ジム",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 11, 0).toISOString(),
        isPare: false, memo: ""
    },
];

// ===== メイン =====
function EventDetail() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const initDateStr = params.get("date") ?? new Date().toISOString().slice(0, 10);
    const initDate = new Date(initDateStr + "T12:00:00");

    // URLに id があれば編集モード、なければ新規作成モード
    const editTaskId = params.get("id");
    const isEditMode = !!editTaskId;
    // EventListから渡されるisPareの初期値
    const initIsPare = params.get("isPare") === "true";

    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [myName, setMyName] = useState("自分");
    const [partnerName, setPartnerName] = useState("パートナー");

    const [title, setTitle] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [startDate, setStartDate] = useState(initDate);
    const [endDate, setEndDate] = useState(new Date(initDate.getTime() + 60 * 60 * 1000));
    const [startHour, setStartHour] = useState("12");
    const [startMin, setStartMin] = useState("00");
    const [endHour, setEndHour] = useState("13");
    const [endMin, setEndMin] = useState("00");
    const [memo, setMemo] = useState("");
    const [isPare, setIsPare] = useState(initIsPare);

    const currentTheme: MyGender = isPare
        ? (myGender === "boyfriend" ? "girlfriend" : "boyfriend")
        : myGender;

    const [openPicker, setOpenPicker] = useState("none");
    const [saving, setSaving] = useState(false);

    // ===== プロフィール取得 + 編集モード時の既存予定読み込み =====
    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("name, gender, partner")
                .eq("id", user.id)
                .single();

            if (myProfile?.gender) setMyGender(myProfile.gender as MyGender);
            if (myProfile?.name) setMyName(myProfile.name);

            if (myProfile?.partner) {
                const { data: partnerProfile } = await supabase
                    .from("profiles")
                    .select("name")
                    .eq("id", myProfile.partner)
                    .single();
                if (partnerProfile?.name) setPartnerName(partnerProfile.name);
            }

            // ===== 編集モード: 既存予定データをフォームに読み込む =====
            if (isEditMode && editTaskId) {
                // ダミーから検索（DB接続後は以下のSupabaseクエリに差し替える）
                const existing = DUMMY_EVENTS_FOR_EDIT.find(e => e.taskid === editTaskId);

                // ===== DB接続後はここを解除してダミーを削除する =====
                // const { data: existing } = await supabase
                //   .from("予定")
                //   .select("*")
                //   .eq("taskid", editTaskId)
                //   .single();

                if (existing) {
                    const sd = new Date(existing.date);
                    const ed = new Date(existing.duration);
                    setTitle(existing.name);
                    setStartDate(sd);
                    setEndDate(ed);
                    setStartHour(String(sd.getHours()).padStart(2, "0"));
                    setStartMin(String(sd.getMinutes()).padStart(2, "0"));
                    setEndHour(String(ed.getHours()).padStart(2, "0"));
                    setEndMin(String(ed.getMinutes()).padStart(2, "0"));
                    setIsPare(existing.isPare);
                    if (existing.memo) setMemo(existing.memo);
                }
            }
        };
        fetch();
    }, [isEditMode, editTaskId]);

    const togglePicker = (name: string) =>
        setOpenPicker(prev => prev === name ? "none" : name);

    // ===== 保存処理（新規=insert / 編集=update） =====
    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未ログイン");

            const startDt = new Date(startDate);
            if (!allDay) startDt.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
            const endDt = new Date(endDate);
            if (!allDay) endDt.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

            const payload = {
                name: title.trim(),
                date: startDt.toISOString(),
                duration: endDt.toISOString(),
                isPare,
            };

            if (isEditMode && editTaskId) {
                // 編集モード: 既存レコードを更新
                const { error } = await supabase
                    .from("予定")
                    .update(payload)
                    .eq("taskid", editTaskId);
                if (error) throw error;
            } else {
                // 新規作成モード: 新しいレコードを追加
                const { error } = await supabase.from("予定").insert({
                    id: user.id,
                    taskid: crypto.randomUUID(),
                    createAt: new Date().toISOString(),
                    ...payload,
                });
                if (error) throw error;
            }

            // 保存後はカレンダーへ戻る
            navigate("/calendar", { replace: true });
        } catch (e) {
            console.error("保存エラー:", e);
        } finally {
            setSaving(false);
        }
    };

    // ===== 削除処理 =====
    const handleDelete = async () => {
        const eventId = params.get("id");
        if (!eventId) {
            // 新規作成中に削除 → そのままキャンセル扱いでカレンダーへ
            navigate("/calendar", { replace: true });
            return;
        }
        try {
            await supabase.from("予定").delete().eq("taskid", eventId);
            navigate("/calendar", { replace: true });
        } catch (e) {
            console.error("削除エラー:", e);
        }
    };

    return (
        // currentTheme でテーマクラスを切り替える
        // isPare を切り替えると画面全体の色がリアルタイムで変わる
        <div className={`event-wrapper theme-${currentTheme}`}>

            {/* ===== ヘッダー =====
          padding-top に safe-area-inset-top を使うことで
          iPhone のノッチ・ダイナミックアイランドでも正しく表示される */}
            <div className="event-header">
                <button className="event-cancel-btn" onClick={() => navigate("/calendar")}>
                    キャンセル
                </button>
                <button
                    className="event-save-btn"
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                >
                    {saving ? "保存中..." : "保存"}
                </button>
            </div>

            {/* ===== タイトル入力 ===== */}
            <input
                className="event-title-input"
                placeholder="タイトル"
                value={title}
                onChange={e => setTitle(e.target.value)}
            />

            {/* ===== 日時セクション =====
          画像①③を参考に区切り線の構成:
          - 終日行の下にボーダー
          - 開始日行の下にボーダー（ピッカー展開時はピッカーを挟む）
          - 終了日行の下にボーダーなし（次のevent-cardのtop borderで区切られる）
      */}
            <div className="event-card">

                {/* 終日トグル */}
                <div className="event-allday-row">
                    <div className="event-row-icon"><HiOutlineClock size={20} /></div>
                    <span className="event-row-label">終日</span>
                    <button
                        className={`toggle-track ${allDay ? "on" : ""}`}
                        onClick={() => setAllDay(a => !a)}
                        aria-label="終日切り替え"
                    >
                        <div className="toggle-thumb" />
                    </button>
                </div>

                {/* 開始日 */}
                <div className="event-date-row event-date-row--bordered"
                    onClick={() => togglePicker("start-date")}>
                    <span className="event-date-label">{formatDate(startDate)}</span>
                    {!allDay && (
                        <span className="event-time-label"
                            onClick={e => { e.stopPropagation(); togglePicker("start-time"); }}>
                            {startHour}:{startMin}
                        </span>
                    )}
                </div>

                {/* 開始日ピッカー */}
                {openPicker === "start-date" && (
                    <div className="event-picker-panel">
                        <MiniCal selected={startDate} onSelect={d => { setStartDate(d); setOpenPicker("none"); }} />
                    </div>
                )}

                {/* 開始時刻ドラム */}
                {!allDay && openPicker === "start-time" && (
                    <div className="event-picker-panel">
                        <div className="time-drum">
                            <DrumPicker items={HOURS} selected={startHour} onChange={setStartHour} />
                            <div style={{ display: "flex", alignItems: "center", fontSize: 22, padding: "0 4px" }}>:</div>
                            <DrumPicker items={MINUTES} selected={startMin} onChange={setStartMin} />
                        </div>
                    </div>
                )}

                {/* 終了日 */}
                <div className="event-date-row" onClick={() => togglePicker("end-date")}>
                    <span className="event-date-label">{formatDate(endDate)}</span>
                    {!allDay && (
                        <span className="event-time-label"
                            onClick={e => { e.stopPropagation(); togglePicker("end-time"); }}>
                            {endHour}:{endMin}
                        </span>
                    )}
                </div>

                {/* 終了日ピッカー */}
                {openPicker === "end-date" && (
                    <div className="event-picker-panel">
                        <MiniCal selected={endDate} onSelect={d => { setEndDate(d); setOpenPicker("none"); }} />
                    </div>
                )}

                {/* 終了時刻ドラム */}
                {!allDay && openPicker === "end-time" && (
                    <div className="event-picker-panel">
                        <div className="time-drum">
                            <DrumPicker items={HOURS} selected={endHour} onChange={setEndHour} />
                            <div style={{ display: "flex", alignItems: "center", fontSize: 22, padding: "0 4px" }}>:</div>
                            <DrumPicker items={MINUTES} selected={endMin} onChange={setEndMin} />
                        </div>
                    </div>
                )}
            </div>

            {/* ===== メモセクション（画像通り独立した区切り） ===== */}
            <div className="event-card">
                <div className="event-row">
                    <div className="event-row-icon"><HiOutlinePencilSquare size={20} /></div>
                    <input
                        className="event-memo-input"
                        placeholder="メモ"
                        value={memo}
                        onChange={e => setMemo(e.target.value)}
                    />
                </div>
            </div>

            {/* ===== 誰の予定か選択（画像通り独立した区切り） =====
          isPare=false → 自分のテーマ色
          isPare=true  → パートナーのテーマ色（ピンク⇔水色が入れ替わる）
          タップするたびに切り替わる */}
            <div className="event-card">
                <div className="event-row" onClick={() => setIsPare(p => !p)}>
                    <div className="event-row-icon"><HiOutlineUserGroup size={20} /></div>
                    <span className="event-partner-chip">
                        {isPare ? partnerName : myName}
                    </span>
                </div>
            </div>

            {/* ===== 削除ボタン（画面下部に独立配置） ===== */}
            <div className="event-delete-area">
                <button className="event-delete-btn" onClick={handleDelete}>
                    <HiOutlineTrash size={18} />
                    予定を削除
                </button>
            </div>

        </div>
    );
}

export default EventDetail;