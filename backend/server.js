// server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import { startListening, startAllListeners, getActiveListenersCount } from './eventListener.js'

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Add contract
app.post('/api/contracts', async (req, res) => {
  try {
    const { address, abi } = req.body
    
    // Save contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({ address, abi, user_id: 'demo-user' })
      .select()
      .single()
    
    if (error) throw error
    
    // Start listening immediately
    await startListening(contract.id, address, abi)
    
    console.log(`Added and started listening to contract ${contract.id}`)
    res.json(contract)
  } catch (error) {
    console.error('Error adding contract:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get contract events
app.get('/api/contracts/:id/events', async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('contract_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to last 50 events
    
    if (error) throw error
    res.json(events)
  } catch (error) {
    console.error('Error getting events:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all contracts
app.get('/api/contracts', async (req, res) => {
  try {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    res.json(contracts)
  } catch (error) {
    console.error('Error getting contracts:', error)
    res.status(500).json({ error: error.message })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    activeListeners: getActiveListenersCount(),
    timestamp: new Date().toISOString()
  })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Starting event listeners for existing contracts...')
  
  // THIS IS THE KEY PART - Start listening to all existing contracts
  await startAllListeners()
  
  console.log(`Server ready! Active listeners: ${getActiveListenersCount()}`)
})