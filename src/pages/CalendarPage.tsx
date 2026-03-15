import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCachedProfile, getCachedGender } from "../lib/userCache";
import TabBar from "../components/TabBar";
import AppHeader from "../components/AppHeader";
import TitlePage from "./TitlePage";
import "../styles/calendar.css";

// ===== 型定義 =====
interface CalEvent {
    id: string;
    user_id: string;
    name: string;
    start_at: string;
    end_at: string;
    is_shared: boolean; // true=2人の予定, false=自分だけ
    all_day: boolean;   // true=終日, false=時間指定
    memo: string | null;
}

type MyGender = "boyfriend" | "girlfriend";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function buildCalDays(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const days: Date[] = [];
    for (let i = -startOffset; i < 42 - startOffset; i++) {
        days.push(new Date(year, month, 1 + i));
    }
    return days;
}

function toDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function CalendarPage() {
    const navigate = useNavigate();
    const today = new Date();

    const [myId, setMyId] = useState<string | null>(null);
    // getCachedGenderで同期的に初期値を設定 → テーマのチラつきなし
    const [myGender, setMyGender] = useState<MyGender | null>(getCachedGender);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const days = buildCalDays(year, month);

    // ===== プロフィール取得（キャッシュ優先・初回のみSupabase） =====
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
        };
        fetchProfile();
    }, []);

    // ===== 予定取得（月が変わるたびに再取得） =====
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);

            const from = new Date(year, month, 1).toISOString();
            const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            // RLSで自分とパートナーの予定が両方取れる
            const { data, error } = await supabase
                .from("schedules")
                .select("id, user_id, name, start_at, end_at, is_shared, all_day, memo")
                .gte("start_at", from)
                .lte("start_at", to)
                .order("start_at", { ascending: true });

            if (error) {
                console.error("予定取得エラー:", error.message);
            } else {
                setEvents((data ?? []) as CalEvent[]);
            }
            setLoading(false);
        };
        fetchEvents();
    }, [year, month]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };

    const getEventsForDay = (d: Date) =>
        events.filter(e => e.start_at.slice(0, 10) === toDateStr(d));

    // 自分の予定かパートナーの予定かを判定
    const isMyEvent = (ev: CalEvent) => ev.user_id === myId;

    // バッジ色: 彼女の予定=ピンク, 彼氏の予定=水色
    // 自分がboyfriend → 自分=水色, パートナー(彼女)=ピンク
    // 自分がgirlfriend → 自分=ピンク, パートナー(彼氏)=水色
    const getBadgeColor = (ev: CalEvent): string => {
        const isMine = isMyEvent(ev);
        if (myGender === "boyfriend") {
            return isMine ? "#4dd0e1" : "#f5317f"; // 自分=水色, 彼女=ピンク
        } else {
            return isMine ? "#f5317f" : "#4dd0e1"; // 自分=ピンク, 彼氏=水色
        }
    };

    // gender取得前はタイトル画面を表示（テーマのチラつき防止）
    if (!myGender) return <TitlePage hideTimer />;

    return (
        <div className={`cal-wrapper theme-${myGender}`}>

            <AppHeader
                variant="calendar"
                title={`${year}年${month + 1}月`}
                onPrev={prevMonth}
                onNext={nextMonth}
            />

            {/* 曜日ヘッダー */}
            <div className="cal-weekdays">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`cal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>
                        {d}
                    </div>
                ))}
            </div>

            {/* 日付グリッド */}
            <div className="cal-grid">
                {days.map((d, i) => {
                    const isOther = d.getMonth() !== month;
                    const isToday = toDateStr(d) === toDateStr(today);
                    const dow = (d.getDay() + 6) % 7;
                    const dayEvents = getEventsForDay(d);

                    return (
                        <div
                            key={i}
                            className={[
                                "cal-day",
                                isOther ? "other-month" : "",
                                isToday ? "today" : "",
                                dow === 5 ? "sat" : dow === 6 ? "sun" : "",
                            ].join(" ")}
                            onClick={() => navigate(`/event-list?date=${toDateStr(d)}`)}
                        >
                            <span className="cal-day-num">{d.getDate()}</span>
                            {!isOther && !loading && (
                                <div className="cal-event-badges">
                                    {dayEvents.slice(0, 2).map(ev => {
                                        const color = getBadgeColor(ev);
                                        // 終日=不透明, 時間指定=半透明
                                        const opacity = ev.all_day ? 1 : 0.55;
                                        return (
                                            <div
                                                key={ev.id}
                                                className="cal-event-badge"
                                                style={{ background: color, opacity }}
                                            >
                                                {ev.name}
                                            </div>
                                        );
                                    })}
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

export default CalendarPage;