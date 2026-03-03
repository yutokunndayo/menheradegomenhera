import { useNavigate } from "react-router-dom";
import React from "react";

// このpropsで引数を作ることが出来る
type HeaderProps = {
    backTo?: string;
}
// backToでStringを受け取れる引数を設定
const Header: React.FC<HeaderProps> = ({ backTo }) => {
    const navigate = useNavigate();
    //戻るだけの関数
    const handleBack = () => {
        if (backTo) {
            navigate(backTo);
        } else {
            navigate(-1);
        }
    };
    return (
        //cssは適当についてただけ
        <div className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur border-b border-gray-200 rounded-2xl">
            <div className="px-3 sm:px-6 py-3 sm:py-4">
                <button
                    className="rounded-xl px-3 sm:px-4 py-2 text-base sm:text-xl md:text-2xl font-medium text-gray-700 hover:bg-gray-100 active:scale-95 hover:shadow-sm transition"
                    onClick={handleBack}
                >
                    ＜ 戻る
                </button>
            </div>
        </div>
    );
}
export default Header;