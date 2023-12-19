const express = require('express');
const authRoutes = require('./authRoutes');
const messageRoutes = require('./messageRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/', messageRoutes);

module.exports = router;
