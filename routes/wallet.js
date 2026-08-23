const express = require('express');
const router = express.Router();

router.get('/balance', (req, res) => res.json({ balance: 0 }));

module.exports = router;
