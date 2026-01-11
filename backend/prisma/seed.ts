import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============ CONFIGURATION ============
// Adjust these numbers to control data volume
const FOLDER_COUNT = 10_000;  // Change: 1000, 10000, 50000, 100000
const FILE_COUNT = 50_000;    // Change: 5000, 50000, 100000, 500000
const MAX_DEPTH = 8;          // Maximum folder nesting depth
const BATCH_SIZE = 1000;      // Insert batch size for performance
// =======================================

const folderPrefixes = [
  "Documents", "Projects", "Reports", "Assets", "Media", "Archive", 
  "Backup", "Temp", "Work", "Personal", "Client", "Data", "Images",
  "Videos", "Music", "Downloads", "Templates", "Configs", "Logs",
  "Build", "Dist", "Source", "Tests", "Docs", "Resources", "Public"
];

const filePrefixes = [
  "report", "document", "invoice", "contract", "presentation", "data",
  "config", "readme", "notes", "summary", "analysis", "proposal",
  "budget", "plan", "schedule", "image", "video", "backup", "export"
];

const fileExtensions = [
  ".pdf", ".docx", ".xlsx", ".txt", ".md", ".json", ".csv",
  ".png", ".jpg", ".mp4", ".zip", ".html", ".xml", ".yaml"
];

const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateFolderName(index: number): string {
  const prefix = randomElement(folderPrefixes);
  const suffix = randomInt(1, 999);
  return `${prefix}_${suffix}_${index}`;
}

function generateFileName(index: number): string {
  const prefix = randomElement(filePrefixes);
  const ext = randomElement(fileExtensions);
  const suffix = randomInt(1, 9999);
  return `${prefix}_${suffix}_${index}${ext}`;
}

async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  await prisma.file.deleteMany();
  await prisma.folder.deleteMany();
}

async function seedFolders(): Promise<number[]> {
  console.log(`📁 Creating ${FOLDER_COUNT.toLocaleString()} folders...`);
  const startTime = Date.now();
  
  const folderIds: number[] = [];
  const depthMap = new Map<number, number>(); // folderId -> depth
  
  // Create folders in batches
  for (let batch = 0; batch < Math.ceil(FOLDER_COUNT / BATCH_SIZE); batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, FOLDER_COUNT);
    
    const foldersToCreate: { name: string; parentId: number | null }[] = [];
    
    for (let i = batchStart; i < batchEnd; i++) {
      let parentId: number | null = null;
      
      // First 20 folders are root level
      if (i >= 20 && folderIds.length > 0) {
        // Find a parent with acceptable depth
        const maxAttempts = 10;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const candidateId = randomElement(folderIds);
          const candidateDepth = depthMap.get(candidateId) ?? 0;
          if (candidateDepth < MAX_DEPTH) {
            parentId = candidateId;
            break;
          }
        }
      }
      
      foldersToCreate.push({
        name: generateFolderName(i),
        parentId
      });
    }
    
    // Bulk insert
    const created = await prisma.$transaction(
      foldersToCreate.map(data => prisma.folder.create({ data, select: { id: true, parentId: true } }))
    );
    
    // Track IDs and depths
    for (const folder of created) {
      folderIds.push(folder.id);
      const parentDepth = folder.parentId ? (depthMap.get(folder.parentId) ?? 0) : 0;
      depthMap.set(folder.id, parentDepth + 1);
    }
    
    const progress = Math.round((batchEnd / FOLDER_COUNT) * 100);
    process.stdout.write(`\r   Progress: ${progress}% (${batchEnd.toLocaleString()}/${FOLDER_COUNT.toLocaleString()})`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n   ✅ Created ${folderIds.length.toLocaleString()} folders in ${elapsed}s`);
  
  return folderIds;
}

async function seedFiles(folderIds: number[]) {
  console.log(`📄 Creating ${FILE_COUNT.toLocaleString()} files...`);
  const startTime = Date.now();
  
  let created = 0;
  
  for (let batch = 0; batch < Math.ceil(FILE_COUNT / BATCH_SIZE); batch++) {
    const batchStart = batch * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, FILE_COUNT);
    const batchCount = batchEnd - batchStart;
    
    const filesToCreate: { name: string; folderId: number }[] = [];
    
    for (let i = batchStart; i < batchEnd; i++) {
      filesToCreate.push({
        name: generateFileName(i),
        folderId: randomElement(folderIds)
      });
    }
    
    await prisma.file.createMany({ data: filesToCreate });
    created += batchCount;
    
    const progress = Math.round((created / FILE_COUNT) * 100);
    process.stdout.write(`\r   Progress: ${progress}% (${created.toLocaleString()}/${FILE_COUNT.toLocaleString()})`);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n   ✅ Created ${created.toLocaleString()} files in ${elapsed}s`);
}

async function showStats() {
  const folderCount = await prisma.folder.count();
  const fileCount = await prisma.file.count();
  const rootFolders = await prisma.folder.count({ where: { parentId: null } });
  
  console.log("\n📊 Database Statistics:");
  console.log(`   Total folders: ${folderCount.toLocaleString()}`);
  console.log(`   Root folders: ${rootFolders.toLocaleString()}`);
  console.log(`   Total files: ${fileCount.toLocaleString()}`);
  console.log(`   Avg files per folder: ${(fileCount / folderCount).toFixed(1)}`);
}

async function main() {
  console.log("\n🚀 Starting database seed...\n");
  console.log(`   Configuration:`);
  console.log(`   - Folders: ${FOLDER_COUNT.toLocaleString()}`);
  console.log(`   - Files: ${FILE_COUNT.toLocaleString()}`);
  console.log(`   - Max depth: ${MAX_DEPTH}`);
  console.log(`   - Batch size: ${BATCH_SIZE.toLocaleString()}\n`);
  
  const totalStart = Date.now();
  
  await clearDatabase();
  const folderIds = await seedFolders();
  await seedFiles(folderIds);
  await showStats();
  
  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(2);
  console.log(`\n✨ Seed completed in ${totalElapsed}s\n`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
