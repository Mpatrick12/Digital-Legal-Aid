import express from 'express'
import LegalContent from '../models/LegalContent.js'
import GazetteDocument from '../models/GazetteDocument.js'
import SearchLog from '../models/SearchLog.js'
import User from '../models/User.js'
import { authenticate } from '../middleware/auth.js'
import { catchAsync } from '../middleware/errorHandler.js'
import logger from '../config/logger.js'

const router = express.Router()

// Get comprehensive system statistics
router.get('/stats', authenticate, catchAsync(async (req, res) => {
  logger.info('Analytics stats requested', { userId: req.userId })

  const [
    totalSearches,
    totalUsers,
    totalGazetteDocuments,
    totalLegalContent,
    topSearches,
    recentSearches,
    popularContent,
    popularGazettes,
    gazetteStats,
    searchTrends
  ] = await Promise.all([
    // Total searches
    SearchLog.countDocuments(),
    
    // Total users
    User.countDocuments(),
    
    // Total gazette documents
    GazetteDocument.countDocuments(),
    
    // Total legal content items
    LegalContent.countDocuments(),
    
    // Top 10 searches
    SearchLog.aggregate([
      { $group: { _id: '$query', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Recent searches (last 50)
    SearchLog.find()
      .select('query resultsCount language createdAt')
      .sort('-createdAt')
      .limit(50),
    
    // Most viewed legal content
    LegalContent.find()
      .select('crimeType articleNumber viewCount')
      .sort('-viewCount')
      .limit(10),
    
    // Most downloaded gazettes
    GazetteDocument.find()
      .select('title documentNumber downloadCount searchCount')
      .sort('-downloadCount')
      .limit(10),
    
    // Gazette statistics by category
    GazetteDocument.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalSearches: { $sum: '$searchCount' }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // Search trends (last 30 days)
    SearchLog.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ])

  res.json({
    status: 'success',
    data: {
      overview: {
        totalSearches,
        totalUsers,
        totalGazetteDocuments,
        totalLegalContent
      },
      topSearches: topSearches.map(s => ({
        query: s._id,
        count: s.count
      })),
      recentSearches: recentSearches.map(s => ({
        query: s.query,
        resultsCount: s.resultsCount,
        language: s.language,
        timestamp: s.createdAt
      })),
      popularContent: popularContent.map(c => ({
        crimeType: c.crimeType,
        articleNumber: c.articleNumber,
        viewCount: c.viewCount
      })),
      popularGazettes: popularGazettes.map(g => ({
        title: g.title,
        documentNumber: g.documentNumber,
        downloadCount: g.downloadCount,
        searchCount: g.searchCount
      })),
      gazettesByCategory: gazetteStats.map(s => ({
        category: s._id,
        count: s.count,
        totalDownloads: s.totalDownloads,
        totalSearches: s.totalSearches
      })),
      searchTrends: searchTrends.map(t => ({
        date: t._id,
        searches: t.count
      }))
    }
  })
}))

// Get search analytics
router.get('/searches', authenticate, catchAsync(async (req, res) => {
  const { period = '7d', limit = 100 } = req.query
  
  // Calculate date range
  const periodMap = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90
  }
  
  const days = periodMap[period] || 7
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const [searches, topQueries, languageBreakdown] = await Promise.all([
    SearchLog.find({ createdAt: { $gte: startDate } })
      .select('query resultsCount language createdAt ipAddress')
      .sort('-createdAt')
      .limit(parseInt(limit)),
    
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$query', count: { $sum: 1 }, avgResults: { $avg: '$resultsCount' } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]),
    
    SearchLog.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ])
  ])
  
  res.json({
    status: 'success',
    data: {
      period: `Last ${days} days`,
      totalSearches: searches.length,
      searches,
      topQueries: topQueries.map(q => ({
        query: q._id,
        count: q.count,
        avgResults: Math.round(q.avgResults)
      })),
      languageBreakdown: languageBreakdown.map(l => ({
        language: l._id,
        count: l.count
      }))
    }
  })
}))

// Get gazette analytics
router.get('/gazettes', authenticate, catchAsync(async (req, res) => {
  const [
    totalDocuments,
    totalDownloads,
    categoriesBreakdown,
    recentUploads,
    mostActive
  ] = await Promise.all([
    GazetteDocument.countDocuments(),
    
    GazetteDocument.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]),
    
    GazetteDocument.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$fileSize' },
          totalPages: { $sum: '$pageCount' }
        }
      }
    ]),
    
    GazetteDocument.find()
      .select('title documentNumber publicationDate category createdAt')
      .sort('-createdAt')
      .limit(10),
    
    GazetteDocument.find()
      .select('title documentNumber downloadCount searchCount')
      .sort('-downloadCount -searchCount')
      .limit(15)
  ])
  
  res.json({
    status: 'success',
    data: {
      overview: {
        totalDocuments,
        totalDownloads: totalDownloads[0]?.total || 0
      },
      categoriesBreakdown: categoriesBreakdown.map(c => ({
        category: c._id,
        count: c.count,
        totalSizeMB: Math.round(c.totalSize / (1024 * 1024) * 100) / 100,
        totalPages: c.totalPages
      })),
      recentUploads: recentUploads.map(g => ({
        title: g.title,
        documentNumber: g.documentNumber,
        publicationDate: g.publicationDate,
        category: g.category,
        uploadedAt: g.createdAt
      })),
      mostActive: mostActive.map(g => ({
        title: g.title,
        documentNumber: g.documentNumber,
        downloadCount: g.downloadCount,
        searchCount: g.searchCount,
        totalActivity: g.downloadCount + g.searchCount
      }))
    }
  })
}))

// Get user activity analytics
router.get('/users', authenticate, catchAsync(async (req, res) => {
  const [
    totalUsers,
    districtBreakdown,
    recentSignups
  ] = await Promise.all([
    User.countDocuments(),
    
    User.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    
    User.find()
      .select('name email district createdAt')
      .sort('-createdAt')
      .limit(20)
  ])
  
  res.json({
    status: 'success',
    data: {
      totalUsers,
      districtBreakdown: districtBreakdown.map(d => ({
        district: d._id,
        count: d.count
      })),
      recentSignups: recentSignups.map(u => ({
        name: u.name,
        email: u.email,
        district: u.district,
        joinedAt: u.createdAt
      }))
    }
  })
}))

export default router
