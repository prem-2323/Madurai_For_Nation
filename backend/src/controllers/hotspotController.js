const Hotspot = require('../models/Hotspot');
const Report = require('../models/Report');
const { generateHotspots } = require('../services/hotspotEngine');
const { successResponse, errorResponse } = require('../utils/response');

const MUNICIPAL_STATUSES = ['pending', 'under_review', 'team_assigned', 'in_progress', 'resolved'];

exports.getHotspots = async (req, res) => {
  try {
    await generateHotspots();
    const hotspots = await Hotspot.find({ status: 'Active' }).sort({ createdAt: -1 });
    successResponse(res, hotspots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.assignTeam = async (req, res) => {
  try {
    const { assignedTeam } = req.body;
    if (!assignedTeam || !assignedTeam.trim()) {
      return errorResponse(res, 'Team name is required', 400);
    }

    const now = new Date();
    const teamName = assignedTeam.trim();

    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      {
        assignedTeam: teamName,
        assignedOfficer: req.user._id,
        assignedOfficerName: req.user.name || 'Officer',
        municipalStatus: 'team_assigned',
        statusUpdatedAt: now,
        status: 'Active',
      },
      { new: true }
    );

    if (!hotspot) return errorResponse(res, 'Hotspot not found', 404);

    if (hotspot.sourceReportIds && hotspot.sourceReportIds.length > 0) {
      await Report.updateMany(
        { _id: { $in: hotspot.sourceReportIds } },
        {
          $set: {
            municipalStatus: 'team_assigned',
            assignedOfficer: req.user._id,
            assignedOfficerName: req.user.name || 'Officer',
            assignedTeam: teamName,
            statusUpdatedAt: now,
          },
          $push: {
            reviewHistory: {
              officer: req.user._id,
              action: 'municipalStatus',
              value: 'team_assigned',
              reviewedAt: now,
            },
          },
        }
      );
    }

    successResponse(res, hotspot, 'Team assigned successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateHotspotStatus = async (req, res) => {
  try {
    const { municipalStatus } = req.body;
    if (!MUNICIPAL_STATUSES.includes(municipalStatus)) {
      return errorResponse(res, `Invalid status. Must be one of: ${MUNICIPAL_STATUSES.join(', ')}`, 400);
    }

    const now = new Date();
    const updateFields = {
      municipalStatus,
      assignedOfficer: req.user._id,
      assignedOfficerName: req.user.name || 'Officer',
      statusUpdatedAt: now,
      status: municipalStatus === 'resolved' ? 'Resolved' : municipalStatus === 'in_progress' ? 'In Progress' : 'Active',
    };

    if (municipalStatus === 'resolved') {
      updateFields.resolvedAt = now;
    }

    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!hotspot) return errorResponse(res, 'Hotspot not found', 404);

    if (hotspot.sourceReportIds && hotspot.sourceReportIds.length > 0) {
      const reportUpdateFields = {
        municipalStatus,
        assignedOfficer: req.user._id,
        assignedOfficerName: req.user.name || 'Officer',
        statusUpdatedAt: now,
      };
      if (municipalStatus === 'resolved') {
        reportUpdateFields.resolvedAt = now;
      }
      await Report.updateMany(
        { _id: { $in: hotspot.sourceReportIds } },
        {
          $set: reportUpdateFields,
          $push: {
            reviewHistory: {
              officer: req.user._id,
              action: 'municipalStatus',
              value: municipalStatus,
              reviewedAt: now,
            },
          },
        }
      );
    }

    successResponse(res, hotspot, 'Hotspot status updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateReportMunicipalStatus = async (req, res) => {
  try {
    const { municipalStatus, assignedOfficerName, assignedTeam } = req.body;

    const now = new Date();
    const updateFields = {
      assignedOfficer: req.user._id,
      statusUpdatedAt: now,
    };

    if (municipalStatus) {
      if (!MUNICIPAL_STATUSES.includes(municipalStatus)) {
        return errorResponse(res, `Invalid status. Must be one of: ${MUNICIPAL_STATUSES.join(', ')}`, 400);
      }
      updateFields.municipalStatus = municipalStatus;
    }

    if (assignedOfficerName !== undefined) {
      updateFields.assignedOfficerName = assignedOfficerName;
    }

    if (assignedTeam !== undefined) {
      updateFields.assignedTeam = assignedTeam;
    }

    if (!updateFields.municipalStatus && !assignedOfficerName && !assignedTeam) {
      return errorResponse(res, 'At least one field (municipalStatus, assignedOfficerName, assignedTeam) is required', 400);
    }

    if (municipalStatus === 'resolved') {
      updateFields.resolvedAt = now;
    }

    const updateOperation = {
      $set: updateFields,
    };

    if (municipalStatus) {
      updateOperation.$push = {
        reviewHistory: {
          officer: req.user._id,
          action: 'municipalStatus',
          value: municipalStatus,
          reviewedAt: now,
        },
      };
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateOperation,
      { new: true }
    );

    if (!report) return errorResponse(res, 'Report not found', 404);

    successResponse(res, {
      _id: report._id,
      municipalStatus: report.municipalStatus,
      assignedOfficerName: report.assignedOfficerName,
      assignedTeam: report.assignedTeam,
      statusUpdatedAt: report.statusUpdatedAt,
      resolvedAt: report.resolvedAt,
    }, 'Report municipal status updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getCitizenReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('assignedOfficer', 'name')
      .sort({ createdAt: -1 });

    const publicReports = reports.map((report) => ({
      _id: report._id,
      category: report.category,
      description: report.description,
      severity: report.severity,
      location: report.location,
      latitude: report.latitude,
      longitude: report.longitude,
      AQI: report.AQI,
      aqiLevel: report.aqiLevel,
      image: report.image || '',
      confidence: report.confidence,
      healthRisk: report.healthRisk,
      recommendation: report.recommendation,
      createdAt: report.createdAt,
      municipalStatus: report.municipalStatus,
      assignedOfficerName: report.assignedOfficerName || (report.assignedOfficer?.name || ''),
      assignedTeam: report.assignedTeam || '',
      statusUpdatedAt: report.statusUpdatedAt,
      resolvedAt: report.resolvedAt,
      reviewHistory: (report.reviewHistory || [])
        .filter((entry) => entry.action === 'municipalStatus')
        .map((entry) => ({
          value: entry.value,
          reviewedAt: entry.reviewedAt,
        })),
    }));

    successResponse(res, publicReports);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
