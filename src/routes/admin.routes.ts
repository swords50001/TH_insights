import { Router } from "express";
import { pool } from "../db";
import { auth, requireAdmin } from "../middleware";

const router = Router();
router.use(auth, requireAdmin);

router.get("/cards", async (_, res) => {
const { rows } = await pool.query("SELECT * FROM dashboard_cards");
res.json(rows);
});

router.post("/cards", async (req, res) => {
const { title, description, sql_query, visualization_type } = req.body;
const { rows } = await pool.query(
`INSERT INTO dashboard_cards (title, description, sql_query, visualization_type)
VALUES ($1,$2,$3,$4) RETURNING *`,
[title, description, sql_query, visualization_type]
);
res.json(rows[0]);
});

export default router;
