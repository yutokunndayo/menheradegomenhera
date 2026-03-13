import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import TabBar from "../components/TabBar";
import { FiSend } from "react-icons/fi";       // 送信ボタン
import { FiUser } from "react-icons/fi";       // アイコンプレースホルダー（ヘッダー・バブル横）
import "../styles/Chat.css";

// ===== 型定義 =====
interface Message {
    id: string;
    sender: "me" | "partner";
    text: string;
    time: string;
}

// ===== 自分の性別の型 =====
// "boyfriend" = 自分が彼氏 → 相手は必ず彼女
// "girlfriend" = 自分が彼女 → 相手は必ず彼氏
// この1つの値だけで自分・相手 両方のスタイルが決まる
type MyGender = "boyfriend" | "girlfriend";

// ===== 性別ごとのスタイル設定 =====
// myGender の値をキーにしてテーマを取り出す
//
// 【リボン画像を差し込む場合】
// myRibbonImage / partnerRibbonImage を null から画像パスに変更する
// 例: myRibbonImage: "/ribbons/blue-ribbon.png"
// null のままなら myRibbon / partnerRibbon の絵文字にフォールバックする
const GENDER_THEME: Record<MyGender, {
    myBubbleClass: string;             // 自分バブルのCSSクラス名（Chat.cssで定義）
    partnerBubbleClass: string;        // 相手バブルのCSSクラス名（Chat.cssで定義）
    myRibbon: string;                  // 自分バブルのリボン絵文字（画像がない場合のフォールバック）
    partnerRibbon: string;             // 相手バブルのリボン絵文字（画像がない場合のフォールバック）
    myRibbonImage: string | null;      // 自分バブルのリボン画像パス（null=絵文字を使う）
    partnerRibbonImage: string | null; // 相手バブルのリボン画像パス（null=絵文字を使う）
}> = {
    // 自分が彼氏のテーマ（相手は彼女）
    boyfriend: {
        myBubbleClass: "bubble-me-boyfriend",
        partnerBubbleClass: "bubble-partner-girlfriend",
        myRibbon: "🎀",
        partnerRibbon: "🎀",
        myRibbonImage: null,
        partnerRibbonImage: null,
    },
    // 自分が彼女のテーマ（相手は彼氏）
    girlfriend: {
        myBubbleClass: "bubble-me-girlfriend",
        partnerBubbleClass: "bubble-partner-boyfriend",
        myRibbon: "🎀",
        partnerRibbon: "🎀",
        myRibbonImage: null,
        partnerRibbonImage: null,
    },
};

