import { supabase } from "../lib/supabase";


function Login() {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // ここが Supabase Dashboard の Redirect URLs に許可されている必要あり
        redirectTo: `${window.location.origin}/authCallback`,
      },
    });
    if (error) alert(error.message);
  };

  return (
    
          <button className="rounded-xl px-3 py-2 m-auto text-xl font-medium text-gray-700 hover:bg-gray-100 active:scale-75 hover:shadow-sm transition" onClick={signInWithGoogle}>
            Googleでログイン
          </button>
   
  );
}

export default Login;