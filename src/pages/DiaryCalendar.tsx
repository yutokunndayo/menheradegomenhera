import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AppHeader from "../components/AppHeader";
import TabBar from "../components/TabBar";
import "../styles/diary.css";

// ===== 感情カラー =====
// index 0=しんどい 1=かなしい 2=ふつう 3=うれしい 4=たのしい
const EMOTION_COLORS = ["#FFB39E", "#AFE7FF", "#A5EAB0", "#FFDFA8", "#E1A5EA"];

type MyGender = "boyfriend" | "girlfriend";

// ===== 日記エントリ型 =====
interface DiaryEntry {
    date: string;
    myEmotion: number | null;
    partnerEmotion: number | null;
    myText: string;
    partnerText: string;
}

// ===== ダミーデータ（DB接続後は削除） =====
function buildDummyEntries(year: number, month: number): DiaryEntry[] {
    const entries: DiaryEntry[] = [];
    const days = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
        if (Math.random() > 0.5) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            entries.push({
                date: dateStr,
                myEmotion: Math.floor(Math.random() * 5),
                partnerEmotion: Math.random() > 0.3 ? Math.floor(Math.random() * 5) : null,
                myText: "今日はこんな感じ",
                partnerText: "なんか色々あった",
            });
        }
    }
    return entries;
}

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalDays(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const days: Date[] = [];
    for (let i = -startOffset; i < 42 - startOffset; i++) {
        days.push(new Date(year, month, 1 + i));
    }
    return days;
}

function DiaryCalendar() {
    const navigate = useNavigate();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [entries, setEntries] = useState<DiaryEntry[]>([]);

    const days = buildCalDays(year, month);

    // 凡例の色: 自分の性別で決まる
    // 彼氏 → 自分=水色、彼女=ピンク
    // 彼女 → 自分=ピンク、彼氏=水色
    const myColor = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";
    const partnerLabel = myGender === "boyfriend" ? "彼女（下）" : "彼氏（下）";

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("profiles").select("gender").eq("id", user.id).single();
            if (data?.gender) setMyGender(data.gender as MyGender);

            // ダミーデータをセット（DB接続後は下のコメントを解除）
            setEntries(buildDummyEntries(year, month));

            // ===== DB接続後はここを解除してダミーを削除 =====
            // const from = new Date(year, month, 1).toISOString();
            // const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
            // const { data: logs } = await supabase
            //   .from("メッセージストレージ")
            //   .select("*")
            //   .eq("isMemory", true)
            //   .gte("sendAt", from)
            //   .lte("sendAt", to);
            // if (logs) { /* entriesToMapに変換してsetEntries */ }
        };
        fetchData();
    }, [year, month]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };

    const getEntry = (d: Date) =>
        entries.find(e => e.date === toDateStr(d)) ?? null;

    return (
        <div className="diary-wrapper">
            <AppHeader
                variant="calendar"
                title={`${year}年${month + 1}月`}
                onPrev={prevMonth}
                onNext={nextMonth}
            />

            {/* 凡例 — 上段=自分（myColor）、下段=パートナー（pareColor） */}
            {/* 彼氏なら自分=水色・彼女=ピンク、彼女なら自分=ピンク・彼氏=水色 */}
            <div className="dcal-legend">
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: myColor }} />
                    <span>自分（上）</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: pareColor }} />
                    <span>{partnerLabel}</span>
                </div>
            </div>

            {/* 曜日ヘッダー */}
            <div className="dcal-weekdays">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`dcal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>{d}</div>
                ))}
            </div>

            {/* 日付グリッド */}
            <div className="dcal-grid">
                {days.map((d, i) => {
                    const isOther = d.getMonth() !== month;
                    const isToday = toDateStr(d) === toDateStr(today);
                    const dow = (d.getDay() + 6) % 7;
                    const entry = getEntry(d);

                    return (
                        <div
                            key={i}
                            className={[
                                "dcal-day",
                                isOther ? "other-month" : "",
                                isToday ? "today" : "",
                                dow === 5 ? "sat" : dow === 6 ? "sun" : "",
                            ].join(" ")}
                            onClick={() => !isOther && navigate(`/diary-detail?date=${toDateStr(d)}`)}
                        >
                            <span className="dcal-day-num">{d.getDate()}</span>

                            {/* 感情ドット（上=自分、下=パートナー） */}
                            {/* 色は感情ごとのEMOTION_COLORS（凡例の色とは別） */}
                            {!isOther && entry && (
                                <div className="dcal-dot-rows">
                                    {/* 上段: 自分の感情色 */}
                                    <div className="dcal-dot-row">
                                        <div
                                            className="dcal-dot"
                                            style={{
                                                background: entry.myEmotion !== null
                                                    ? EMOTION_COLORS[entry.myEmotion]
                                                    : "transparent",
                                            }}
                                        />
                                    </div>
                                    {/* 下段: パートナーの感情色 */}
                                    <div className="dcal-dot-row">
                                        <div
                                            className="dcal-dot"
                                            style={{
                                                background: entry.partnerEmotion !== null
                                                    ? EMOTION_COLORS[entry.partnerEmotion]
                                                    : "transparent",
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <TabBar />
        </div>
    );
}

export default DiaryCalendar;