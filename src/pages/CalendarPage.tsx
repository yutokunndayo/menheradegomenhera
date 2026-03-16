import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCachedProfile, getCachedGender } from "../lib/userCache";
import TabBar from "../components/TabBar";
import AppHeader from "../components/AppHeader";
import "../styles/Calendar.css";

// ===== 型定義 =====
interface CalEvent {
    id: string;
    user_id: string;
    name: string;
    start_at: string;
    end_at: string;
    is_shared: boolean;
    all_day: boolean;
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
    const [myGender, setMyGender] = useState<MyGender | null>(getCachedGender);
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const yearRef  = useRef(year);
    const monthRef = useRef(month);
    yearRef.current  = year;
    monthRef.current = month;

    const days = buildCalDays(year, month);

    // ===== プロフィール取得 =====
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
        };
        fetchProfile();
    }, []);

    // ===== 予定取得 =====
    const fetchEvents = async () => {
        const pad = (n: number) => String(n).padStart(2, "0");
        const y = yearRef.current;
        const m = monthRef.current;
        const lastDay = new Date(y, m + 1, 0).getDate();
        const from = `${y}-${pad(m + 1)}-01T00:00:00`;
        const to   = `${y}-${pad(m + 1)}-${pad(lastDay)}T23:59:59`;

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
    };

    // ===== 初回取得 + Realtime購読 =====
    useEffect(() => {
        // 初回取得
        setLoading(true);
        fetchEvents().finally(() => setLoading(false));

        // Realtime: schedulesテーブルに変更があったら再取得（1接続のみ）
        const channel = supabase
            .channel("schedules-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "schedules" },
                () => {
                    // INSERT / UPDATE / DELETE どれでも再取得
                    fetchEvents();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]); // 月が変わったら再購読

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };

    const getEventsForDay = (d: Date) =>
        events.filter(e => toDateStr(new Date(e.start_at)) === toDateStr(d));

    // 「自分の予定」= 自分が自分のために作った OR 相手が自分のために作った
    const isMyEvent = (ev: CalEvent) =>
        (ev.user_id === myId && !ev.is_shared) || (ev.user_id !== myId && ev.is_shared);

    const getBadgeColor = (ev: CalEvent): string => {
        const isMine = isMyEvent(ev);
        if (myGender === "boyfriend") {
            return isMine ? "#4dd0e1" : "#f5317f";
        } else {
            return isMine ? "#f5317f" : "#4dd0e1";
        }
    };

    return (
        <div className={`cal-wrapper theme-${myGender}`}>

            <AppHeader
                variant="calendar"
                title={`${year}年${month + 1}月`}
                onPrev={prevMonth}
                onNext={nextMonth}
            />

            <div className="cal-weekdays">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`cal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>
                        {d}
                    </div>
                ))}
            </div>

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