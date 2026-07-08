const express = require('express');
const router = express.Router();
const hotspotController = require('../controllers/hotspotController');
const protect = require('../middleware/auth');
const { officerOnly } = require('../middleware/rbac');

router.get('/', protect, hotspotController.getHotspots);

router.get('/citizen/my-reports', protect, hotspotController.getCitizenReports);

router.patch('/:id/status', protect, officerOnly, hotspotController.updateHotspotStatus);
router.patch('/:id/assign', protect, officerOnly, hotspotController.assignTeam);
router.patch('/report/:id/status', protect, officerOnly, hotspotController.updateReportMunicipalStatus);
// Delete removed — officer cannot delete hotspots

module.exports = router;
