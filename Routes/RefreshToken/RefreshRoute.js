const express = require('express');
const { refreshAccessToken } = require('../../Controllers/RefreshToken/Refresh');

const router = express.Router();

router.post('/refresh-token', refreshAccessToken);

module.exports = router;
