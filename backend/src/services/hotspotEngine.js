const Report = require('../models/Report');
const Hotspot = require('../models/Hotspot');

const LOOKBACK_HOURS = Number.parseInt(process.env.HOTSPOT_LOOKBACK_HOURS || '', 10) || 72;
const MIN_REPORTS_PER_HOTSPOT = 2;
const MIN_RADIUS_METERS = 300;
const MAX_RADIUS_METERS = 500;
const DEFAULT_RADIUS_METERS = 400;

let refreshQueue = Promise.resolve();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getConfiguredRadius() {
  const configured = Number.parseInt(process.env.HOTSPOT_RADIUS_METERS || '', 10);
  if (Number.isFinite(configured)) {
    return clamp(configured, MIN_RADIUS_METERS, MAX_RADIUS_METERS);
  }

  return DEFAULT_RADIUS_METERS;
}

function getDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function normalizeSeverity(severity) {
  const value = String(severity || '').toLowerCase();
  if (value === 'critical') return 'Critical';
  if (value === 'high') return 'High';
  if (value === 'moderate') return 'Medium';
  return 'Low';
}

function severityRank(severity) {
  switch (normalizeSeverity(severity)) {
    case 'Critical':
      return 4;
    case 'High':
      return 3;
    case 'Medium':
      return 2;
    default:
      return 1;
  }
}

function riskFromAqi(averageAQI) {
  if (averageAQI >= 201) return 'Critical';
  if (averageAQI >= 151) return 'High';
  if (averageAQI >= 101) return 'Medium';
  return 'Low';
}

function getRiskLevel(highestSeverity, averageAQI) {
  const levels = [riskFromAqi(averageAQI), normalizeSeverity(highestSeverity)];
  return levels.sort((a, b) => severityRank(a) - severityRank(b)).pop();
}

function getRecommendedAction(dominantPollution, highestSeverity, averageAQI) {
  const pollution = String(dominantPollution || '').toLowerCase();
  const severity = normalizeSeverity(highestSeverity);

  if (pollution.includes('garbage') || pollution.includes('waste') || pollution.includes('burning')) {
    return severity === 'Critical' || averageAQI >= 180
      ? 'Deploy Fire & Cleanup Team'
      : 'Dispatch Cleanup Crews';
  }

  if (pollution.includes('construction') || pollution.includes('dust')) {
    return 'Deploy Water Mist Cannon';
  }

  if (pollution.includes('industrial') || pollution.includes('factory')) {
    return severity === 'Critical'
      ? 'Escalate Industrial Pollution Inspection'
      : 'Send Pollution Control Inspection';
  }

  if (pollution.includes('vehicle') || pollution.includes('traffic') || pollution.includes('exhaust')) {
    return 'Trigger Traffic Diversion and Emission Check';
  }

  if (pollution.includes('water')) {
    return 'Dispatch Water Quality Inspection';
  }

  return severity === 'Critical'
    ? 'Dispatch Emergency Response Team'
    : 'Dispatch General Inspection Team';
}

function isValidReport(report) {
  return (
    Number.isFinite(report.latitude) &&
    Number.isFinite(report.longitude) &&
    report.latitude !== 0 &&
    report.longitude !== 0
  );
}

function getMostCommonLocation(cluster) {
  const counts = {};
  cluster.forEach((report) => {
    const loc = (report.location || '').trim();
    if (loc) {
      counts[loc] = (counts[loc] || 0) + 1;
    }
  });
  let mostCommon = '';
  let maxCount = 0;
  Object.entries(counts).forEach(([loc, count]) => {
    if (count > maxCount) {
      mostCommon = loc;
      maxCount = count;
    }
  });
  return mostCommon;
}

