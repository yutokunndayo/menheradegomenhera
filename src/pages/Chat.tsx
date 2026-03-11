import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabBar from "../components/TabBar";
import "./chat.css";

// ===== 型定義 =====
interface Message {
    id: string;
    sender: "me" | "partner";
    text: string;
    time: string;
}

// ===== ダミーメッセージ（実際のDBに繋ぐ場合は差し替え） =====
const dummyMessages: Message[] = [
    { id: "1", sender: "partner", text: "会いたい", time: "10:00" },
    { id: "2", sender: "me", text: "俺もだよ\n早く会いたい", time: "10:01" },
    { id: "3", sender: "partner", text: "最近返信遅くない？", time: "10:05" },
    { id: "4", sender: "partner", text: "他の子と遊んだりしてないよね", time: "10:05" },
    { id: "5", sender: "partner", text: "ねえ、なにしてるの", time: "10:10" },
    { id: "6", sender: "partner", text: "なんで見てくれないの", time: "10:10" },
    { id: "7", sender: "partner", text: "わざと返してないよね", time: "10:11" },
    { id: "8", sender: "partner", text: "そういうところほんと無理", time: "10:11" },
];

function Chat() {
    const [messages, setMessages] = useState<Message[]>(dummyMessages);
    const [input, setInput] = useState("");
    const [partnerName, setPartnerName] = useState("彼女ちゃん");
    const [partnerIcon, setPartnerIcon] = useState<string | null>(null); // Home.tsxで設定したアイコンURLが入る想定
    const bottomRef = useRef<HTMLDivElement>(null);

    // 最新メッセージへ自動スクロール
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // パートナー情報をprofilesから取得（実装例）
    useEffect(() => {
        const fetchPartner = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            // ここでprofilesテーブルからパートナー情報を取得する
            // const { data } = await supabase.from("profiles").select("name, icon_url").eq("id", partnerId).single();
            // if (data) { setPartnerName(data.name); setPartnerIcon(data.icon_url); }
        };
        fetchPartner();
    }, []);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;
        const newMsg: Message = {
            id: Date.now().toString(),
            sender: "me",
            text,
            time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInput("");
    };

    return (
        <div className="chat-wrapper">
            {/* ===== スカラップヘッダー ===== */}
            <div className="chat-header">
                {/*
          パートナーアイコン差し込み方法:
          Home.tsxで設定したアイコンURLをstateやcontextで渡す
          partnerIconがnullの場合はプレースホルダーを表示
        */}
                <div className="chat-header-icon">
                    {partnerIcon ? (
                        <img src={partnerIcon} alt={partnerName} className="chat-partner-img" />
                    ) : (
                        <div className="chat-partner-placeholder" aria-label="パートナーアイコン">
                            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                                <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                                <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </div>
                    )}
                </div>
                <p className="chat-header-name">{partnerName}</p>
            </div>

            {/* ===== メッセージエリア ===== */}
            <div className="chat-messages">
                {/*
          上部装飾画像プレースホルダー:
          差し込む場合は以下をコメントアウト解除して画像パスを指定
          <img src="/deco-top.png" alt="" className="chat-deco-top" />
        */}

                {messages.map((msg, i) => {
                    const isPartner = msg.sender === "partner";
                    // アイコンを表示するのは連続メッセージの最初だけ
                    const showIcon =
                        isPartner &&
                        (i === 0 || messages[i - 1].sender !== "partner");

                    return (
                        <div
                            key={msg.id}
                            className={`chat-row ${isPartner ? "row-partner" : "row-me"}`}
                        >
                            {/* パートナーのアイコン */}
                            {isPartner && (
                                <div className="chat-row-icon">
                                    {showIcon && (
                                        partnerIcon ? (
                                            <img src={partnerIcon} alt="" className="bubble-partner-img" />
                                        ) : (
                                            <div className="bubble-partner-placeholder">
                                                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                                                    <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
                                                    <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            <div className="chat-bubble-wrap">
                                <div className={`chat-bubble ${isPartner ? "bubble-partner" : "bubble-me"}`}>
                                    {msg.text.split("\n").map((line, j) => (
                                        <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                                    ))}
                                </div>
                                {/*
                  リボン装飾画像プレースホルダー:
                  差し込む場合は以下をコメントアウト解除して画像パスを指定
                  <img src="/ribbon.png" alt="" className={`bubble-ribbon ${isPartner ? "ribbon-partner" : "ribbon-me"}`} />
                */}
                                <div className={`bubble-ribbon-placeholder ${isPartner ? "ribbon-partner" : "ribbon-me"}`}>
                                    🎀
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/*
          下部装飾画像プレースホルダー:
          差し込む場合は以下をコメントアウト解除して画像パスを指定
          <img src="/deco-bottom.png" alt="" className="chat-deco-bottom" />
        */}

                <div ref={bottomRef} />
            </div>

            {/* ===== 入力バー ===== */}
            <div className="chat-input-bar">
                <input
                    className="chat-input"
                    type="text"
                    placeholder="メッセージを入力"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    aria-label="送信"
                >
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                        <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            {/* ===== タブバー ===== */}
            <TabBar />
        </div>
    );
}

export default Chat;