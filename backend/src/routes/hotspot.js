const express = require('express');
const router = express.Router();
const hotspotController = require('../controllers/hotspotController');
const protect = require('../middleware/auth');
const { officerOnly, authorize } = require('../middleware/rbac');

router.get('/', protect, hotspotController.getHotspots);
router.patch('/:id/status', protect, officerOnly, hotspotController.updateHotspotStatus);
router.put('/:id', protect, officerOnly, hotspotController.updateHotspot);
router.delete('/:id', protect, authorize('officer'), hotspotController.deleteHotspot);

module.exports = router;