function calculateHotspot(cluster, configuredRadius) {
  const reportCount = cluster.length;
  const sums = cluster.reduce(
    (accumulator, report) => {
      accumulator.latitude += report.latitude;
      accumulator.longitude += report.longitude;
      accumulator.aqi += Number(report.AQI) || 0;
      accumulator.confidence += Number(report.confidence) || 0;

      const category = String(report.category || 'Unknown').trim() || 'Unknown';
      accumulator.categoryCounts[category] = (accumulator.categoryCounts[category] || 0) + 1;

      if (severityRank(report.severity) > accumulator.highestSeverityRank) {
        accumulator.highestSeverityRank = severityRank(report.severity);
        accumulator.highestSeverity = normalizeSeverity(report.severity);
      }

      return accumulator;
    },
    {
      latitude: 0,
      longitude: 0,
      aqi: 0,
      confidence: 0,
      categoryCounts: {},
      highestSeverityRank: 0,
      highestSeverity: 'Low',
    }
  );

  const centerLat = sums.latitude / reportCount;
  const centerLng = sums.longitude / reportCount;
  const furthestDistance = cluster.reduce((maxDistance, report) => {
    const distance = getDistance(centerLat, centerLng, report.latitude, report.longitude);
    return Math.max(maxDistance, distance);
  }, 0);

  const dominantPollution = Object.entries(sums.categoryCounts).reduce(
    (currentDominant, [category, count]) => {
      if (!currentDominant || count > currentDominant.count) {
        return { category, count };
      }

      return currentDominant;
    },
    null
  );

  const averageAQI = Math.round(sums.aqi / reportCount);
  const averageConfidence = Math.round(sums.confidence / reportCount);
  const risk = getRiskLevel(sums.highestSeverity, averageAQI);
  const radius = clamp(
    Math.round(Math.max(furthestDistance + 60, configuredRadius * 0.75)),
    MIN_RADIUS_METERS,
    MAX_RADIUS_METERS
  );

  const clusterLocation = getMostCommonLocation(cluster);

  return {
    centerLat,
    centerLng,
    radius,
    reportCount,
    averageAQI,
    averageConfidence,
    dominantPollution: dominantPollution?.category || 'Unknown',
    highestSeverity: sums.highestSeverity,
    recommendedAction: getRecommendedAction(dominantPollution?.category, sums.highestSeverity, averageAQI),
    risk,
    status: 'Active',
    location: clusterLocation,
    createdAt: new Date(),
    sourceReportIds: cluster.map((report) => report._id),
    sourceReportData: cluster.map((report) => ({
      _id: report._id,
      image: report.image || '',
      category: report.category,
      severity: report.severity,
      description: report.description || '',
    })),
  };
}

async function rebuildHotspots() {
  const lookbackStart = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const configuredRadius = getConfiguredRadius();

  console.log('\n========== HOTSPOT ENGINE DEBUG ==========');
  console.log(`LOOKBACK_HOURS: ${LOOKBACK_HOURS}`);
  console.log(`RADIUS: ${configuredRadius}m`);
  console.log(`MIN_REPORTS_PER_HOTSPOT: ${MIN_REPORTS_PER_HOTSPOT}`);
  console.log(`Lookback window: ${lookbackStart.toISOString()} to now`);

  const totalInDb = await Report.countDocuments({});
  console.log(`\n[STAGE 0] Total reports in MongoDB: ${totalInDb}`);

  const reports = await Report.find({
    createdAt: { $gte: lookbackStart },
    latitude: { $exists: true },
    longitude: { $exists: true },
  }).select('_id latitude longitude category severity AQI confidence createdAt location image');

  console.log(`[STAGE 1] Reports after time+coords-exist filter: ${reports.length}`);
  if (reports.length < totalInDb) {
    console.log(`  → Excluded: ${totalInDb - reports.length} reports (outside lookback window or missing coords)`);
    const timestamps = reports.map(r => r.createdAt).filter(Boolean);
    if (timestamps.length > 0) {
      const oldestKept = new Date(Math.min(...timestamps));
      const newestKept = new Date(Math.max(...timestamps));
      console.log(`  → Time range of kept reports: ${oldestKept.toISOString()} to ${newestKept.toISOString()}`);
    }
  }

  const invalidCoordsCount = reports.length - reports.filter(isValidReport).length;
  const validReports = reports.filter(isValidReport);
  console.log(`[STAGE 2] Reports after isValidReport filter: ${validReports.length}`);
  if (invalidCoordsCount > 0) {
    console.log(`  → Excluded: ${invalidCoordsCount} reports (lat/lng is 0 or non-finite)`);
    reports.filter(r => !isValidReport(r)).forEach(r => {
      console.log(`  → Invalid report ${r._id}: lat=${r.latitude}, lng=${r.longitude}`);
    });
  }

  if (validReports.length === 0) {
    console.log('No valid reports. Skipping hotspot generation.\n');
    await Hotspot.deleteMany({});
    return [];
  }

  const buildResult = buildClustersWithDebug(validReports, configuredRadius);

  console.log(`\n[STAGE 4] Hotspots formed: ${buildResult.clusters.length}`);
  buildResult.clusters.forEach((cluster, i) => {
    console.log(`  Hotspot #${i + 1}: ${cluster.length} reports, center approx (${cluster[0].latitude.toFixed(4)}, ${cluster[0].longitude.toFixed(4)})`);
  });
  console.log(`\n[SUMMARY]`);
  console.log(`  Total reports in MongoDB:     ${totalInDb}`);
  console.log(`  Within time window:           ${reports.length}`);
  console.log(`  Valid coords:                 ${validReports.length}`);
  console.log(`  Clustered (in hotspots):      ${buildResult.clusteredCount}`);
  console.log(`  Unclustered (isolated/small): ${buildResult.unclusteredCount}`);

  const hotspots = buildResult.clusters.map((cluster) => calculateHotspot(cluster, configuredRadius));

  await Hotspot.deleteMany({});

  if (hotspots.length > 0) {
    await Hotspot.insertMany(hotspots);
  }

  console.log('========== END HOTSPOT ENGINE DEBUG ==========\n');
  return hotspots;
}

