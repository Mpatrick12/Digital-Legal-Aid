import express from 'express'
import Notary from '../models/Notary.js'
import { catchAsync } from '../middleware/errorHandler.js'

const router = express.Router()

// GET /api/notary?province=&district=&specialization=&q=
router.get('/', catchAsync(async (req, res) => {
  const { province, district, specialization, q } = req.query

  const filter = { active: true }

  if (province) filter.province = province
  if (district) filter.district = district
  if (specialization) filter.specializations = specialization

  let notaries
  if (q && q.trim().length > 1) {
    notaries = await Notary.find({
      ...filter,
      $text: { $search: q.trim() }
    }).sort({ name: 1 })
  } else {
    notaries = await Notary.find(filter).sort({ province: 1, district: 1, name: 1 })
  }

  // Return distinct province/district values for filter dropdowns
  const allActive = await Notary.find({ active: true }).select('province district specializations')
  const provinces = [...new Set(allActive.map(n => n.province))].sort()
  const districts = [...new Set(allActive.map(n => n.district))].sort()
  const specializations = [...new Set(allActive.flatMap(n => n.specializations))].sort()

  res.json({
    status: 'success',
    data: {
      notaries,
      total: notaries.length,
      filters: { provinces, districts, specializations }
    }
  })
}))

// GET /api/notary/:id
router.get('/:id', catchAsync(async (req, res) => {
  const notary = await Notary.findById(req.params.id)
  if (!notary) return res.status(404).json({ status: 'error', message: 'Not found' })
  res.json({ status: 'success', data: notary })
}))

export default router
