import { createClient } from '@supabase/supabase-js'
import logger from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced Supabase client with logging
class SupabaseWrapper {
  constructor(client) {
    this.client = client
    this.setupLogging()
  }

  setupLogging() {
    // Track auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      logger.info('Auth State Change', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
        type: 'auth_state_change'
      })
    })
  }

  // Proxy all client properties and methods
  get auth() {
    return this.enhanceAuth(this.client.auth)
  }

  get storage() {
    return this.client.storage
  }

  get functions() {
    return this.client.functions
  }

  get realtime() {
    return this.client.realtime
  }

  enhanceAuth(auth) {
    const originalSignIn = auth.signInWithPassword.bind(auth)
    const originalSignUp = auth.signUp.bind(auth)
    const originalSignOut = auth.signOut.bind(auth)
    const originalGetUser = auth.getUser.bind(auth)

    return {
      ...auth,
      
      signInWithPassword: async (credentials) => {
        const start = performance.now()
        logger.action('Sign In Attempt', { email: credentials.email })
        
        try {
          const result = await originalSignIn(credentials)
          const duration = performance.now() - start
          
          if (result.error) {
            logger.supabaseError('Sign In', result.error, { email: credentials.email, duration })
          } else {
            logger.info('Sign In Success', { 
              userId: result.data.user?.id, 
              email: result.data.user?.email,
              duration,
              type: 'auth_success'
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - start
          logger.error('Sign In Exception', { error: error.message, duration })
          throw error
        }
      },

      signUp: async (credentials) => {
        const start = performance.now()
        logger.action('Sign Up Attempt', { email: credentials.email })
        
        try {
          const result = await originalSignUp(credentials)
          const duration = performance.now() - start
          
          if (result.error) {
            logger.supabaseError('Sign Up', result.error, { email: credentials.email, duration })
          } else {
            logger.info('Sign Up Success', { 
              userId: result.data.user?.id,
              email: result.data.user?.email,
              duration,
              type: 'auth_success'
            })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - start
          logger.error('Sign Up Exception', { error: error.message, duration })
          throw error
        }
      },

      signOut: async () => {
        const start = performance.now()
        logger.action('Sign Out Attempt')
        
        try {
          const result = await originalSignOut()
          const duration = performance.now() - start
          
          if (result.error) {
            logger.supabaseError('Sign Out', result.error, { duration })
          } else {
            logger.info('Sign Out Success', { duration, type: 'auth_success' })
          }
          
          return result
        } catch (error) {
          const duration = performance.now() - start
          logger.error('Sign Out Exception', { error: error.message, duration })
          throw error
        }
      },

      getUser: async () => {
        try {
          const result = await originalGetUser()
          
          if (result.error) {
            logger.supabaseError('Get User', result.error)
          }
          
          return result
        } catch (error) {
          logger.error('Get User Exception', { error: error.message })
          throw error
        }
      },

      onAuthStateChange: (callback) => {
        return auth.onAuthStateChange(callback)
      },

      getSession: async () => {
        try {
          const result = await auth.getSession()
          
          if (result.error) {
            logger.supabaseError('Get Session', result.error)
          }
          
          return result
        } catch (error) {
          logger.error('Get Session Exception', { error: error.message })
          throw error
        }
      }
    }
  }

  // Enhanced from method with logging
  from(table) {
    const query = this.client.from(table)
    return this.enhanceQuery(query, table)
  }

  enhanceQuery(query, table) {
    const originalSelect = query.select.bind(query)
    const originalInsert = query.insert.bind(query)
    const originalUpdate = query.update.bind(query)
    const originalDelete = query.delete.bind(query)

    return {
      ...query,

      select: (columns) => {
        const enhancedQuery = originalSelect(columns)
        return this.enhanceQueryExecution(enhancedQuery, 'SELECT', table, { columns })
      },

      insert: (data) => {
        const enhancedQuery = originalInsert(data)
        return this.enhanceQueryExecution(enhancedQuery, 'INSERT', table, { data })
      },

      update: (data) => {
        const enhancedQuery = originalUpdate(data)
        return this.enhanceQueryExecution(enhancedQuery, 'UPDATE', table, { data })
      },

      delete: () => {
        const enhancedQuery = originalDelete()
        return this.enhanceQueryExecution(enhancedQuery, 'DELETE', table, {})
      }
    }
  }

  enhanceQueryExecution(query, operation, table, params) {
    // Chain all query methods
    const methods = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'rangeLt', 'rangeGt', 'rangeGte', 'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match', 'not', 'or', 'filter', 'order', 'limit', 'range', 'single', 'maybeSingle', 'select']
    
    const enhancedQuery = { ...query }
    
    methods.forEach(method => {
      if (query[method]) {
        enhancedQuery[method] = (...args) => {
          const result = query[method](...args)
          return this.enhanceQueryExecution(result, operation, table, params)
        }
      }
    })

    // Override the final execution methods
    const originalThen = query.then?.bind(query)
    
    if (originalThen) {
      enhancedQuery.then = (onSuccess, onError) => {
        const start = performance.now()
        
        logger.debug('Database Query Start', {
          operation,
          table,
          params,
          type: 'db_query_start'
        })

        return originalThen(
          (result) => {
            const duration = performance.now() - start
            
            if (result.error) {
              logger.supabaseError(`${operation} ${table}`, result.error, {
                params,
                duration,
                type: 'db_error'
              })
            } else {
              logger.debug('Database Query Success', {
                operation,
                table,
                duration,
                recordCount: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
                type: 'db_query_success'
              })
            }
            
            return onSuccess ? onSuccess(result) : result
          },
          (error) => {
            const duration = performance.now() - start
            logger.error('Database Query Exception', {
              operation,
              table,
              error: error.message,
              duration,
              type: 'db_exception'
            })
            
            return onError ? onError(error) : Promise.reject(error)
          }
        )
      }
    }

    return enhancedQuery
  }
}

// Export the enhanced client
export const supabase = new SupabaseWrapper(supabaseClient)