// ===== ダミーメッセージ（DBに繋いだら差し替え） =====
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
    const [partnerIcon, setPartnerIcon] = useState<string | null>(null);

    // ===== 自分の性別 =====
    // この1つのstateだけで自分・相手 両方のテーマが切り替わる
    // 初期値は "boyfriend"（DBから取得できるまでのフォールバック）
    const [myGender, setMyGender] = useState<MyGender>("boyfriend");

    // myGender → GENDER_THEME[myGender] でテーマオブジェクトを取得
    const theme = GENDER_THEME[myGender];

    // メッセージエリアの一番下を参照するref（自動スクロール用）
    const bottomRef = useRef<HTMLDivElement>(null);

    // ===== メッセージが増えたら最下部へスクロール =====
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ===== Supabaseからプロフィール情報を取得 =====
    // テーブル定義:
    //   profiles: id, name, gender, partner(UUID), avatar(path)
    useEffect(() => {
        const fetchProfile = async () => {
            // ログイン中のユーザーを取得する
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // ── Step1: 自分のプロフィールを取得 ──
            // profiles テーブルから自分の name / gender / partner(相手のid) / avatar を取得する
            const { data: myProfile } = await supabase
                .from("profiles")
                .select("name, gender, partner, avatar")
                .eq("id", user.id)
                .single();

            if (!myProfile) return;

            // gender は Setup.tsx で保存した "boyfriend" / "girlfriend" が入ってくる
            // この1行でテーマ全体（自分・相手の両方のバブル色・装飾）が切り替わる
            setMyGender((myProfile.gender as MyGender) ?? "boyfriend");

            // ── Step2: パートナーのプロフィールを取得 ──
            // myProfile.partner が自分のDBに入っている相手のUUID
            // そのUUIDで相手の name / avatar を取得する
            if (myProfile.partner) {
                const { data: partnerProfile } = await supabase
                    .from("profiles")
                    .select("name, avatar")
                    .eq("id", myProfile.partner)
                    .single();

                if (partnerProfile) {
                    // パートナーの名前をヘッダーに表示する
                    setPartnerName(partnerProfile.name ?? "彼女ちゃん");

                    // パートナーのアバター画像パスをStorageのURLに変換してセットする
                    // avatar カラムには Storage のファイルパスが入っている想定
                    if (partnerProfile.avatar) {
                        const { data: urlData } = supabase.storage
                            .from("avatars")
                            .getPublicUrl(partnerProfile.avatar);
                        setPartnerIcon(urlData.publicUrl);
                    }
                }
            }
        };
        fetchProfile();
    }, []);

    // ===== メッセージ送信処理 =====
    const handleSend = () => {
        const text = input.trim();
        if (!text) return;

        // 新しいメッセージオブジェクトを作って末尾に追加する
        // TODO: DBのメッセージストレージテーブルへの保存も追加する
        //   supabase.from("messages").insert({
        //     id: user.id,          // 送信者のid
        //     message: text,        // 内容
        //     sendAt: new Date(),   // 送った時間
        //     isMemory: false,      // チャット（一言日記ではない）
        //   })
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
            {/* chat.css の .chat-header::after でスカラップ（波型）下端を描画している */}
            <div className="chat-header">

                {/* パートナーのアイコン */}
                {/* partnerIcon が null のうちは FiUser アイコンをプレースホルダーとして表示 */}
                {/* Step2 でパートナーの avatar が取得できたら img に自動切り替わる */}
                <div className="chat-header-icon">
                    {partnerIcon ? (
                        <img src={partnerIcon} alt={partnerName} className="chat-partner-img" />
                    ) : (
                        <div className="chat-partner-placeholder" aria-label="パートナーアイコン">
                            <FiUser size={22} color="white" strokeWidth={1.8} />
                        </div>
                    )}
                </div>

                {/* パートナーの名前（Step2 で取得した name が入る） */}
                <p className="chat-header-name">{partnerName}</p>
            </div>

            {/* ===== メッセージエリア ===== */}
            <div className="chat-messages">

                {/*
                    ===== 上部装飾画像 =====
                    メッセージ一覧の一番上に表示する装飾
                    画像を用意したらコメントを解除して画像パスを指定する

                    myGender で画像を切り替えたい場合:
                    <img
                        src={myGender === "boyfriend" ? "/deco/top-blue.png" : "/deco/top-pink.png"}
                        alt=""
                        className="chat-deco-top"
                    />
                */}

                {messages.map((msg, i) => {
                    const isPartner = msg.sender === "partner";

                    // ===== アイコン表示判定 =====
                    // 連続するパートナーメッセージの最初の1件だけアイコンを表示する
                    const showIcon =
                        isPartner && (i === 0 || messages[i - 1].sender !== "partner");

                    // ===== バブルクラスの決定 =====
                    // myGender → theme → bubbleClass の順で決まる
                    const bubbleClass = isPartner
                        ? theme.partnerBubbleClass
                        : theme.myBubbleClass;

                    // ===== リボン装飾の決定 =====
                    const ribbonImage = isPartner
                        ? theme.partnerRibbonImage
                        : theme.myRibbonImage;
                    const ribbonEmoji = isPartner
                        ? theme.partnerRibbon
                        : theme.myRibbon;

                    return (
                        <div
                            key={msg.id}
                            className={`chat-row ${isPartner ? "row-partner" : "row-me"}`}
                        >
                            {/* ===== パートナー側のアイコン領域 ===== */}
                            {/* 自分のメッセージ（row-me）のときはこのブロック自体を描画しない */}
                            {isPartner && (
                                <div className="chat-row-icon">
                                    {/* showIcon=true のときだけアイコンを描画 */}
                                    {showIcon && (
                                        partnerIcon ? (
                                            <img src={partnerIcon} alt="" className="bubble-partner-img" />
                                        ) : (
                                            <div className="bubble-partner-placeholder">
                                                <FiUser size={16} color="white" strokeWidth={2} />
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* ===== バブル本体 + リボン装飾 ===== */}
                            <div className="chat-bubble-wrap">

                                {/* バブル本体 */}
                                {/* bubbleClass（myGender から決まるCSSクラス）で色・形が切り替わる */}
                                <div className={`chat-bubble ${bubbleClass}`}>
                                    {/* \n を改行として表示するために split("\n") して <br /> を挿入する */}
                                    {msg.text.split("\n").map((line, j) => (
                                        <span key={j}>
                                            {line}
                                            {/* 最後の行以外の末尾に改行を入れる */}
                                            {j < msg.text.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>

                                {/* ===== リボン装飾 ===== */}
                                {/* ribbonImage がある → img で表示 */}
                                {/* null → ribbonEmoji（絵文字）で表示 */}
                                {ribbonImage ? (
                                    <img
                                        src={ribbonImage}
                                        alt=""
                                        className={`bubble-ribbon ${isPartner ? "ribbon-partner" : "ribbon-me"}`}
                                    />
                                ) : (
                                    <div className={`bubble-ribbon-placeholder ${isPartner ? "ribbon-partner" : "ribbon-me"}`}>
                                        {ribbonEmoji}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/*
                    ===== 下部装飾画像 =====
                    <img
                        src={myGender === "boyfriend" ? "/deco/bottom-blue.png" : "/deco/bottom-pink.png"}
                        alt=""
                        className="chat-deco-bottom"
                    />
                */}

                {/* 最新メッセージへの自動スクロール用マーカー */}
                <div ref={bottomRef} />
            </div>

            {/* ===== 入力バー ===== */}
            {/* chat.css の .chat-input-bar で position: fixed → 画面下部に固定される */}
            <div className="chat-input-bar">
                <input
                    className="chat-input"
                    type="text"
                    placeholder="メッセージを入力"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                {/* 送信ボタン: react-icons の FiSend を使用 */}
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    aria-label="送信"
                >
                    <FiSend size={18} color="white" strokeWidth={2} />
                </button>
            </div>

            {/* ===== タブバー ===== */}
            <TabBar />
        </div>
    );
}

export default Chat;