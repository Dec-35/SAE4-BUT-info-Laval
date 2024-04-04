import express from "express";
const router = express.Router();
import { pool } from "../../server.js";

router.post("", async (req, res) => {
  const { ironprice, goldprice, diamantprice } = req.body;

  if (!req.session.isLoggedIn || req.session.category !== "admin") {
    res.status(403).json({ error: "Accès refusé" });
    return;
  }

  if (ironprice >= 0) {
    await pool.query(
      "UPDATE grade SET price = ? WHERE name = ?",
      [ironprice, "iron"],
      (err) => {
        if (err) {
          console.error("Impossible de changer le prix :", err);
          res
            .status(500)
            .json({ error: "Impossible de changer le prix de iron" });
          return;
        }
      }
    );
  } else {
    res.status(500).json({ error: "Prix du grade iron négatif" });
    return;
  }

  if (goldprice >= 0) {
    await pool.query(
      "UPDATE grade SET price = ? WHERE name = ?",
      [goldprice, "gold"],
      (err) => {
        if (err) {
          console.error("Impossible de changer le prix :", err);
          res
            .status(500)
            .json({ error: "Impossible de changer le prix de gold" });
          return;
        }
      }
    );
  } else {
    res.status(500).json({ error: "Prix du grade gold négatif" });
    return;
  }

  if (diamantprice >= 0) {
    await pool.query(
      "UPDATE grade SET price = ? WHERE name = ?",
      [diamantprice, "diamant"],
      (err) => {
        if (err) {
          console.error("Impossible de changer le prix :", err);
          res
            .status(500)
            .json({ error: "Impossible de changer le prix de diamant" });
          return;
        }
      }
    );
  } else {
    res.status(500).json({ error: "Prix du grade diamant négatif" });
    return;
  }

  res.status(200).json({ success: true });
});

export default router;