function buildClustersWithDebug(reports, radiusMeters) {
  const clusters = [];
  const visited = new Set();
  const clusteredIndices = new Set();

  console.log(`\n[STAGE 3] Clustering ${reports.length} reports with radius=${radiusMeters}m`);

  for (let index = 0; index < reports.length; index += 1) {
    if (visited.has(index)) {
      continue;
    }

    const stack = [index];
    const clusterIndices = [];
    visited.add(index);

    while (stack.length > 0) {
      const currentIndex = stack.pop();
      const currentReport = reports[currentIndex];
      clusterIndices.push(currentIndex);

      for (let neighborIndex = 0; neighborIndex < reports.length; neighborIndex += 1) {
        if (visited.has(neighborIndex)) {
          continue;
        }

        const neighbor = reports[neighborIndex];
        const distance = getDistance(
          currentReport.latitude,
          currentReport.longitude,
          neighbor.latitude,
          neighbor.longitude
        );

        if (distance <= radiusMeters) {
          visited.add(neighborIndex);
          stack.push(neighborIndex);
        }
      }
    }

    const clusterReports = clusterIndices.map(i => reports[i]);
    const clusterNum = clusters.length + 1;

    if (clusterIndices.length >= MIN_REPORTS_PER_HOTSPOT) {
      clusterIndices.forEach(i => clusteredIndices.add(i));
      clusters.push(clusterReports);
      console.log(`  Cluster #${clusterNum}: ${clusterIndices.length} reports → ACCEPTED as hotspot`);
      clusterReports.forEach(r => {
        console.log(`    Report ${r._id}: lat=${r.latitude}, lng=${r.longitude}, time=${r.createdAt?.toISOString?.() || r.createdAt}, cat=${r.category}`);
      });
    } else {
      console.log(`  Cluster #${clusterNum}: ${clusterIndices.length} reports → DISCARDED (< ${MIN_REPORTS_PER_HOTSPOT} reports)`);
      clusterReports.forEach(r => {
        console.log(`    Unclustered ${r._id}: lat=${r.latitude}, lng=${r.longitude}, time=${r.createdAt?.toISOString?.() || r.createdAt}, cat=${r.category}`);
      });
    }
  }

  const unclusteredIndices = [];
  for (let i = 0; i < reports.length; i++) {
    if (!clusteredIndices.has(i)) {
      unclusteredIndices.push(i);
    }
  }

  return {
    clusters,
    clusteredCount: clusteredIndices.size,
    unclusteredCount: unclusteredIndices.length,
  };
}

function queueHotspotRefresh() {
  refreshQueue = refreshQueue.catch(() => undefined).then(() => rebuildHotspots());
  return refreshQueue;
}

exports.generateHotspots = queueHotspotRefresh;
exports.rebuildHotspots = queueHotspotRefresh;
