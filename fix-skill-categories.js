const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSkillCategories() {
  try {
    // Define proper categorization
    const updates = [
      // Configuration/Tool files
      { name: 'procfile', category: 'Configuration' },
      { name: 'batchfile', category: 'Scripting' },
      { name: 'powershell', category: 'Scripting' },
      { name: 'ejs', category: 'Template Engine' },
      { name: 'jupyter notebook', category: 'Data Science Tool' },

      // Keep these as Programming Languages
      { name: 'html', category: 'Markup Language' },
      { name: 'css', category: 'Styling Language' },
      { name: 'javascript', category: 'Programming Language' },
      { name: 'typescript', category: 'Programming Language' },
      { name: 'python', category: 'Programming Language' },

      // Frameworks stay as is
      { name: 'django', category: 'Framework' },
      { name: 'express', category: 'Framework' },
      { name: 'nextjs', category: 'Framework' },
      { name: 'react', category: 'Framework' }
    ]

    console.log('Updating skill categories...\n')

    for (const update of updates) {
      const result = await prisma.skill.updateMany({
        where: { name: update.name },
        data: {
          category: update.category,
          description: `${update.name.charAt(0).toUpperCase() + update.name.slice(1)} - ${update.category}`
        }
      })

      if (result.count > 0) {
        console.log(`✓ Updated ${update.name} to category: ${update.category}`)
      }
    }

    // List updated categories
    console.log('\n\nUpdated skill categories:')
    console.log('=' .repeat(50))

    const skills = await prisma.skill.findMany({
      orderBy: { category: 'asc' }
    })

    const byCategory = {}
    skills.forEach(skill => {
      if (!byCategory[skill.category]) {
        byCategory[skill.category] = []
      }
      byCategory[skill.category].push(skill.name)
    })

    Object.entries(byCategory).forEach(([category, skillList]) => {
      console.log(`\n${category}: (${skillList.length} skills)`)
      skillList.forEach(name => {
        console.log(`  - ${name}`)
      })
    })

    console.log('\nTotal skills:', skills.length)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSkillCategories()