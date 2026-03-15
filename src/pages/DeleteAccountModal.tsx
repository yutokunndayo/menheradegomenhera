import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";

import HomePageHeader from "../components/HomePageHeader";
import TabBar from "../components/TabBar";

import "../styles/DeleteAccountModal.css";

export default function DeleteAccountModal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (loading) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("delete-account");

      if (error) {
        console.error("delete-account error:", error);
        alert("削除に失敗しました");
        return;
      }

      console.log("delete-account success:", data);

      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) {
        console.warn("local signOut failed:", signOutError);
      }

      navigate("/login");
    } catch (e) {
      console.error("handleDeleteAccount error:", e);
      alert("削除に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <HomePageHeader username="彼女ちゃん" />

      <div className="overlay"></div>

      <div className="modal">
        <h2 className="modal-title">
          アカウントの削除
        </h2>

        <p className="modal-text">
          アカウントを完全に削除してよろしいですか？
          <br />
          削除した場合、相手の端末内のデータも削除されます。
        </p>

        <div className="modal-buttons">
          <button
            className="cancel-button"
            onClick={() => navigate("/home")}
            disabled={loading}
          >
            キャンセル
          </button>

          <button
            className="ok-button"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? "削除中..." : "OK"}
          </button>
        </div>
      </div>

      <TabBar />
    </div>
  );
}