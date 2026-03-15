import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getCachedProfile, getCachedGender } from "../lib/userCache";
import AppHeader from "../components/AppHeader";
import TabBar from "../components/TabBar";
import TitlePage from "./TitlePage";
import "../styles/diary.css";

const EMOTION_COLORS = ["#FFB39E", "#AFE7FF", "#A5EAB0", "#FFDFA8", "#E1A5EA"];

type MyGender = "boyfriend" | "girlfriend";

interface DiaryEntry {
    date: string;
    myEmotion: number | null;
    partnerEmotion: number | null;
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
    const today    = new Date();
    const [year,      setYear]      = useState(today.getFullYear());
    const [month,     setMonth]     = useState(today.getMonth());
    const [myGender,    setMyGender]    = useState<MyGender>(getCachedGender() ?? "boyfriend");
    const [myId,        setMyId]        = useState<string | null>(null);
    const [partnerId,   setPartnerId]   = useState<string | null>(null);
    const [genderReady, setGenderReady] = useState<boolean>(getCachedGender() !== null);
    const [entries,   setEntries]   = useState<DiaryEntry[]>([]);

    const days = buildCalDays(year, month);

    const myColor      = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor    = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";
    const partnerLabel = myGender === "boyfriend" ? "彼女（下）" : "彼氏（下）";

    // ===== プロフィール取得（キャッシュ優先） =====
    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await getCachedProfile();
            if (!profile) return;
            setMyId(profile.id);
            setMyGender(profile.gender === false ? "boyfriend" : "girlfriend");
            if (profile.partner) setPartnerId(profile.partner);
            setGenderReady(true);
        };
        fetchProfile();
    }, []);

    // ===== 月が変わるたびに日記を取得 =====
    useEffect(() => {
        if (!myId) return;

        const fetchEntries = async () => {
            const from = new Date(year, month, 1).toISOString();
            const to   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

            // 自分の日記
            const { data: myLogs } = await supabase
                .from("diary_entries")
                .select("emotion, created_at")
                .eq("user_id", myId)
                .gte("created_at", from)
                .lte("created_at", to);

            // パートナーの日記
            let pLogs: { emotion: number; created_at: string }[] = [];
            if (partnerId) {
                const { data } = await supabase
                    .from("diary_entries")
                    .select("emotion, created_at")
                    .eq("user_id", partnerId)
                    .gte("created_at", from)
                    .lte("created_at", to);
                pLogs = data ?? [];
            }

            // 日付をキーにしてマージ
            const map: Record<string, DiaryEntry> = {};

            (myLogs ?? []).forEach(log => {
                const date = log.created_at.slice(0, 10);
                if (!map[date]) map[date] = { date, myEmotion: null, partnerEmotion: null };
                map[date].myEmotion = log.emotion;
            });

            pLogs.forEach(log => {
                const date = log.created_at.slice(0, 10);
                if (!map[date]) map[date] = { date, myEmotion: null, partnerEmotion: null };
                map[date].partnerEmotion = log.emotion;
            });

            setEntries(Object.values(map));
        };

        fetchEntries();
    }, [myId, partnerId, year, month]);

    const prevMonth = () => {
        if (month === 0) { setYear(y => y - 1); setMonth(11); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setYear(y => y + 1); setMonth(0); }
        else setMonth(m => m + 1);
    };

    const getEntry = (d: Date) => entries.find(e => e.date === toDateStr(d)) ?? null;

    if (!genderReady) return <TitlePage hideTimer />;

    return (
        <div className="diary-wrapper">
            <AppHeader
                variant="calendar"
                title={`${year}年${month + 1}月`}
                onPrev={prevMonth}
                onNext={nextMonth}
            />

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

            <div className="dcal-weekdays">
                {WEEKDAYS.map((d, i) => (
                    <div key={d} className={`dcal-weekday ${i === 5 ? "sat" : i === 6 ? "sun" : ""}`}>{d}</div>
                ))}
            </div>

            <div className="dcal-grid">
                {days.map((d, i) => {
                    const isOther = d.getMonth() !== month;
                    const isToday = toDateStr(d) === toDateStr(today);
                    const dow     = (d.getDay() + 6) % 7;
                    const entry   = getEntry(d);

                    return (
                        <div
                            key={i}
                            className={[
                                "dcal-day",
                                isOther  ? "other-month" : "",
                                isToday  ? "today"       : "",
                                dow === 5 ? "sat" : dow === 6 ? "sun" : "",
                            ].join(" ")}
                            onClick={() => !isOther && navigate(`/diary-detail?date=${toDateStr(d)}`)}
                        >
                            <span className="dcal-day-num">{d.getDate()}</span>

                            {!isOther && entry && (
                                <div className="dcal-dot-rows">
                                    <div className="dcal-dot-row">
                                        <div className="dcal-dot" style={{
                                            background: entry.myEmotion !== null
                                                ? EMOTION_COLORS[entry.myEmotion] : "transparent",
                                        }} />
                                    </div>
                                    <div className="dcal-dot-row">
                                        <div className="dcal-dot" style={{
                                            background: entry.partnerEmotion !== null
                                                ? EMOTION_COLORS[entry.partnerEmotion] : "transparent",
                                        }} />
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