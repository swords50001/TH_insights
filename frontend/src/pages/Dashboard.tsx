import { useEffect, useState } from "react";
import { api } from "../api";

export default function Dashboard() {
const [cards, setCards] = useState<any[]>([]);

useEffect(() => {
api.get("/dashboard/cards").then(r => setCards(r.data));
}, []);


return (
  <div>
    {cards.map(c => (
  <div key={c.id}>
  <h3>{c.title}</h3>
  </div>
))}
</div>
);
}
