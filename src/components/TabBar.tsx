import { useNavigate, useLocation } from "react-router-dom";
import {
    HiOutlineHome,
    HiOutlinePhoto,
    HiOutlineCalendarDays,
    HiOutlineClipboardDocumentList,
    HiChatBubbleOvalLeft,
} from "react-icons/hi2";
import "./tabbar.css";

// ===== タブ定義 =====
// isCenter=true のタブだけ中央の浮いたボタンとして描画される
const tabs = [
    {
        path: "/home",
        label: "ホーム",
        Icon: HiOutlineHome,
    },
    {
        path: "/example",
        label: "画像",
        Icon: HiOutlinePhoto,
    },
    {
        path: "/chat",
        label: "",
        // 中央ボタン用アイコン（白塗り・ピンク背景）
        Icon: HiChatBubbleOvalLeft,
        isCenter: true,
    },
    {
        path: "/account",
        label: "カレンダー",
        Icon: HiOutlineCalendarDays,
    },
    {
        path: "/example",
        label: "メモ",
        Icon: HiOutlineClipboardDocumentList,
    },
];

function TabBar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="tabbar-wrapper">
            <div className="tabbar">
                {tabs.map((tab) => {
                    const active = location.pathname === tab.path;

                    // ===== 中央チャットボタン =====
                    if (tab.isCenter) {
                        return (
                            <button
                                key="center"
                                className="tabbar-center-btn"
                                onClick={() => navigate(tab.path)}
                                aria-label="チャット"
                            >
                                <tab.Icon size={28} color="white" />
                            </button>
                        );
                    }

                    // ===== 通常タブ =====
                    return (
                        <button
                            key={`${tab.path}-${tab.label}`}
                            className={`tabbar-item ${active ? "active" : ""}`}
                            onClick={() => navigate(tab.path)}
                        >
                            <tab.Icon size={24} />
                            {tab.label && <span className="tabbar-label">{tab.label}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default TabBar;