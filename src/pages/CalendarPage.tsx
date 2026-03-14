import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import TabBar from "../components/TabBar";
import "../styles/calendar.css";

// ===== 型定義 =====
interface CalEvent {
    id: string;
    taskid: string;
    name: string;
    date: string;        // 開始時刻（ISO文字列）
    duration: string;    // 終了時刻（ISO文字列）
    isPare: boolean;     // true=パートナーの予定 / false=自分の予定
}

type MyGender = "boyfriend" | "girlfriend";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

// ===== ダミー予定（DBが繋がるまでの表示確認用） =====
// DB接続後は fetchEvents() のコメントアウトを解除してこの定数を削除する
const DUMMY_EVENTS: CalEvent[] = [
    {
        id: "dummy-1",
        taskid: "t1",
        name: "バイト",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 18, 0).toISOString(),
        isPare: false,
    },
    {
        id: "dummy-2",
        taskid: "t2",
        name: "デート",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 14, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 20, 0).toISOString(),
        isPare: true,
    },
    {
        id: "dummy-3",
        taskid: "t3",
        name: "映画",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 18, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 21, 0).toISOString(),
        isPare: true,
    },
    {
        id: "dummy-4",
        taskid: "t4",
        name: "ジム",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 11, 0).toISOString(),
        isPare: false,
    },
];

// ===== 月のカレンダー日付を生成（月曜始まり） =====
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

    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalEvent[]>(DUMMY_EVENTS);

    const days = buildCalDays(year, month);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 自分の gender を取得してテーマを決める
            const { data: profile } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", user.id)
                .single();
            if (profile?.gender) setMyGender(profile.gender as MyGender);

            // ===== DB接続後はここを解除してダミーを削除する =====
            // const from = new Date(year, month, 1).toISOString();
            // const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
            // const { data: eventsData } = await supabase
            //   .from("予定")
            //   .select("*")
            //   .gte("date", from)
            //   .lte("date", to);
            // if (eventsData) setEvents(eventsData as CalEvent[]);
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

    const getEventsForDay = (d: Date) =>
        events.filter(e => e.date.slice(0, 10) === toDateStr(d));

    return (
        <div className={`cal-wrapper theme-${myGender}`}>

            {/* ===== 月ナビゲーション ===== */}
            <div className="cal-month-header">
                <button className="cal-month-nav" onClick={prevMonth} aria-label="前の月">
                    <HiChevronLeft size={22} />
                </button>
                <p className="cal-month-title">{year}年{month + 1}月</p>
                <button className="cal-month-nav" onClick={nextMonth} aria-label="次の月">
                    <HiChevronRight size={22} />
                </button>
            </div>

            {/* ===== 曜日ヘッダー ===== */}
            <div className="cal-weekdays">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`cal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>
                        {d}
                    </div>
                ))}
            </div>

            {/* ===== 日付グリッド ===== */}
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
                            // 日付タップ → その日の予定一覧画面へ
                            onClick={() => navigate(`/event-list?date=${toDateStr(d)}`)}
                        >
                            <span className="cal-day-num">{d.getDate()}</span>
                            {!isOther && (
                                <div className="cal-event-badges">
                                    {dayEvents.slice(0, 2).map(ev => (
                                        <div
                                            key={ev.id}
                                            className={`cal-event-badge ${ev.isPare ? "badge-pare" : "badge-mine"}`}
                                        >
                                            {ev.name}
                                        </div>
                                    ))}
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