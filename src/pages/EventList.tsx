import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { HiPlus, HiChevronLeft } from "react-icons/hi2";
import "../styles/calendar.css";

// ===== 型定義 =====
interface CalEvent {
    id: string;
    taskid: string;
    name: string;
    date: string;
    duration: string;
    isPare: boolean;
}

type MyGender = "boyfriend" | "girlfriend";

// ===== ダミー予定（CalendarPage.tsxと同じもの） =====
// DB接続後は削除してSupabaseから取得する
const DUMMY_EVENTS: CalEvent[] = [
    {
        id: "dummy-1", taskid: "t1", name: "バイト",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 18, 0).toISOString(),
        isPare: false,
    },
    {
        id: "dummy-2", taskid: "t2", name: "デート",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 14, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 8, 20, 0).toISOString(),
        isPare: true,
    },
    {
        id: "dummy-3", taskid: "t3", name: "映画",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 18, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 15, 21, 0).toISOString(),
        isPare: true,
    },
    {
        id: "dummy-4", taskid: "t4", name: "ジム",
        date: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 9, 0).toISOString(),
        duration: new Date(new Date().getFullYear(), new Date().getMonth(), 22, 11, 0).toISOString(),
        isPare: false,
    },
];

// 時刻フォーマット（例: "12:00"）
function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// 日付ヘッダーフォーマット（例: "3月1日（日）"）
function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
}

function EventList() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const dateStr = params.get("date") ?? new Date().toISOString().slice(0, 10);

    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [events, setEvents] = useState<CalEvent[]>([]);

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
            // const from = dateStr + "T00:00:00.000Z";
            // const to   = dateStr + "T23:59:59.999Z";
            // const { data } = await supabase
            //   .from("予定")
            //   .select("*")
            //   .gte("date", from)
            //   .lte("date", to)
            //   .order("date", { ascending: true });
            // if (data) setEvents(data as CalEvent[]);

            // ダミーからその日の予定だけ抽出
            const dayEvents = DUMMY_EVENTS.filter(e => e.date.slice(0, 10) === dateStr);
            setEvents(dayEvents);
        };
        fetchData();
    }, [dateStr]);

    return (
        <div className={`cal-wrapper theme-${myGender}`}>

            {/* ===== ヘッダー ===== */}
            <div className="event-list-header">
                {/* 戻るボタン */}
                <button
                    className="event-list-back-btn"
                    onClick={() => navigate("/calendar")}
                    aria-label="カレンダーへ戻る"
                >
                    <HiChevronLeft size={22} />
                </button>

                {/* 日付タイトル */}
                <p className="event-list-title">{formatDateHeader(dateStr)}</p>

                {/* 新規追加ボタン */}
                <button
                    className="event-list-add-btn"
                    onClick={() => navigate(`/event?date=${dateStr}&new=true`)}
                    aria-label="予定を追加"
                >
                    <HiPlus size={20} color="white" />
                </button>
            </div>

            {/* ===== 予定リスト ===== */}
            <div className="event-list-body">
                {events.length === 0 ? (
                    // 予定がない日
                    <p className="event-list-empty">予定はありません</p>
                ) : (
                    events.map(ev => (
                        <div
                            key={ev.id}
                            className="event-list-item"
                            // 予定をタップ → EventDetailに既存情報を渡して編集モードで開く
                            onClick={() => navigate(
                                `/event?date=${ev.date.slice(0, 10)}&id=${ev.taskid}&isPare=${ev.isPare}`
                            )}
                        >
                            {/* 左の色ライン（自分=テーマ色 / パートナー=ピンクor水色） */}
                            <div className={`event-list-line ${ev.isPare ? "line-pare" : "line-mine"}`} />

                            {/* 予定情報 */}
                            <div className="event-list-info">
                                <p className="event-list-name">{ev.name}</p>
                                {/* メモがある場合はここに表示（DB接続後に ev.memo を使う） */}
                            </div>

                            {/* 時刻 */}
                            <div className="event-list-times">
                                <span>{formatTime(ev.date)}</span>
                                <span>{formatTime(ev.duration)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EventList;