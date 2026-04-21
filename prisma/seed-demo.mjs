import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function todayAt(hours, minutes) {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  return d
}

async function ensureUser({
  username,
  password,
  role,
  firstName,
  lastName,
  email,
  securityQuestion,
  securityAnswer,
}) {
  const passwordHash = await bcrypt.hash(password, 10)
  const securityAnswerHash = securityAnswer
    ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10)
    : null

  return prisma.user.upsert({
    where: { username },
    update: {
      firstName,
      lastName,
      email,
      role,
      isActive: true,
      passwordHash,
      securityQuestion: securityQuestion || null,
      securityAnswerHash,
    },
    create: {
      username,
      firstName,
      lastName,
      email,
      role,
      isActive: true,
      passwordHash,
      securityQuestion: securityQuestion || null,
      securityAnswerHash,
    },
  })
}

async function upsertEvent({ slug, data }) {
  return prisma.event.upsert({
    where: { slug },
    update: data,
    create: { slug, ...data },
  })
}

async function seedParticipants(eventId, entries) {
  for (const entry of entries) {
    await prisma.participant.upsert({
      where: {
        eventId_email: {
          eventId,
          email: entry.email,
        },
      },
      update: {
        fullName: entry.fullName,
        mobileNo: entry.mobileNo,
        whatsappNo: entry.whatsappNo,
        instituteName: entry.instituteName,
        roleLabel: entry.roleLabel,
      },
      create: {
        eventId,
        ...entry,
      },
    })
  }
}

async function main() {
  const superAdmin = await ensureUser({
    username: 'superadmin',
    password: 'superadmin@2014',
    role: 'SUPER_ADMIN',
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@example.com',
  })

  const admin = await ensureUser({
    username: 'admin',
    password: 'admin@123',
    role: 'ADMIN',
    firstName: 'Demo',
    lastName: 'Admin',
    email: 'admin@example.com',
    securityQuestion: 'What was your first school name?',
    securityAnswer: 'demo',
  })

  const approvedEvent = await upsertEvent({
    slug: 'fdp-data-analysis-demo',
    data: {
      name: 'FDP: Data Analysis with R (Demo)',
      mode: 'ONLINE',
      fromDate: todayAt(10, 0),
      toDate: todayAt(16, 0),
      posterUrl: null,
      meetingLink: 'https://meet.google.com/demo-r-studio',
      contactEmail: 'fdp-demo@example.com',
      contactMobile: '9876543210',
      organizerFirstName: 'Demo',
      organizerLastName: 'Coordinator',
      organizerInstitute: 'SRM IST',
      organizerDepartment: 'Business Administration',
      organizerAddress: 'Ramapuram, Chennai',
      status: 'APPROVED',
      approvedAt: new Date(),
      createdById: admin.id,
      approvedById: superAdmin.id,
    },
  })

  const workshopEvent = await upsertEvent({
    slug: 'ai-workshop-demo',
    data: {
      name: 'AI Tools for Academia (Demo)',
      mode: 'HYBRID',
      fromDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
      posterUrl: null,
      meetingLink: 'https://zoom.us/j/1234567890',
      contactEmail: 'ai-workshop@example.com',
      contactMobile: '9988776655',
      organizerFirstName: 'Demo',
      organizerLastName: 'Organizer',
      organizerInstitute: 'SRM IST',
      organizerDepartment: 'Computer Science',
      organizerAddress: 'Kattankulathur, Chennai',
      status: 'APPROVED',
      approvedAt: new Date(),
      createdById: admin.id,
      approvedById: superAdmin.id,
    },
  })

  await upsertEvent({
    slug: 'pending-faculty-orientation-demo',
    data: {
      name: 'Faculty Orientation Program (Pending Demo)',
      mode: 'OFFLINE',
      fromDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
      posterUrl: null,
      meetingLink: null,
      contactEmail: 'orientation@example.com',
      contactMobile: '9090909090',
      organizerFirstName: 'Demo',
      organizerLastName: 'Pending',
      organizerInstitute: 'SRM IST',
      organizerDepartment: 'MBA',
      organizerAddress: 'Ramapuram, Chennai',
      status: 'PENDING',
      approvedAt: null,
      createdById: admin.id,
      approvedById: null,
    },
  })

  await seedParticipants(approvedEvent.id, [
    {
      fullName: 'Aarav Kumar',
      email: 'aarav.kumar@example.com',
      mobileNo: '9876500011',
      whatsappNo: '9876500011',
      instituteName: 'SRM IST',
      roleLabel: 'Student',
    },
    {
      fullName: 'Diya Raman',
      email: 'diya.raman@example.com',
      mobileNo: '9876500012',
      whatsappNo: '9876500012',
      instituteName: 'Anna University',
      roleLabel: 'Research Scholar',
    },
    {
      fullName: 'Prof. Meena Iyer',
      email: 'meena.iyer@example.com',
      mobileNo: '9876500013',
      whatsappNo: '9876500013',
      instituteName: 'IIT Madras',
      roleLabel: 'Professor',
    },
  ])

  await seedParticipants(workshopEvent.id, [
    {
      fullName: 'Rahul Nair',
      email: 'rahul.nair@example.com',
      mobileNo: '9876500021',
      whatsappNo: '9876500021',
      instituteName: 'VIT',
      roleLabel: 'Assistant Professor',
    },
    {
      fullName: 'Nisha Patel',
      email: 'nisha.patel@example.com',
      mobileNo: '9876500022',
      whatsappNo: '9876500022',
      instituteName: 'PSG Tech',
      roleLabel: 'Student',
    },
  ])

  console.log('Demo seed complete')
  console.log('Admin login: admin / admin@123')
  console.log('Super admin login: superadmin / superadmin@2014')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
