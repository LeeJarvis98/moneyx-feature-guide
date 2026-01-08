import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  students: number;
  rating: number;
  image: string;
  articlePath: string;
  type: string;
}

// Helper function to extract h1 content from HTML
function extractH1FromHTML(html: string): string | null {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return h1Match ? h1Match[1].trim() : null;
}

// Helper function to extract description from HTML
function extractDescriptionFromHTML(html: string): string {
  const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (pMatch) {
    const text = pMatch[1].replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }
  return 'Learn more about this topic';
}

// Helper function to determine course type and level
function getCourseTypeAndLevel(title: string): { type: string; level: 'beginner' | 'intermediate' | 'advanced' } {
  const lowerTitle = title.toLowerCase();
  
  // Determine type
  let type = 'other';
  if (lowerTitle.includes('lesson')) {
    type = 'lesson';
  } else if (lowerTitle.includes('guide')) {
    type = 'guide';
  } else if (lowerTitle.includes('strategy')) {
    type = 'strategy';
  }
  
  // Determine level based on type and number
  let level: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  
  if (type === 'lesson') {
    const lessonMatch = title.match(/lesson\s*(\d+)/i);
    if (lessonMatch) {
      const lessonNum = parseInt(lessonMatch[1]);
      if (lessonNum === 1) level = 'beginner';
      else if (lessonNum === 2) level = 'intermediate';
      else if (lessonNum >= 3) level = 'advanced';
    }
  } else if (type === 'guide') {
    level = 'beginner';
  } else if (type === 'strategy') {
    level = 'intermediate';
  }
  
  return { type, level };
}

// Image mapping based on type
const getImageForType = (type: string, index: number): string => {
  const images = {
    lesson: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&q=80',
      'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=500&q=80',
    ],
    guide: [
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
    ],
    strategy: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=80',
      'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&q=80',
      'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=500&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&q=80',
    ],
  };
  
  const typeImages = images[type as keyof typeof images] || images.lesson;
  return typeImages[index % typeImages.length];
};

// Generate random but consistent stats based on filename
function generateStats(filename: string): { students: number; rating: number; duration: string } {
  const hash = filename.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return {
    students: 500 + (hash % 1000),
    rating: 4.5 + (hash % 5) / 10,
    duration: `${3 + (hash % 6)} hours`,
  };
}

export async function GET() {
  try {
    const articlesDir = path.join(process.cwd(), 'public', 'articles');
    const files = fs.readdirSync(articlesDir).filter(file => file.endsWith('.html'));
    
    const courses: Course[] = files.map((filename, index) => {
      const filePath = path.join(articlesDir, filename);
      const html = fs.readFileSync(filePath, 'utf-8');
      
      const h1Title = extractH1FromHTML(html);
      const title = h1Title || filename.replace('.html', '').replace(/-/g, ' ');
      const description = extractDescriptionFromHTML(html);
      const { type, level } = getCourseTypeAndLevel(title);
      const stats = generateStats(filename);
      
      return {
        id: filename.replace('.html', ''),
        title,
        description,
        duration: stats.duration,
        level,
        students: stats.students,
        rating: stats.rating,
        image: getImageForType(type, index),
        articlePath: `/articles/${filename}`,
        type,
      };
    });
    
    // Sort by type and then by number
    courses.sort((a, b) => {
      const typeOrder = { lesson: 1, guide: 2, strategy: 3, other: 4 };
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] || 4;
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] || 4;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      
      // Extract numbers for sorting within same type
      const aNum = parseInt(a.id.match(/\d+/)?.[0] || '0');
      const bNum = parseInt(b.id.match(/\d+/)?.[0] || '0');
      return aNum - bNum;
    });
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error reading articles:', error);
    return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 });
  }
}
