import { useNavigate } from 'react-router-dom';


export default function HomePage() {
    const navigate = useNavigate();
    const ClickHandler = () => {
        navigate('/example');
    }
    // tailwindcssは適当につけてるから参考にしないで
    return (

        <div className="bg-red-500 text-white p-6 rounded-lg" onClick={ClickHandler}>
            ここをクリックしてExampleページに移動
        </div>
    )
}