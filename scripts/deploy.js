import { listProjects, getProject, createProject, addEnvVar } from '../src/lib/vercel-api.js'

async function deploy() {
  const projectName = 'financas-app'
  
  try {
    console.log('🔍 Checking if project exists...')
    let project
    try {
      project = await getProject(projectName)
      console.log('✅ Project found:', project.name)
    } catch (error) {
      console.log('📝 Creating new project...')
      project = await createProject(projectName, { framework: 'nextjs' })
      console.log('✅ Project created:', project.name)
    }

    console.log('⚙️ Setting up environment variables...')
    
    // Add essential environment variables (you should set these in your .env file)
    const envVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'VERCEL_TOKEN'
    ]

    for (const envVar of envVars) {
      const value = process.env[envVar]
      if (value) {
        try {
          await addEnvVar(projectName, envVar, value)
          console.log(`✅ Set ${envVar}`)
        } catch (error) {
          console.log(`⚠️ Could not set ${envVar}:`, error.message)
        }
      } else {
        console.log(`⚠️ Missing ${envVar} in environment`)
      }
    }

    console.log('🚀 Ready for deployment!')
    console.log('To complete the deployment, run:')
    console.log('npx vercel --prod')
    
  } catch (error) {
    console.error('❌ Deployment setup failed:', error.message)
    process.exit(1)
  }
}

deploy()
