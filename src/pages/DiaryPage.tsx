import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AppHeader from "../components/AppHeader";
import TabBar from "../components/TabBar";
import {
    PiSmileyAngryBold,
    PiSmileySadBold,
    PiSmileyMehBold,
    PiSmileyBold,
    PiSmileyWinkBold,
} from "react-icons/pi";
import "../styles/diary.css";

// ===== 感情定義 =====
// 左（悲しい）→ 右（楽しい）の順に並ぶ
// color: ボールの背景色, size: ボールの大きさ（選択に近いほど大きい）
const EMOTIONS = [
    {
        id: 0,
        label: "つらい",
        color: "#b0bec5",    // グレー
        size: 52,
        Icon: PiSmileyAngryBold,
        iconColor: "#78909c",
    },
    {
        id: 1,
        label: "かなしい",
        color: "#90caf9",    // 薄青
        size: 60,
        Icon: PiSmileySadBold,
        iconColor: "#5b7fa6",
    },
    {
        id: 2,
        label: "ふつう",
        color: "#ffcc80",    // 黄オレンジ（中央・一番大きい）
        size: 72,
        Icon: PiSmileyMehBold,
        iconColor: "#b8860b",
    },
    {
        id: 3,
        label: "うれしい",
        color: "#f48fb1",    // ピンク
        size: 60,
        Icon: PiSmileyBold,
        iconColor: "#c2185b",
    },
    {
        id: 4,
        label: "たのしい",
        color: "#ef9a9a",    // サーモン
        size: 52,
        Icon: PiSmileyWinkBold,
        iconColor: "#c62828",
    },
] as const;

type EmotionId = 0 | 1 | 2 | 3 | 4;
type MyGender = "boyfriend" | "girlfriend";

// ===== ダミーグラフデータ（DB接続後は削除） =====
// 過去7日分の感情スコア（0〜4）
const DUMMY_MY_SCORES = [2, 1, 3, 2, 4, 3, 2];
const DUMMY_PARTNER_SCORES = [3, 2, 1, 3, 2, 4, 3];
const WEEK_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

// ===== 折れ線グラフ =====
interface LineGraphProps {
    myScores: number[];
    partnerScores: number[];
    myGender: MyGender;
}

