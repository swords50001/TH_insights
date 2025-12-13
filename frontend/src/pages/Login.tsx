import { useState } from "react";
import { api } from "../api";


export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");


const login = async () => {
const res = await api.post("/auth/login", { email, password });
localStorage.setItem("token", res.data.token);
location.href = "/";
};


return (
<div>
<input onChange={e => setEmail(e.target.value)} />
<input type="password" onChange={e => setPassword(e.target.value)} />
<button onClick={login}>Login</button>
</div>
);
}
