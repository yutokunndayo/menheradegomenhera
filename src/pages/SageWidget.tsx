import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import "../styles/SageWidget.css";

// ===== 型定義 =====
export interface SageMessage {
    id: string;
    text: string;
    type: "warning" | "suggestion" | "praise" | "idle";
}

// ===== 画像差し込み口 =====
// 仙人の画像が用意できたら以下をコメントアウト解除して
// import sageImage from "../assets/sage.png";
// const SAGE_IMAGE = sageImage;
const SAGE_IMAGE: string | null = null; // ← 画像なし時はnull（絵文字にフォールバック）
const SAGE_EMOJI = "🧙";               // ← 画像がない間の代替

// 吹き出しの色テーマ
const THEME = {
    warning: { bg: "#fff8e1", border: "#f5a623" },
    suggestion: { bg: "#e8f4fd", border: "#4dd0e1" },
    praise: { bg: "#e8f8e8", border: "#66bb6a" },
    idle: { bg: "#fff5f8", border: "#f5317f" },
};

const TYPE_LABEL: Record<SageMessage["type"], string> = {
    warning: "⚠️ 注意",
    suggestion: "💡 提案",
    praise: "✨ いいね",
    idle: "",
};

// ===== ダミーメッセージ（AI接続後は削除） =====
const DUMMY_MESSAGES: SageMessage[] = [
    { id: "d1", text: "返信が途切れそうじゃ。一言添えて締めくくるとよいぞ", type: "warning" },
    { id: "d2", text: "「了解」だけだと少し寂しいかもしれん。「ありがとう、助かる！」くらい添えてみるのじゃ", type: "suggestion" },
    { id: "d3", text: "今日の返信、とてもよかったぞ。その調子じゃ！", type: "praise" },
    { id: "d4", text: "今日も2人の関係を見守っているぞ。何かあれば相談するがよい", type: "idle" },
];

// ===== Props =====
interface SageWidgetProps {
    message?: SageMessage | null;
    isBoyfriend: boolean;
}

function SageWidget({ isBoyfriend }: SageWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    // ダミーで初期化 → 最初から仙人に未読バッジがつく
    // AI接続後は useState(null) に戻してポーリングに任せる
    const [message, setMessage] = useState<SageMessage | null>(DUMMY_MESSAGES[0]);
    const [hasUnread, setHasUnread] = useState(true);
    const [isPopping, setIsPopping] = useState(false);
    const lastIdRef = useRef<string | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dummyIndexRef = useRef(0); // ダミーを順番に出すためのカウンター

    // 彼女側は非表示
    if (!isBoyfriend) return null;

    // ===== chat_emotion_contexts をポーリング =====
    // AIが emotion_text を書き込んだら仙人が表示される
    useEffect(() => {
        const poll = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("chat_emotion_contexts")
                .select("id, emotion_text, emotion_type")
                .eq("user_id", user.id)           // 自分宛てのメッセージのみ
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (!data) return;

            // 新しいメッセージが来た場合のみ処理
            if (data.id === lastIdRef.current) return;
            lastIdRef.current = data.id;

            const newMsg: SageMessage = {
                id: String(data.id),
                text: data.emotion_text,
                type: (data.emotion_type as SageMessage["type"]) ?? "suggestion",
            };

            setMessage(newMsg);
            setHasUnread(true);
            // 自動で吹き出しを表示
            setIsOpen(true);
            setIsPopping(true);
            setTimeout(() => setIsPopping(false), 400);
        };

        // 5秒ごとにポーリング
        pollingRef.current = setInterval(poll, 5000);
        poll(); // 初回即時実行

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleIconTap = useCallback(() => {
        if (isOpen) {
            setIsOpen(false);
        } else {
            // ダミーメッセージを順番に表示（AI接続後はこのelse分岐を削除）
            dummyIndexRef.current = (dummyIndexRef.current + 1) % DUMMY_MESSAGES.length;
            setMessage(DUMMY_MESSAGES[dummyIndexRef.current]);
            setIsOpen(true);
            setHasUnread(false);
            setIsPopping(true);
            setTimeout(() => setIsPopping(false), 400);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setHasUnread(false);
    }, []);

    const theme = THEME[message?.type ?? "idle"];

    return (
        <div className="sage-root">

            {/* ===== 吹き出し ===== */}
            {isOpen && message && (
                <div
                    className={`sage-bubble ${isPopping ? "sage-bubble--pop" : ""}`}
                    style={{ background: theme.bg, borderColor: theme.border }}
                >
                    <button className="sage-close" onClick={handleClose} aria-label="閉じる">✕</button>

                    {message.type !== "idle" && (
                        <span className="sage-badge-type" style={{ background: theme.border }}>
                            {TYPE_LABEL[message.type]}
                        </span>
                    )}

                    <p className="sage-bubble-text">{message.text}</p>

                    {/* 吹き出しの三角 */}
                    <div className="sage-tail" style={{ borderTopColor: theme.border }}>
                        <div className="sage-tail-inner" style={{ borderTopColor: theme.bg }} />
                    </div>
                </div>
            )}

            {/* ===== 仙人アイコン ===== */}
            <button
                className={`sage-icon ${message?.type !== "idle" && message ? "sage-icon--active" : ""}`}
                onClick={handleIconTap}
                aria-label="仙人に相談"
            >
                {/* 画像があれば画像、なければ絵文字 */}
                {SAGE_IMAGE ? (
                    <img src={SAGE_IMAGE} alt="仙人" className="sage-img" />
                ) : (
                    <span className="sage-emoji">{SAGE_EMOJI}</span>
                )}

                {/* 未読バッジ */}
                {hasUnread && !isOpen && <span className="sage-unread-dot" />}
            </button>
        </div>
    );
}

export default SageWidget;