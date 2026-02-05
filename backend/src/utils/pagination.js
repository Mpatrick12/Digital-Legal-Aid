export const paginate = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    select = '',
    populate = null
  } = options

  const pageNum = parseInt(page, 10)
  const limitNum = parseInt(limit, 10)
  const skip = (pageNum - 1) * limitNum

  // Execute query
  let queryBuilder = model.find(query)
    .limit(limitNum)
    .skip(skip)
    .sort(sort)

  if (select) {
    queryBuilder = queryBuilder.select(select)
  }

  if (populate) {
    queryBuilder = queryBuilder.populate(populate)
  }

  const [results, total] = await Promise.all([
    queryBuilder.exec(),
    model.countDocuments(query)
  ])

  const totalPages = Math.ceil(total / limitNum)

  return {
    results,
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      nextPage: pageNum < totalPages ? pageNum + 1 : null,
      prevPage: pageNum > 1 ? pageNum - 1 : null
    }
  }
}

// Helper function for paginated response formatting
export const paginatedResponse = (data, pagination, message = 'Success') => {
  return {
    status: 'success',
    message,
    count: data.length,
    pagination,
    data
  }
}
