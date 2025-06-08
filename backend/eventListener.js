// eventListener.js
import { createPublicClient, http } from 'viem'
import { createClient } from '@supabase/supabase-js'
import { ETHEREUM_RPC_URL } from './config.js'

const client = createPublicClient({
  transport: http(ETHEREUM_RPC_URL)
})

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

// Store all active listeners
const activeListeners = new Map()

// Helper function to convert BigInt to string
function convertBigIntsToStrings(obj) {
  if (obj === null || obj === undefined) return obj
  
  if (typeof obj === 'bigint') {
    return obj.toString()
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntsToStrings)
  }
  
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntsToStrings(value)
    }
    return converted
  }
  
  return obj
}

export async function startListening(contractId, address, abi) {
  console.log(`Starting to listen to contract ${contractId}: ${address}`)
  
  // Get all events from ABI
  const events = abi.filter(item => item.type === 'event')
  
  for (const event of events) {
    const unwatch = client.watchContractEvent({
      address,
      abi: [event],
      eventName: event.name,
      onLogs: async (logs) => {
        console.log(`New ${event.name} events for contract ${contractId}:`, logs.length)
        
        // Save each log to database
        for (const log of logs) {
          try {
            await supabase.from('events').insert({
              contract_id: contractId,
              event_name: log.eventName,
              event_data: convertBigIntsToStrings(log.args), // Convert BigInts
              transaction_hash: log.transactionHash,
              block_number: log.blockNumber.toString() // Convert BigInt to string
            })
          } catch (error) {
            console.error('Error saving event:', error)
          }
        }
      },
      onError: (error) => {
        console.error(`Error listening to ${event.name} on contract ${contractId}:`, error)
      }
    })
    
    // Store the unwatch function
    const key = `${contractId}-${event.name}`
    activeListeners.set(key, unwatch)
  }
}

export async function stopListening(contractId) {
  console.log(`Stopping listeners for contract ${contractId}`)
  
  // Find all listeners for this contract
  const keysToRemove = []
  for (const [key, unwatch] of activeListeners) {
    if (key.startsWith(`${contractId}-`)) {
      unwatch() // Stop listening
      keysToRemove.push(key)
    }
  }
  
  // Remove from our tracking
  keysToRemove.forEach(key => activeListeners.delete(key))
}

export async function startAllListeners() {
  console.log('Loading all existing contracts...')
  
  // Get all contracts from database
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select('*')
  
  if (error) {
    console.error('Error loading contracts:', error)
    return
  }
  
  console.log(`Found ${contracts.length} contracts to monitor`)
  
  // Start listening to each contract
  for (const contract of contracts) {
    try {
      await startListening(contract.id, contract.address, contract.abi)
    } catch (error) {
      console.error(`Failed to start listening to contract ${contract.id}:`, error)
    }
  }
  
  console.log('All listeners started!')
}

export function getActiveListenersCount() {
  return activeListeners.size
}