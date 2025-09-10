// src/app/api/pages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'
import { MetaGraphAPI, TokenEncryption } from '@/lib/meta'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's pages with post counts
    const pages = await prisma.page.findMany({
      where: { ownerUserId: user.id },
      include: {
        _count: {
          select: { posts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ pages })

  } catch (error) {
    console.error('Error fetching pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { pageId, platform, name, accessToken } = body

    // Validate required fields
    if (!pageId || !platform || !name || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Encrypt the access token
    const encryptedToken = TokenEncryption.encrypt(accessToken)

    // Create or update page
    const page = await prisma.page.upsert({
      where: {
        externalId_platform: {
          externalId: pageId,
          platform: platform
        }
      },
      update: {
        name,
        pageAccessToken: encryptedToken,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        platform,
        externalId: pageId,
        name,
        pageAccessToken: encryptedToken,
        ownerUserId: user.id,
        isActive: true
      }
    })

    return NextResponse.json({ page })

  } catch (error) {
    console.error('Error creating/updating page:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

