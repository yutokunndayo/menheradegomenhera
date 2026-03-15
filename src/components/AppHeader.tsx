import { FiUser } from "react-icons/fi";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import "./Appheader.css";

// ===== 型定義 =====

interface ChatVariant {
    variant: "chat";
    name: string;           // パートナーの名前
    icon?: string | null;   // パートナーのアイコンURL（nullならプレースホルダー）
    onBack?: () => void;    // 戻るボタン（省略可）
}

interface CalendarVariant {
    variant: "calendar";
    title: string;          // 表示する月（例: "2026年3月"）
    onPrev: () => void;     // 前の月ボタン
    onNext: () => void;     // 次の月ボタン
}

interface SimpleVariant {
    variant: "simple";
    title: string;          // 画面タイトル（例: "一言日記"）
}

type AppHeaderProps = ChatVariant | CalendarVariant | SimpleVariant;

// ===== スカラップSVG =====
// 白背景にピンクの円を上半分はみ出す形で並べる
// → 円の下半分だけ見えてもこもこした波になる
function ScallopSVG() {
    const R = 22;          // 円の半径
    const STEP = 44;       // 円の間隔
    const COUNT = 12;      // 円の個数

    return (
        <svg
            className="appheader-scallop"
            viewBox={`0 0 ${STEP * COUNT} ${R}`}
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* 白い背景 */}
            <rect x="0" y="0" width={STEP * COUNT} height={R} fill="white" />
            {/* ピンクの円を上半分はみ出す形で並べる（cy=0 にすることで下半分だけ見える） */}
            {Array.from({ length: COUNT }).map((_, i) => (
                <circle key={i} cx={i * STEP + STEP / 2} cy={0} r={R} fill="#f5317f" />
            ))}
        </svg>
    );
}

// ===== メインコンポーネント =====
function AppHeader(props: AppHeaderProps) {

    // ===== チャットヘッダー =====
    if (props.variant === "chat") {
        return (
            <>
                <div className="appheader appheader--chat">
                    {/* 戻るボタン（onBack が渡された場合のみ表示） */}
                    {props.onBack && (
                        <button
                            className="appheader-back"
                            onClick={props.onBack}
                            aria-label="戻る"
                        >
                            <HiChevronLeft size={24} color="white" />
                        </button>
                    )}

                    {/* パートナーのアイコン */}
                    <div className="appheader-icon">
                        {props.icon ? (
                            <img
                                src={props.icon}
                                alt={props.name}
                                className="appheader-icon-img"
                            />
                        ) : (
                            // アイコン未設定時のプレースホルダー
                            // Home.tsx でアイコンURLが設定されたら props.icon に渡すだけで切り替わる
                            <div className="appheader-icon-placeholder">
                                <FiUser size={20} color="white" strokeWidth={1.8} />
                            </div>
                        )}
                    </div>

                    {/* パートナーの名前 */}
                    <p className="appheader-title">{props.name}</p>
                </div>

                <ScallopSVG />
            </>
        );
    }

    // ===== カレンダーヘッダー =====
    if (props.variant === "calendar") {
        return (
            <>
                <div className="appheader appheader--calendar">
                    <button
                        className="appheader-nav-btn"
                        onClick={props.onPrev}
                        aria-label="前の月"
                    >
                        <HiChevronLeft size={22} color="white" />
                    </button>

                    <p className="appheader-title">{props.title}</p>

                    <button
                        className="appheader-nav-btn"
                        onClick={props.onNext}
                        aria-label="次の月"
                    >
                        <HiChevronRight size={22} color="white" />
                    </button>
                </div>

                <ScallopSVG />
            </>
        );
    }

    // ===== シンプルヘッダー（一言日記など） =====
    return (
        <>
            <div className="appheader appheader--simple">
            </div>

            <ScallopSVG />
        </>
    );
}

export default AppHeader;