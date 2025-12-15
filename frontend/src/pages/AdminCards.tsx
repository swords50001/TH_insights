import { useEffect, useState } from "react";
import axios from "axios";


export default function AdminCards() {
const [cards, setCards] = useState<any[]>([]);
const [form, setForm] = useState<any>({});


const headers = { Authorization: `Bearer ${localStorage.token}` };


const load = () =>
axios.get("/admin/cards", { headers }).then(r => setCards(r.data));


useEffect(load, []);


const save = () => {
axios.post("/admin/cards", form, { headers }).then(() => {
setForm({});
load();
});
};


return (
<div>
<h2>Dashboard Cards</h2>


<div className="admin-form">
<input placeholder="Title" onChange={e => setForm({ ...form, title: e.target.value })} />
<textarea placeholder="Description" onChange={e => setForm({ ...form, description: e.target.value })} />
<textarea placeholder="SQL Query" onChange={e => setForm({ ...form, sql_query: e.target.value })} />
<select onChange={e => setForm({ ...form, visualization_type: e.target.value })}>
<option value="metric">Metric</option>
<option value="table">Table</option>
</select>
<button onClick={save}>Add Card</button>
</div>


<table>
<thead>
<tr><th>Title</th><th>Type</th><th>Active</th></tr>
</thead>
<tbody>
{cards.map(c => (
<tr key={c.id}>
<td>{c.title}</td>
<td>{c.visualization_type}</td>
<td>{String(c.is_active)}</td>
</tr>
))}
</tbody>
</table>
</div>
);
}