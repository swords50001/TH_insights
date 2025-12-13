import { Router } from "express";
import { pool } from "../db";
import { auth } from "../middleware";


const router = Router();


router.get("/cards", auth, async (req: any, res) => {
const { rows } = await pool.query(
`SELECT * FROM dashboard_cards WHERE is_active=true`
);
res.json(rows);
});


router.post("/cards/:id/data", auth, async (req, res) => {
const { rows } = await pool.query(
"SELECT sql_query FROM dashboard_cards WHERE id=$1",
[req.params.id]
);
const data = await pool.query(rows[0].sql_query);
res.json(data.rows);
});


export default router;
