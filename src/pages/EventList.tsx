import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HiPlus, HiChevronLeft } from "react-icons/hi2";
import "../styles/calendar.css";

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

function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function EventList() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const dateStr = params.get("date") ?? new Date().toISOString().slice(0, 10);

    const [myId, setMyId]         = useState<string | null>(null);
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [events, setEvents]     = useState<CalEvent[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setMyId(user.id);

            const { data: profile } = await supabase
                .from("profiles").select("gender").eq("id", user.id).single();
            setMyGender(profile?.gender === false ? "boyfriend" : "girlfriend");

            const from = dateStr + "T00:00:00.000Z";
            const to   = dateStr + "T23:59:59.999Z";

            const { data, error } = await supabase
                .from("schedules")
                .select("id, user_id, name, start_at, end_at, is_shared, all_day, memo")
                .gte("start_at", from)
                .lte("start_at", to)
                .order("start_at", { ascending: true });

            if (error) console.error(error.message);
            else setEvents((data ?? []) as CalEvent[]);
            setLoading(false);
        };
        fetchData();
    }, [dateStr]);

    return (
        <div className={`cal-wrapper theme-${myGender}`}>
            <div className="event-list-header">
                <button className="event-list-back-btn" onClick={() => navigate("/calendar")}>
                    <HiChevronLeft size={22} />
                </button>
                <p className="event-list-title">{formatDateHeader(dateStr)}</p>
                <button
                    className="event-list-add-btn"
                    onClick={() => navigate(`/event?date=${dateStr}&new=true`)}
                >
                    <HiPlus size={20} color="white" />
                </button>
            </div>

            <div className="event-list-body">
                {loading ? (
                    <p className="event-list-empty">読み込み中...</p>
                ) : events.length === 0 ? (
                    <p className="event-list-empty">予定はありません</p>
                ) : (
                    events.map(ev => (
                        <div
                            key={ev.id}
                            className="event-list-item"
                            onClick={() => navigate(
                                `/event?date=${ev.start_at.slice(0, 10)}&id=${ev.id}&isPare=${ev.user_id !== myId}`
                            )}
                        >
                            <div className={`event-list-line ${ev.user_id === myId ? "line-mine" : "line-pare"}`} />
                            <div className="event-list-info">
                                <p className="event-list-name">{ev.name}</p>
                                {ev.memo && <p className="event-list-memo">{ev.memo}</p>}
                            </div>
                            <div className="event-list-times">
                                {ev.all_day ? (
                                    <span style={{ color: "var(--cal-accent)", fontWeight: 600 }}>終日</span>
                                ) : (
                                    <>
                                        <span>{formatTime(ev.start_at)}</span>
                                        <span>{formatTime(ev.end_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EventList;