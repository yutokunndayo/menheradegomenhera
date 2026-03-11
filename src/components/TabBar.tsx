import { useNavigate, useLocation } from "react-router-dom";
import "./tabbar.css";

const tabs = [
    {
        path: "/home",
        label: "ホーム",
        icon: (active: boolean) => (
            <svg viewBox="0 0 24 24" fill={active ? "none" : "none"} xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <path
                    d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                />
            </svg>
        ),
    },
    {
        path: "/example",
        label: "画像",
        icon: (active: boolean) => (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <rect
                    x="3" y="3" width="18" height="18" rx="3"
                    stroke="currentColor" strokeWidth="1.8"
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <path d="M3 16L8 11L12 15L16 11L21 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        path: "/chat",
        label: "",
        icon: (_active: boolean) => (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="28" height="28">
                <path
                    d="M12 3C7.03 3 3 6.58 3 11C3 13.07 3.93 14.96 5.46 16.36L4 21L9.14 19.23C10.03 19.49 10.99 19.63 12 19.63C16.97 19.63 21 16.05 21 11.63C21 7.2 16.97 3 12 3Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="1.5"
                />
                <circle cx="8.5" cy="11" r="1.2" fill="#f5317f" />
                <circle cx="12" cy="11" r="1.2" fill="#f5317f" />
                <circle cx="15.5" cy="11" r="1.2" fill="#f5317f" />
            </svg>
        ),
        isCenter: true,
    },
    {
        path: "/account",
        label: "カレンダー",
        icon: (active: boolean) => (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <rect
                    x="3" y="4" width="18" height="18" rx="2"
                    stroke="currentColor" strokeWidth="1.8"
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                />
                <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
                <rect x="14" y="13" width="3" height="3" rx="0.5" fill="currentColor" />
            </svg>
        ),
    },
    {
        path: "/example",
        label: "メモ",
        icon: (active: boolean) => (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
                <rect
                    x="4" y="2" width="16" height="20" rx="2"
                    stroke="currentColor" strokeWidth="1.8"
                    fill={active ? "currentColor" : "none"}
                    fillOpacity={active ? 0.15 : 0}
                />
                <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
    },
];

function TabBar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="tabbar-wrapper">
            {/* 中央ボタンの半円くぼみ */}
            <div className="tabbar-notch" />
            <div className="tabbar">
                {tabs.map((tab) => {
                    const active = location.pathname === tab.path;

                    if (tab.isCenter) {
                        return (
                            <button
                                key={tab.path}
                                className="tabbar-center-btn"
                                onClick={() => navigate(tab.path)}
                                aria-label="チャット"
                            >
                                {tab.icon(active)}
                            </button>
                        );
                    }

                    return (
                        <button
                            key={`${tab.path}-${tab.label}`}
                            className={`tabbar-item ${active ? "active" : ""}`}
                            onClick={() => navigate(tab.path)}
                        >
                            {tab.icon(active)}
                            {tab.label && <span className="tabbar-label">{tab.label}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default TabBar;