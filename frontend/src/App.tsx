import { useEffect, useState } from "react";
import axios from "axios";


export default function App() {
const [cards, setCards] = useState<any[]>([]);


useEffect(() => {
axios.get("/dashboard/cards", {
headers: { Authorization: `Bearer ${localStorage.token}` }
}).then(res => setCards(res.data));
}, []);


return (
    <div className="grid">
        {cards.map(card => (
            <DashboardCard key={card.id} card={card} />
        ))}
    </div>
);
}