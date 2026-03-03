import { supabaseAdmin, profileIdToUUID } from '@/lib/supabase'

const ALLOWED_PROFILES = ['profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5']

function getProfileId(req) {
  const header = req.headers['x-profile-id']
  if (header && ALLOWED_PROFILES.includes(header)) return profileIdToUUID(header)
  return null
}

function serializeAsset(row) {
  if (!row) return row

  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    currentValue: row.current_value === null ? null : Number(row.current_value),
    monthlyIncome: row.monthly_income === null ? null : Number(row.monthly_income),
    acquisitionDate: row.acquisition_date,
    acquisitionValue: row.acquisition_value === null ? null : Number(row.acquisition_value),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const VALID_TYPES = [
  'real_estate_rental',
  'business',
  'stocks_dividends',
  'investment_income',
  'intellectual_property',
  'other_income',
]

async function handler(req, res) {
  const supabase = supabaseAdmin
  const profileId = getProfileId(req)
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })
  if (!profileId) return res.status(400).json({ error: 'Perfil não informado ou inválido' })
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res, supabase, profileId)
    case 'PUT':
      return handlePut(req, res, supabase, profileId)
    case 'DELETE':
      return handleDelete(req, res, supabase, profileId)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}

async function handleGet(req, res, supabase, profileId) {
  try {
    const { id } = req.query

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (error || !asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    return res.status(200).json(serializeAsset(asset))
  } catch (error) {
    console.error('Error fetching asset:', error)
    return res.status(500).json({ error: 'Failed to fetch asset' })
  }
}

async function handlePut(req, res, supabase, profileId) {
  try {
    const { id } = req.query

    const { data: existing, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const { type, name, currentValue, monthlyIncome, acquisitionDate, acquisitionValue, notes } = req.body

    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
      })
    }

    const data = {}
    if (type !== undefined) data.type = type
    if (name !== undefined) data.name = name
    if (currentValue !== undefined) data.current_value = currentValue
    if (monthlyIncome !== undefined) data.monthly_income = monthlyIncome
    if (acquisitionDate !== undefined)
      data.acquisition_date = acquisitionDate ? new Date(acquisitionDate).toISOString() : null
    if (acquisitionValue !== undefined) data.acquisition_value = acquisitionValue
    if (notes !== undefined) data.notes = notes

    const { data: asset, error } = await supabase
      .from('assets')
      .update(data)
      .eq('id', id)
      .eq('user_id', profileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating asset:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json(serializeAsset(asset))
  } catch (error) {
    console.error('Error updating asset:', error)
    return res.status(500).json({ error: 'Failed to update asset' })
  }
}

async function handleDelete(req, res, supabase, profileId) {
  try {
    const { id } = req.query

    const { data: existing, error: fetchError } = await supabase
      .from('assets')
      .select('id')
      .eq('id', id)
      .eq('user_id', profileId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('user_id', profileId)

    if (error) {
      console.error('Error deleting asset:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return res.status(500).json({ error: 'Failed to delete asset' })
  }
}

export default handler
