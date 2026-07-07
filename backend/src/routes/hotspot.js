const express = require('express');
const router = express.Router();
const hotspotController = require('../controllers/hotspotController');
const protect = require('../middleware/auth');
const { officerOrAdmin, adminOnly } = require('../middleware/rbac');

router.get('/', protect, hotspotController.getHotspots);
router.patch('/:id/status', protect, officerOrAdmin, hotspotController.updateHotspotStatus);
router.put('/:id', protect, officerOrAdmin, hotspotController.updateHotspot);
router.delete('/:id', protect, adminOnly, hotspotController.deleteHotspot);

module.exports = router;
