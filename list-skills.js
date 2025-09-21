const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listSkills() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: 'asc' }
    })

    console.log('All skills in database:')
    console.log('=' .repeat(50))

    const byCategory = {}
    skills.forEach(skill => {
      if (!byCategory[skill.category]) {
        byCategory[skill.category] = []
      }
      byCategory[skill.category].push(skill.name)
    })

    Object.entries(byCategory).forEach(([category, skillList]) => {
      console.log(`\n${category}:`)
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

listSkills()