function LineGraph({ myScores, partnerScores, myGender }: LineGraphProps) {
    const W = 300;
    const H = 80;
    const PAD = 8;
    const n = myScores.length;

    // スコア（0〜4）をY座標に変換（上が大きい）
    const toY = (score: number) => H - PAD - ((score / 4) * (H - PAD * 2));
    const toX = (i: number) => PAD + (i / (n - 1)) * (W - PAD * 2);

    const toPath = (scores: number[]) =>
        scores.map((s, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(s)}`).join(" ");

    const myColor = myGender === "boyfriend" ? "#4dd0e1" : "#f5317f";
    const pareColor = myGender === "boyfriend" ? "#f5317f" : "#4dd0e1";

    return (
        <svg
            className="diary-graph-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
        >
            {/* グリッド線 */}
            {[0, 1, 2, 3, 4].map(v => (
                <line
                    key={v}
                    x1={PAD} y1={toY(v)}
                    x2={W - PAD} y2={toY(v)}
                    stroke="#f0d0d8"
                    strokeWidth="0.5"
                    strokeDasharray="3,3"
                />
            ))}

            {/* パートナーの折れ線 */}
            <path
                d={toPath(partnerScores)}
                fill="none"
                stroke={pareColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 自分の折れ線 */}
            <path
                d={toPath(myScores)}
                fill="none"
                stroke={myColor}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* 自分のドット */}
            {myScores.map((s, i) => (
                <circle key={i} cx={toX(i)} cy={toY(s)} r="3" fill={myColor} />
            ))}

            {/* パートナーのドット */}
            {partnerScores.map((s, i) => (
                <circle key={i} cx={toX(i)} cy={toY(s)} r="3" fill={pareColor} />
            ))}
        </svg>
    );
}

// ===== メイン =====
function DiaryPage() {
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");
    const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>(2); // デフォルト: ふつう
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // グラフデータ（DB接続後はsupabaseから取得）
    const [myScores] = useState<number[]>(DUMMY_MY_SCORES);
    const [partnerScores] = useState<number[]>(DUMMY_PARTNER_SCORES);

    // ===== プロフィール取得 =====
    useEffect(() => {
        const fetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("profiles")
                .select("gender")
                .eq("id", user.id)
                .single();
            if (data?.gender) setMyGender(data.gender as MyGender);

            // ===== DB接続後: 過去7日分の感情スコアを取得 =====
            // const { data: logs } = await supabase
            //   .from("メッセージストレージ")
            //   .select("id, sendAt, message, isMemory")
            //   .eq("isMemory", true)
            //   .order("sendAt", { ascending: false })
            //   .limit(7);
        };
        fetch();
    }, []);

    // ===== 保存処理 =====
    const handleSave = async () => {
        if (!text.trim()) return;
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("未ログイン");

            // DB定義: id(送信者UUID), sendAt, message, isMemory
            // emotionはmessageにJSONで埋め込む（または別カラムを追加）
            const payload = JSON.stringify({
                emotion: selectedEmotion,
                text: text.trim(),
            });

            const { error } = await supabase.from("メッセージストレージ").insert({
                id: user.id,
                sendAt: new Date().toISOString(),
                message: payload,
                isMemory: true,   // 一言日記フラグ
            });
            if (error) throw error;

            setText("");
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error("保存エラー:", e);
        } finally {
            setSaving(false);
        }
    };

    // メーターのfill幅（0〜4 → 0%〜100%）
    const meterPercent = (selectedEmotion / 4) * 100;

    const currentEmotion = EMOTIONS[selectedEmotion];

    return (
        <div className="diary-wrapper">

            {/* ===== ヘッダー ===== */}
            <AppHeader variant="simple" title="一言日記" />

            {/* ===== 感情選択エリア ===== */}
            <div className="diary-emotion-area">

                {/* 感情ボール列 */}
                <div className="diary-emotion-row">
                    {EMOTIONS.map((em) => {
                        const Icon = em.Icon;
                        const isSelected = selectedEmotion === em.id;
                        return (
                            <button
                                key={em.id}
                                className={`emotion-ball ${isSelected ? "selected" : ""}`}
                                style={{
                                    width: em.size,
                                    height: em.size,
                                    background: em.color,
                                    // 未選択は少し透明にして選択中を際立たせる
                                    opacity: isSelected ? 1 : 0.7,
                                }}
                                onClick={() => setSelectedEmotion(em.id as EmotionId)}
                                aria-label={em.label}
                            >
                                <Icon
                                    size={em.size * 0.48}
                                    color={em.iconColor}
                                />
                            </button>
                        );
                    })}
                </div>

                {/* 感情ラベル（各感情の固定テキスト） */}
                <p className="diary-emotion-label">{currentEmotion.label}</p>
            </div>

            {/* ===== 感情メーター ===== */}
            <div className="diary-meter-area">
                <div className="diary-meter-track" style={{ flex: 1 }}>
                    <div
                        className="diary-meter-fill"
                        style={{ width: `${meterPercent}%` }}
                    />
                    {/* 右側の目盛り */}
                    <div className="diary-meter-ticks">
                        {[12, 10, 8, 6, 5, 4, 4, 4].map((h, i) => (
                            <div
                                key={i}
                                className="diary-meter-tick"
                                style={{ height: h }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== テキスト入力 ===== */}
            <div className="diary-input-area">
                <p className="diary-input-label">今日の一言</p>
                <textarea
                    className="diary-input"
                    placeholder="今日はどんな一日でしたか？"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                />
                <button
                    className="diary-submit-btn"
                    onClick={handleSave}
                    disabled={saving || !text.trim()}
                >
                    {saving ? "保存中..." : saved ? "保存しました！" : "保存する"}
                </button>
            </div>

            {/* ===== 1週間のグラフ ===== */}
            <div className="diary-graph-area">
                <div className="diary-graph-header">
                    <span className="diary-graph-icon">〜</span>
                    <p className="diary-graph-title">1週間の2人の気持ち</p>
                </div>

                {/* 凡例 */}
                <div className="diary-graph-legend">
                    <div className="legend-item">
                        <div className={`legend-dot legend-dot--${myGender === "boyfriend" ? "cyan" : "pink"}`} />
                        <span>自分</span>
                    </div>
                    <div className="legend-item">
                        <div className={`legend-dot legend-dot--${myGender === "boyfriend" ? "pink" : "cyan"}`} />
                        <span>パートナー</span>
                    </div>
                </div>

                {/* 折れ線グラフ */}
                <LineGraph
                    myScores={myScores}
                    partnerScores={partnerScores}
                    myGender={myGender}
                />

                {/* X軸ラベル（曜日） */}
                <div className="diary-graph-xlabels">
                    {WEEK_LABELS.map(d => (
                        <span key={d} className="diary-graph-xlabel">{d}</span>
                    ))}
                </div>
            </div>

            <TabBar />
        </div>
    );
}

export default DiaryPage;